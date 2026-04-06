package com.qdaria.zipminator

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
    private var onDevicePlugin: OnDeviceInferencePlugin? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        onDevicePlugin = OnDeviceInferencePlugin(this, flutterEngine)
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        onDevicePlugin?.dispose()
        onDevicePlugin = null
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
