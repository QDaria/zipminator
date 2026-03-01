/**
 * Concatenate Zipminator Video Scenes
 *
 * This script concatenates all 9 scene MP4 files into a single video
 * using FFmpeg's concat demuxer.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const SCENES_DIR = path.join(__dirname, '../../video-output/scenes');
const OUTPUT_DIR = path.join(__dirname, '../../video-output/drafts');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'zipminator-raw-video.mp4');
const CONCAT_LIST = path.join(SCENES_DIR, 'scenes.txt');

/**
 * Check if FFmpeg is installed
 */
async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if all scene files exist
 */
async function checkSceneFiles() {
  const missing = [];

  for (let i = 1; i <= 9; i++) {
    const sceneFile = path.join(SCENES_DIR, `scene-${i}.mp4`);
    if (!existsSync(sceneFile)) {
      missing.push(`scene-${i}.mp4`);
    }
  }

  return missing;
}

/**
 * Create concat list file
 */
async function createConcatList() {
  const lines = [];

  for (let i = 1; i <= 9; i++) {
    lines.push(`file 'scene-${i}.mp4'`);
  }

  await fs.writeFile(CONCAT_LIST, lines.join('\n'));
  console.log(`✅ Created concat list: ${CONCAT_LIST}`);
}

/**
 * Concatenate scenes using FFmpeg
 */
async function concatenateScenes() {
  console.log('\n🎬 Starting video concatenation...\n');

  const command = [
    'ffmpeg',
    '-f concat',
    '-safe 0',
    `-i "${CONCAT_LIST}"`,
    '-c copy', // Copy streams without re-encoding (fast)
    `"${OUTPUT_FILE}"`
  ].join(' ');

  console.log('📝 FFmpeg command:');
  console.log(command);
  console.log('');

  try {
    const { stdout, stderr } = await execAsync(command);

    console.log('✅ Video concatenation complete!');
    console.log(`📁 Output file: ${OUTPUT_FILE}\n`);

    // Get file stats
    const stats = await fs.stat(OUTPUT_FILE);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${sizeInMB} MB`);

    return OUTPUT_FILE;
  } catch (error) {
    throw new Error(`FFmpeg failed: ${error.message}`);
  }
}

/**
 * Get video duration using FFprobe
 */
async function getVideoDuration(file) {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error) {
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ZIPMINATOR VIDEO SCENE CONCATENATION                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Check FFmpeg installation
    console.log('🔍 Checking for FFmpeg...');
    const hasFFmpeg = await checkFFmpeg();

    if (!hasFFmpeg) {
      console.error('❌ FFmpeg is not installed or not in PATH');
      console.error('\n📦 Install FFmpeg:');
      console.error('   macOS: brew install ffmpeg');
      console.error('   Ubuntu: sudo apt install ffmpeg');
      console.error('   Windows: https://ffmpeg.org/download.html\n');
      process.exit(1);
    }

    console.log('✅ FFmpeg found\n');

    // Create output directory
    await fs.mkdir(SCENES_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Check for scene files
    console.log('🔍 Checking for scene files...');
    const missingScenes = await checkSceneFiles();

    if (missingScenes.length > 0) {
      console.error('\n❌ Missing scene files:');
      missingScenes.forEach(scene => console.error(`   - ${scene}`));
      console.error('\n📋 Please generate all 9 scenes first using Google AI Studio:');
      console.error('   1. Visit: https://aistudio.google.com/');
      console.error('   2. Use prompts from: video-output/zipminator-production-manifest.json');
      console.error('   3. Generate and download each scene as: scene-1.mp4, scene-2.mp4, etc.');
      console.error(`   4. Save to: ${SCENES_DIR}/\n`);
      process.exit(1);
    }

    console.log('✅ All 9 scene files found\n');

    // Create concat list
    console.log('📝 Creating FFmpeg concat list...');
    await createConcatList();

    // Concatenate scenes
    const outputFile = await concatenateScenes();

    // Get duration
    console.log('\n🕐 Checking video duration...');
    const duration = await getVideoDuration(outputFile);

    if (duration) {
      console.log(`✅ Video duration: ${duration.toFixed(2)} seconds`);

      if (duration < 85 || duration > 95) {
        console.warn(`⚠️  Warning: Expected ~90 seconds, got ${duration.toFixed(2)} seconds`);
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 CONCATENATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📁 Raw video (no audio): ' + OUTPUT_FILE);
    console.log('\n📋 NEXT STEPS:\n');
    console.log('1. Generate voiceover:');
    console.log('   - Use Google Chirp TTS or hire voice actor');
    console.log('   - Script available in production manifest\n');
    console.log('2. Generate/license background music:');
    console.log('   - Use Google Lyria or royalty-free library');
    console.log('   - 90 seconds, epic cinematic style\n');
    console.log('3. Add audio tracks:');
    console.log('   - Run: node scripts/add-audio-tracks.js\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n📚 Troubleshooting:');
    console.error('   1. Ensure all scene files are valid MP4 format');
    console.error('   2. Check FFmpeg is properly installed');
    console.error('   3. Verify scenes are in correct directory');
    console.error('   4. Ensure sufficient disk space\n');
    process.exit(1);
  }
}

// Execute
main().catch(console.error);
