package com.qdaria.zipminator

import android.content.Context
import android.os.Handler
import android.os.Looper
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Platform channel bridge for Google AI Edge LiteRT-LM on-device inference.
 *
 * Wraps the LiteRT-LM runtime to provide:
 * - Model download from HuggingFace
 * - Model loading/unloading
 * - Text generation (Gemma prompt format)
 *
 * Reference: https://github.com/google-ai-edge/gallery
 */
class OnDeviceInferencePlugin(
    private val context: Context,
    flutterEngine: FlutterEngine,
) : MethodChannel.MethodCallHandler {

    private val methodChannel =
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL_NAME)
    private val downloadEventChannel =
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, DOWNLOAD_CHANNEL)

    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    // LiteRT-LM engine handle (nullable when no model loaded).
    // Uses reflection to load com.google.ai.edge.litert.lm.LlmInference if available.
    private var inferenceSession: Any? = null
    private var loadedModelId: String? = null
    private var downloadEventSink: EventChannel.EventSink? = null

    init {
        methodChannel.setMethodCallHandler(this)
        downloadEventChannel.setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                downloadEventSink = events
            }
            override fun onCancel(arguments: Any?) {
                downloadEventSink = null
            }
        })
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "isAvailable" -> result.success(isRuntimeAvailable())
            "isModelLoaded" -> result.success(inferenceSession != null)
            "loadModel" -> {
                val modelPath = call.argument<String>("modelPath") ?: ""
                val accelerator = call.argument<String>("accelerator") ?: "auto"
                loadModel(modelPath, accelerator, result)
            }
            "unloadModel" -> {
                unloadModel()
                result.success(null)
            }
            "getModelInfo" -> result.success(getModelInfo())
            "generateText" -> {
                val prompt = call.argument<String>("prompt") ?: ""
                val maxTokens = call.argument<Int>("maxTokens") ?: 1024
                generateText(prompt, maxTokens, result)
            }
            "downloadModel" -> {
                val hfRepo = call.argument<String>("hfRepo") ?: ""
                val hfFilename = call.argument<String>("hfFilename") ?: ""
                val modelId = call.argument<String>("modelId") ?: ""
                downloadModel(hfRepo, hfFilename, modelId, result)
            }
            "listDownloadedModels" -> result.success(listDownloadedModels())
            "deleteModel" -> {
                val modelId = call.argument<String>("modelId") ?: ""
                deleteModel(modelId)
                result.success(null)
            }
            else -> result.notImplemented()
        }
    }

    // -- Runtime detection --

    private fun isRuntimeAvailable(): Boolean {
        return try {
            Class.forName("com.google.ai.edge.litert.lm.LlmInference")
            true
        } catch (_: ClassNotFoundException) {
            // LiteRT-LM SDK not bundled; fall back to MediaPipe check.
            try {
                Class.forName("com.google.mediapipe.tasks.genai.llminference.LlmInference")
                true
            } catch (_: ClassNotFoundException) {
                false
            }
        }
    }

    // -- Model lifecycle --

    private fun loadModel(modelPath: String, accelerator: String, result: MethodChannel.Result) {
        executor.execute {
            try {
                val file = resolveModelFile(modelPath)
                if (file == null || !file.exists()) {
                    mainHandler.post { result.error("MODEL_NOT_FOUND", "Model file not found: $modelPath", null) }
                    return@execute
                }

                // Attempt LiteRT-LM first, then MediaPipe.
                val session = createInferenceSession(file.absolutePath, accelerator)
                if (session != null) {
                    inferenceSession = session
                    loadedModelId = modelPath
                    mainHandler.post { result.success(true) }
                } else {
                    mainHandler.post { result.error("LOAD_FAILED", "Could not initialize inference engine", null) }
                }
            } catch (e: Exception) {
                mainHandler.post { result.error("LOAD_FAILED", e.message, null) }
            }
        }
    }

    private fun unloadModel() {
        try {
            val session = inferenceSession
            if (session != null) {
                // Call close() via reflection (works for both LiteRT and MediaPipe).
                session.javaClass.getMethod("close").invoke(session)
            }
        } catch (_: Exception) {
            // Best-effort cleanup.
        }
        inferenceSession = null
        loadedModelId = null
    }

    private fun getModelInfo(): Map<String, Any?> {
        return mapOf(
            "loaded" to (inferenceSession != null),
            "modelId" to loadedModelId,
        )
    }

    // -- Text generation --

    private fun generateText(prompt: String, maxTokens: Int, result: MethodChannel.Result) {
        val session = inferenceSession
        if (session == null) {
            result.error("MODEL_NOT_LOADED", "No model loaded. Download and load a model first.", null)
            return
        }

        executor.execute {
            try {
                val response = invokeGenerate(session, prompt, maxTokens)
                mainHandler.post { result.success(response) }
            } catch (e: Exception) {
                mainHandler.post { result.error("INFERENCE_FAILED", e.message, null) }
            }
        }
    }

    // -- Model download from HuggingFace --

    private fun downloadModel(
        hfRepo: String,
        hfFilename: String,
        modelId: String,
        result: MethodChannel.Result,
    ) {
        val modelsDir = File(context.filesDir, "on_device_models")
        modelsDir.mkdirs()
        val targetFile = File(modelsDir, "${modelId}.litertlm")

        if (targetFile.exists()) {
            sendDownloadEvent(1.0, targetFile.absolutePath, "complete")
            result.success(targetFile.absolutePath)
            return
        }

        result.success(null) // Acknowledge start; progress via EventChannel.

        executor.execute {
            try {
                val url = "https://huggingface.co/$hfRepo/resolve/main/$hfFilename"
                val conn = URL(url).openConnection() as HttpURLConnection
                conn.connectTimeout = 30_000
                conn.readTimeout = 60_000
                conn.setRequestProperty("User-Agent", "Zipminator/0.5")
                conn.connect()

                val totalBytes = conn.contentLengthLong
                val input = conn.inputStream
                val tempFile = File(modelsDir, "${modelId}.litertlm.tmp")
                val output = FileOutputStream(tempFile)

                val buffer = ByteArray(8192)
                var bytesRead: Long = 0

                while (true) {
                    val count = input.read(buffer)
                    if (count == -1) break
                    output.write(buffer, 0, count)
                    bytesRead += count

                    val progress = if (totalBytes > 0) bytesRead.toDouble() / totalBytes else 0.0
                    sendDownloadEvent(progress, null, "downloading")
                }

                output.flush()
                output.close()
                input.close()
                conn.disconnect()

                // Rename temp to final.
                tempFile.renameTo(targetFile)
                sendDownloadEvent(1.0, targetFile.absolutePath, "complete")
            } catch (e: Exception) {
                mainHandler.post {
                    downloadEventSink?.error("DOWNLOAD_FAILED", e.message, null)
                }
            }
        }
    }

    private fun sendDownloadEvent(progress: Double, path: String?, status: String) {
        mainHandler.post {
            downloadEventSink?.success(
                mapOf(
                    "progress" to progress,
                    "path" to path,
                    "status" to status,
                )
            )
        }
    }

    private fun listDownloadedModels(): List<String> {
        val modelsDir = File(context.filesDir, "on_device_models")
        if (!modelsDir.exists()) return emptyList()
        return modelsDir.listFiles()
            ?.filter { it.name.endsWith(".litertlm") }
            ?.map { it.nameWithoutExtension }
            ?: emptyList()
    }

    private fun deleteModel(modelId: String) {
        if (loadedModelId == modelId) unloadModel()
        val file = File(context.filesDir, "on_device_models/$modelId.litertlm")
        file.delete()
    }

    // -- LiteRT-LM / MediaPipe bridge (reflection-based) --

    private fun createInferenceSession(modelPath: String, accelerator: String): Any? {
        // Try LiteRT-LM first (newer API).
        try {
            val clazz = Class.forName("com.google.ai.edge.litert.lm.LlmInference")
            val optionsClass = Class.forName("com.google.ai.edge.litert.lm.LlmInference\$Options")
            val builder = optionsClass.getMethod("builder").invoke(null)
            builder.javaClass.getMethod("setModelPath", String::class.java).invoke(builder, modelPath)
            builder.javaClass.getMethod("setMaxTokens", Int::class.java).invoke(builder, 2048)
            val options = builder.javaClass.getMethod("build").invoke(builder)
            return clazz.getMethod("createFromOptions", Context::class.java, optionsClass)
                .invoke(null, context, options)
        } catch (_: Exception) {}

        // Fall back to MediaPipe LLM Inference API.
        try {
            val clazz = Class.forName("com.google.mediapipe.tasks.genai.llminference.LlmInference")
            val optionsClass = Class.forName(
                "com.google.mediapipe.tasks.genai.llminference.LlmInference\$LlmInferenceOptions"
            )
            val builder = optionsClass.getMethod("builder").invoke(null)
            builder.javaClass.getMethod("setModelPath", String::class.java).invoke(builder, modelPath)
            builder.javaClass.getMethod("setMaxTokens", Int::class.java).invoke(builder, 2048)
            val options = builder.javaClass.getMethod("build").invoke(builder)
            return clazz.getMethod("createFromOptions", Context::class.java, optionsClass)
                .invoke(null, context, options)
        } catch (_: Exception) {}

        return null
    }

    private fun invokeGenerate(session: Any, prompt: String, maxTokens: Int): String {
        // Both LiteRT-LM and MediaPipe use generateResponse(String).
        return try {
            session.javaClass.getMethod("generateResponse", String::class.java)
                .invoke(session, prompt) as? String ?: ""
        } catch (e: Exception) {
            throw RuntimeException("Inference failed: ${e.cause?.message ?: e.message}")
        }
    }

    private fun resolveModelFile(modelPathOrId: String): File? {
        // If it's an absolute path, use directly.
        val direct = File(modelPathOrId)
        if (direct.exists()) return direct

        // Otherwise treat as a model ID and look in our downloads directory.
        val stored = File(context.filesDir, "on_device_models/$modelPathOrId.litertlm")
        if (stored.exists()) return stored

        return null
    }

    fun dispose() {
        unloadModel()
        executor.shutdown()
    }

    companion object {
        const val CHANNEL_NAME = "com.qdaria.zipminator/on_device"
        const val DOWNLOAD_CHANNEL = "com.qdaria.zipminator/on_device_download"
    }
}
