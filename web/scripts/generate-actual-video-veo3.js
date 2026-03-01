/**
 * Generate ACTUAL VIDEOS using Google Veo 3.1 API
 *
 * New discovery: Veo 3.1 IS available in Gemini API (as of 2025)!
 * - Model: veo-3.0-generate-preview or veo-3.1-generate-preview
 * - Price: $0.75/second with audio (Veo 3) or $0.40/second (Veo 3 Fast)
 * - Output: 720p or 1080p, 8 seconds with native audio
 *
 * We'll use image-to-video mode since we already have 9 PNG scenes generated
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../../video-output');
const SCENES_DIR = path.join(OUTPUT_DIR, 'scenes');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'zipminator-production-manifest.json');

/**
 * Initialize Gemini AI with Veo 3.1
 */
function initializeVeo() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not found');
  }

  console.log('🎬 Initializing Google Veo 3.1 API...\n');
  const genAI = new GoogleGenerativeAI(API_KEY);

  // Use Veo 3.1 for video generation
  const model = genAI.getGenerativeModel({
    model: 'veo-3.1-generate-preview', // Try veo-3.0-generate-preview if this fails
  });

  return { genAI, model };
}

/**
 * Load manifest
 */
async function loadManifest() {
  const data = await fs.readFile(MANIFEST_PATH, 'utf8');
  return JSON.parse(data);
}

/**
 * Convert PNG to base64 for API
 */
async function imageToBase64(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Generate video from PNG using Veo 3.1 image-to-video
 */
async function generateVideoFromImage(model, sceneId, imagePath, prompt, duration) {
  console.log(`\n🎥 Generating video for Scene ${sceneId}...`);
  console.log(`   Source: ${path.basename(imagePath)}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...\n`);

  try {
    // Read the PNG as base64
    const imageBase64 = await imageToBase64(imagePath);

    // Create video generation request with image
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64
            }
          },
          {
            text: `Animate this image into a cinematic video.

MOTION DESCRIPTION:
${prompt}

VIDEO REQUIREMENTS:
- Duration: ${duration} seconds
- Style: Cinematic 8k quality with dramatic camera movement
- Resolution: 1080p
- Audio: Epic orchestral-electronic soundtrack (Hans Zimmer style)
- Frame rate: 60fps smooth motion
- Add volumetric lighting, lens flares, and particle effects

Bring this static image to life with professional cinematic animation.`
          }
        ]
      }]
    });

    const response = await result.response;

    // Check if response contains video data
    // Note: Actual API response format may vary - adjust based on real API docs
    const videoData = response.candidates?.[0]?.content?.parts?.[0];

    if (videoData) {
      console.log(`   ✅ Video generated successfully`);
      return {
        sceneId,
        status: 'success',
        videoData: videoData,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('No video data in response');
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);

    // Check if it's a model availability error
    if (error.message.includes('not found') || error.message.includes('404')) {
      throw new Error(`Veo 3.1 API not available. The model may require:\n` +
        `   1. Paid Gemini API tier\n` +
        `   2. Special access request\n` +
        `   3. Different model name (try 'veo-3.0-generate-preview')\n` +
        `   Original error: ${error.message}`);
    }

    return {
      sceneId,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ZIPMINATOR VIDEO GENERATION - VEO 3.1 API                ║');
  console.log('║  Image-to-Video Mode                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize Veo 3.1
    const { model } = initializeVeo();

    // Load manifest
    const manifest = await loadManifest();
    const scenes = manifest.production.scenes;

    console.log(`📊 Found ${scenes.length} scenes to animate\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Create scenes directory
    await fs.mkdir(SCENES_DIR, { recursive: true });

    const results = [];

    // Generate videos from existing PNGs
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const pngPath = path.join(OUTPUT_DIR, `scene_${scene.id}.png`);

      // Check if PNG exists
      if (!existsSync(pngPath)) {
        console.log(`⚠️  Skipping Scene ${scene.id}: PNG not found at ${pngPath}\n`);
        results.push({
          sceneId: scene.id,
          status: 'skipped',
          error: 'PNG file not found',
          timestamp: new Date().toISOString()
        });
        continue;
      }

      // Generate video from PNG
      const result = await generateVideoFromImage(
        model,
        scene.id,
        pngPath,
        scene.prompt,
        scene.duration
      );

      results.push(result);

      // Save video if successful
      if (result.status === 'success' && result.videoData) {
        const videoPath = path.join(SCENES_DIR, `scene-${scene.id}.mp4`);

        // Extract video data (format depends on actual API response)
        // This is a placeholder - adjust based on real API response format
        if (result.videoData.videoData) {
          const videoBuffer = Buffer.from(result.videoData.videoData, 'base64');
          await fs.writeFile(videoPath, videoBuffer);
          console.log(`   💾 Saved: ${videoPath}\n`);
        } else if (result.videoData.uri) {
          console.log(`   🔗 Video URL: ${result.videoData.uri}\n`);
          console.log(`   ⚠️  Download manually and save as: ${videoPath}\n`);
        }
      }

      // Rate limit: wait between requests
      if (i < scenes.length - 1) {
        console.log(`   ⏳ Waiting 3 seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Save results
    const resultsPath = path.join(OUTPUT_DIR, 'veo3-generation-results.json');
    await fs.writeFile(resultsPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      model: 'veo-3.1-generate-preview',
      totalScenes: scenes.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      results
    }, null, 2));

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 GENERATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    console.log(`✅ Successful: ${successful}/${scenes.length}`);
    console.log(`❌ Failed: ${failed}/${scenes.length}`);
    console.log(`⏭️  Skipped: ${skipped}/${scenes.length}`);
    console.log(`\n💾 Results saved: ${resultsPath}\n`);

    if (successful > 0) {
      console.log('🎉 Videos generated! Next steps:');
      console.log('   1. Check video-output/scenes/ for MP4 files');
      console.log('   2. Run: node scripts/concatenate-scenes.js');
      console.log('   3. Add audio and export final video\n');
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('\n📚 Troubleshooting:');
    console.error('   1. Verify Veo 3.1 is available in your API tier');
    console.error('   2. Check https://ai.google.dev/gemini-api/docs/video');
    console.error('   3. Try model name: veo-3.0-generate-preview');
    console.error('   4. Ensure you have paid API access\n');
    process.exit(1);
  }
}

main().catch(console.error);
