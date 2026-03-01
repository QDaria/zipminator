/**
 * Generate videos from PNG scenes using FFmpeg
 * Fallback approach when Veo API is unavailable
 *
 * Creates cinematic videos with zoom/pan effects from static PNGs
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../../video-output');
const SCENES_DIR = path.join(OUTPUT_DIR, 'scenes');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'zipminator-production-manifest.json');

/**
 * Load production manifest
 */
async function loadManifest() {
  const data = await fs.readFile(MANIFEST_PATH, 'utf8');
  return JSON.parse(data);
}

/**
 * Check if FFmpeg is installed
 */
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate video from PNG using FFmpeg with cinematic effects
 */
async function generateVideoFromPNG(sceneId, pngPath, duration, outputPath) {
  console.log(`\n🎥 Generating video for Scene ${sceneId}...`);
  console.log(`   Source: ${path.basename(pngPath)}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Output: ${path.basename(outputPath)}`);

  try {
    // Different zoom effects for variety
    const zoomEffects = {
      1: "zoompan=z='min(zoom+0.0015,1.3)':d=25*60:s=3840x2160:fps=60", // Slow zoom in
      2: "zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':d=25*60:s=3840x2160:fps=60", // Zoom out
      3: "zoompan=z='min(zoom+0.002,1.4)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=25*60:s=3840x2160:fps=60", // Center zoom
      4: "zoompan=z='min(zoom+0.0012,1.25)':d=25*60:s=3840x2160:fps=60", // Subtle zoom
      5: "zoompan=z='if(lte(zoom,1.0),1.4,max(1.0,zoom-0.002))':d=25*60:s=3840x2160:fps=60", // Dynamic zoom out
      6: "zoompan=z='min(zoom+0.0018,1.35)':d=25*60:s=3840x2160:fps=60", // Medium zoom
      7: "zoompan=z='1.2':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=25*60:s=3840x2160:fps=60", // Static close-up
      8: "zoompan=z='min(zoom+0.0025,1.5)':d=25*60:s=3840x2160:fps=60", // Fast zoom in
      9: "zoompan=z='min(zoom+0.0015,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=25*60:s=3840x2160:fps=60" // Final zoom
    };

    const zoomEffect = zoomEffects[sceneId] || zoomEffects[1];

    // Generate video with cinematic effect
    const command = `ffmpeg -loop 1 -i "${pngPath}" ` +
      `-vf "scale=3840:2160,${zoomEffect}" ` +
      `-t ${duration} ` +
      `-c:v libx264 ` +
      `-preset slow ` +
      `-crf 18 ` +
      `-pix_fmt yuv420p ` +
      `-r 60 ` +
      `"${outputPath}" -y`;

    console.log(`   ⚙️  Processing...`);
    execSync(command, { stdio: 'inherit' });

    console.log(`   ✅ Video generated successfully`);
    return { sceneId, status: 'success', outputPath };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { sceneId, status: 'error', error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ZIPMINATOR VIDEO GENERATION - FFMPEG FALLBACK            ║');
  console.log('║  Creating cinematic videos from PNG scenes                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Check FFmpeg
  if (!checkFFmpeg()) {
    console.error('❌ FFmpeg is not installed or not in PATH');
    console.error('\n📚 Install FFmpeg:');
    console.error('   macOS: brew install ffmpeg');
    console.error('   Ubuntu: sudo apt install ffmpeg');
    console.error('   Windows: Download from https://ffmpeg.org/\n');
    process.exit(1);
  }

  console.log('✅ FFmpeg detected\n');

  // Load manifest
  const manifest = await loadManifest();
  const scenes = manifest.production.scenes;

  console.log(`📊 Found ${scenes.length} scenes to generate\n`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create scenes directory
  await fs.mkdir(SCENES_DIR, { recursive: true });

  const results = [];

  // Generate videos from PNGs
  for (const scene of scenes) {
    const pngPath = path.join(OUTPUT_DIR, `scene_${scene.id}.png`);
    const videoPath = path.join(SCENES_DIR, `scene-${scene.id}.mp4`);

    // Check if PNG exists
    if (!existsSync(pngPath)) {
      console.log(`⚠️  Skipping Scene ${scene.id}: PNG not found at ${pngPath}\n`);
      results.push({
        sceneId: scene.id,
        status: 'skipped',
        error: 'PNG file not found'
      });
      continue;
    }

    // Generate video
    const result = await generateVideoFromPNG(
      scene.id,
      pngPath,
      scene.duration,
      videoPath
    );

    results.push(result);
  }

  // Save results
  const resultsPath = path.join(OUTPUT_DIR, 'ffmpeg-generation-results.json');
  await fs.writeFile(resultsPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    method: 'ffmpeg-fallback',
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
}

main().catch(console.error);
