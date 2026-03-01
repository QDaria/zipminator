
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Access the model manager directly if possible, or use a known endpoint
        // The SDK doesn't have a direct 'listModels' on the instance in some versions, 
        // but usually it's available via the API. 
        // Let's try to just use a known model to check connection, 
        // but actually we want to see the LIST.
        // The Node SDK might not expose listModels directly on the client.
        // We can use fetch to hit the REST API directly for listing.

        console.log('Fetching available models via REST API...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Available Models:');
        if (data.models) {
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.version}) [${m.supportedGenerationMethods.join(', ')}]`);
            });
        } else {
            console.log('No models found in response.');
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
