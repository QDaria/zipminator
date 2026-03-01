/**
 * Check Google Gemini Pro API Capabilities
 *
 * This script verifies what features are available with your Gemini Pro subscription
 * including video generation capabilities with Imagen/Veo models.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.GEMINI_API_KEY;

async function checkAPICapabilities() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  GOOGLE GEMINI PRO API CAPABILITY CHECK                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.error('   Path checked:', path.join(__dirname, '../../.env'));
    process.exit(1);
  }

  console.log('✅ API Key found:', API_KEY.substring(0, 20) + '...\n');

  const genAI = new GoogleGenerativeAI(API_KEY);

  // Models to test
  const modelsToTest = [
    { name: 'gemini-2.5-pro-preview-03-25', type: 'text' },
    { name: 'gemini-pro', type: 'text' },
    { name: 'gemini-pro-vision', type: 'multimodal' },
    { name: 'imagen-4.0-generate-preview-06-06', type: 'image/video' },
    { name: 'veo-3.1-generate-preview', type: 'video' },
    { name: 'imagen-3.0-generate-001', type: 'image' },
  ];

  console.log('🔍 Testing available models...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = [];

  for (const modelInfo of modelsToTest) {
    try {
      console.log(`Testing: ${modelInfo.name}`);
      console.log(`Type: ${modelInfo.type}`);

      const model = genAI.getGenerativeModel({ model: modelInfo.name });

      // Test with a simple prompt
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: 'Test prompt for capability check' }]
        }]
      });

      const response = await result.response;
      const text = response.text();

      console.log('✅ Available');
      console.log(`   Response length: ${text.length} characters\n`);

      results.push({
        model: modelInfo.name,
        type: modelInfo.type,
        available: true,
        tested: true
      });

    } catch (error) {
      console.log('❌ Not available or error');
      console.log(`   Error: ${error.message}\n`);

      results.push({
        model: modelInfo.name,
        type: modelInfo.type,
        available: false,
        error: error.message,
        tested: true
      });
    }

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const textModels = results.filter(r => r.type === 'text' && r.available);
  const imageModels = results.filter(r => r.type.includes('image') && r.available);
  const videoModels = results.filter(r => r.type.includes('video') && r.available);

  console.log(`✅ Text models available: ${textModels.length}`);
  textModels.forEach(m => console.log(`   - ${m.model}`));

  console.log(`\n✅ Image generation models: ${imageModels.length}`);
  imageModels.forEach(m => console.log(`   - ${m.model}`));

  console.log(`\n✅ Video generation models: ${videoModels.length}`);
  videoModels.forEach(m => console.log(`   - ${m.model}`));

  if (videoModels.length === 0) {
    console.log('\n⚠️  WARNING: No video generation models available');
    console.log('   Possible reasons:');
    console.log('   1. Veo/Imagen video generation not included in your subscription');
    console.log('   2. Video generation requires separate Google AI Studio access');
    console.log('   3. Feature not available in your region');
    console.log('   4. Requires upgraded/enterprise plan\n');
    console.log('   💡 RECOMMENDED ALTERNATIVES:');
    console.log('   1. Use Google AI Studio web interface manually');
    console.log('   2. Use Runway Gen-2 or similar services');
    console.log('   3. Contact Google Cloud sales for enterprise access');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎬 VIDEO GENERATION RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (videoModels.length > 0) {
    console.log('✅ You have access to video generation!');
    console.log('   Recommended model:', videoModels[0].model);
    console.log('   Next step: Run generate-video-with-gemini-pro.js');
  } else {
    console.log('⚠️  API-based video generation not available');
    console.log('\n📋 MANUAL GENERATION WORKFLOW:');
    console.log('   1. Visit: https://aistudio.google.com/');
    console.log('   2. Use your API key to login');
    console.log('   3. Navigate to Video Generation (Veo 3.1)');
    console.log('   4. Use prompts from video-output/zipminator-production-manifest.json');
    console.log('   5. Generate each of the 9 scenes manually');
    console.log('   6. Download videos and concatenate with FFmpeg\n');

    console.log('💡 FFMPEG CONCATENATION COMMAND:');
    console.log('   ffmpeg -f concat -safe 0 -i scenes.txt -c copy output.mp4\n');
    console.log('   Where scenes.txt contains:');
    console.log('   file \'scene-1.mp4\'');
    console.log('   file \'scene-2.mp4\'');
    console.log('   ... etc\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  return results;
}

// Execute
checkAPICapabilities().catch(console.error);
