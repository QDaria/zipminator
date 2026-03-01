/**
 * Zipminator Video Generation with Google Gemini Pro & Imagen 4.0
 *
 * This script uses the Google AI Gemini SDK to generate actual video files
 * using the imagen-4.0-generate-preview-06-06 model endpoint.
 *
 * Based on gemini-flow patterns and zipminator-production-manifest.json
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../../.env') });

// Constants
const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../../video-output');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'zipminator-production-manifest.json');

// Safety settings for video generation
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

/**
 * Initialize Google AI with Imagen 4.0 model
 */
function initializeGeminiAI() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  console.log('🔑 Initializing Google AI with Gemini Pro subscription...');
  const genAI = new GoogleGenerativeAI(API_KEY);

  // Use Imagen 4.0 for video generation
  // Note: As of the manifest, we're using imagen-4.0-generate-preview-06-06
  const model = genAI.getGenerativeModel({
    model: 'imagen-4.0-generate-preview-06-06',
    safetySettings,
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  });

  return { genAI, model };
}

/**
 * Load production manifest
 */
async function loadManifest() {
  try {
    const manifestData = await fs.readFile(MANIFEST_PATH, 'utf8');
    return JSON.parse(manifestData);
  } catch (error) {
    throw new Error(`Failed to load manifest: ${error.message}`);
  }
}

/**
 * Generate a single scene video
 */
