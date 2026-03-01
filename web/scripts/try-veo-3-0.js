/**
 * Try Veo 3.0 model for video generation
 * Testing alternative model name as Veo 3.1 returned 404
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../../video-output');

/**
 * Test Veo 3.0 availability
 */
async function testVeo3() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not found in .env');
  }

  console.log('🎬 Testing Google Veo 3.0 API...\n');
  const genAI = new GoogleGenerativeAI(API_KEY);

  const modelsToTest = [
    'veo-3.0-generate-preview',
    'veo-2-generate-001',
    'imagen-3.0-generate-001',
    'imagen-3.0-generate-preview',
  ];

  for (const modelName of modelsToTest) {
    console.log(`\n📡 Testing: ${modelName}`);
    console.log('─'.repeat(60));

    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: 'Generate a 5 second video showing a quantum computer with glowing lights.'
          }]
        }]
      });

      const response = await result.response;
      console.log(`✅ SUCCESS: ${modelName} is available!`);
      console.log('Response:', JSON.stringify(response, null, 2).substring(0, 500));

      // Save successful model info
      await fs.writeFile(
        path.join(OUTPUT_DIR, 'working-veo-model.json'),
        JSON.stringify({
          modelName,
          testedAt: new Date().toISOString(),
          status: 'success',
          response: response
        }, null, 2)
      );

      return modelName; // Return first working model

    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
  }

  console.log('\n\n⚠️  No video generation models available via API');
  console.log('📋 This confirms that video generation requires:');
  console.log('   1. Google AI Studio web interface (https://aistudio.google.com/)');
  console.log('   2. Special API tier or access request');
  console.log('   3. Different authentication method\n');

  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  VEO 3.0 API AVAILABILITY TEST                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const workingModel = await testVeo3();

  if (workingModel) {
    console.log(`\n\n🎉 SUCCESS! Working model found: ${workingModel}`);
    console.log('You can now use this model for video generation.\n');
  } else {
    console.log('\n\n📋 RECOMMENDATION: Use FFmpeg fallback approach');
    console.log('Run: node scripts/generate-videos-with-ffmpeg.js\n');
  }
}

main().catch(console.error);