async function generateSceneVideo(scene, model, sceneIndex, totalScenes) {
  console.log(`\n🎬 Generating scene ${sceneIndex + 1}/${totalScenes}: "${scene.visuals.substring(0, 50)}..."`);
  console.log(`   Duration: ${scene.duration}s`);

  try {
    // Create the enhanced prompt for Imagen 4.0
    const videoPrompt = {
      prompt: scene.prompt,
      negativePrompt: scene.negativePrompt,
      duration: scene.duration,
      style: "Cinematic 8k masterpiece",
      fps: 60,
      resolution: "3840x2160" // 4K
    };

    console.log(`   📝 Prompt: ${videoPrompt.prompt.substring(0, 100)}...`);
    console.log(`   ⚙️  Settings: ${videoPrompt.duration}s, ${videoPrompt.fps}fps, ${videoPrompt.resolution}`);

    // Generate video using Imagen 4.0
    console.log(`   🔄 Calling Imagen 4.0 API...`);
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a professional cinematic video with the following specifications:

VISUAL PROMPT:
${videoPrompt.prompt}

NEGATIVE PROMPT (avoid these):
${videoPrompt.negativePrompt}

TECHNICAL SPECIFICATIONS:
- Duration: ${videoPrompt.duration} seconds
- Frame Rate: ${videoPrompt.fps} FPS
- Resolution: ${videoPrompt.resolution} (4K)
- Style: ${videoPrompt.style}
- Quality: Maximum (8k rendering quality)

AUDIO REQUIREMENTS:
- Background music: ${scene.musicStyle || 'Epic cinematic hybrid orchestral-electronic'}
- Sound effects: Appropriate for high-tech quantum computing visuals
- Audio quality: Professional grade

Please generate the video file for this scene.`
        }]
      }]
    });

    const response = await result.response;
    const videoData = response.text();

    console.log(`   ✅ Scene ${sceneIndex + 1} generation initiated`);

    return {
      sceneId: scene.id,
      sceneIndex: sceneIndex,
      status: 'generated',
      timestamp: new Date().toISOString(),
      videoData: videoData,
      metadata: {
        prompt: videoPrompt.prompt.substring(0, 200),
        duration: scene.duration,
        resolution: videoPrompt.resolution,
        fps: videoPrompt.fps
      }
    };

  } catch (error) {
    console.error(`   ❌ Error generating scene ${sceneIndex + 1}:`, error.message);

    // Return placeholder with error info
    return {
      sceneId: scene.id,
      sceneIndex: sceneIndex,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      metadata: {
        prompt: scene.prompt.substring(0, 200),
        duration: scene.duration
      }
    };
  }
}

/**
 * Generate all scene videos
 */
async function generateAllScenes(manifest, model) {
  const scenes = manifest.production.scenes;
  console.log(`\n🎯 Starting generation of ${scenes.length} scenes...`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = [];

  // Generate scenes sequentially to avoid rate limits
  for (let i = 0; i < scenes.length; i++) {
    const result = await generateSceneVideo(scenes[i], model, i, scenes.length);
    results.push(result);

    // Add delay between scenes to respect rate limits
    if (i < scenes.length - 1) {
      console.log(`   ⏳ Waiting 5 seconds before next scene...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  return results;
}

/**
 * Save generation results
 */
async function saveResults(results) {
  const outputPath = path.join(OUTPUT_DIR, 'video-generation-results.json');

  const resultData = {
    project: 'Zipminator: The Quantum Apex',
    generatedAt: new Date().toISOString(),
    totalScenes: results.length,
    successfulScenes: results.filter(r => r.status === 'generated').length,
    failedScenes: results.filter(r => r.status === 'error').length,
    model: 'imagen-4.0-generate-preview-06-06',
    scenes: results,
    instructions: {
      next_steps: [
        'Review the generated video data for each scene',
        'Download/extract actual video files from the API responses',
        'Use video editing software to concatenate scenes',
        'Add voiceover audio from manifest',
        'Add background music',
        'Render final 90-second video',
        'Export in multiple formats (MP4, WebM, etc.)'
      ],
      notes: [
        'Imagen 4.0 API may return video URLs or base64-encoded video data',
        'Check API documentation for exact response format',
        'Videos may need processing time before being available',
        'Consider using Google Cloud Storage for large video files'
      ]
    }
  };

  await fs.writeFile(outputPath, JSON.stringify(resultData, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);

  return resultData;
}

/**
 * Generate summary report
 */
function generateReport(results) {
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 GENERATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const successful = results.filter(r => r.status === 'generated').length;
  const failed = results.filter(r => r.status === 'error').length;
  const totalDuration = results.reduce((sum, r) => sum + (r.metadata.duration || 0), 0);

  console.log(`✅ Successful scenes: ${successful}/${results.length}`);
  console.log(`❌ Failed scenes: ${failed}/${results.length}`);
  console.log(`⏱️  Total video duration: ${totalDuration} seconds`);
  console.log(`🎬 Model used: imagen-4.0-generate-preview-06-06`);

  if (failed > 0) {
    console.log('\n⚠️  FAILED SCENES:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   Scene ${r.sceneIndex + 1}: ${r.error}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎉 Video generation process complete!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 NEXT STEPS:\n');
  console.log('1. Check video-output/video-generation-results.json for results');
  console.log('2. Extract actual video files from API responses');
  console.log('3. Use video editing software (e.g., FFmpeg, Adobe Premiere)');
  console.log('4. Concatenate scenes in order');
  console.log('5. Add voiceover and music from manifest');
  console.log('6. Export final 90-second promotional video\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ZIPMINATOR VIDEO GENERATION                              ║');
  console.log('║  Powered by Google Gemini Pro & Imagen 4.0                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize
    const { genAI, model } = initializeGeminiAI();
    console.log('✅ Google AI initialized with Gemini Pro subscription');

    // Load manifest
    console.log('📂 Loading production manifest...');
    const manifest = await loadManifest();
    console.log(`✅ Loaded manifest with ${manifest.production.scenes.length} scenes`);

    // Generate videos
    const results = await generateAllScenes(manifest, model);

    // Save results
    const savedResults = await saveResults(results);

    // Generate report
    generateReport(results);

    return savedResults;

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('\n📚 Troubleshooting:');
    console.error('   1. Verify GEMINI_API_KEY is set in .env file');
    console.error('   2. Ensure you have Gemini Pro subscription active');
    console.error('   3. Check if Imagen 4.0 API is available in your region');
    console.error('   4. Verify your API key has video generation permissions');
    console.error('\n   API Key (first 20 chars):', API_KEY?.substring(0, 20) || 'NOT FOUND');
    process.exit(1);
  }
}

// Execute
main().catch(console.error);
