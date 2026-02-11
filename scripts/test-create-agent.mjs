import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.ELEVEN_LABS_API_KEY;

if (!apiKey) {
    console.error('❌ No ELEVEN_LABS_API_KEY found in .env.local');
    process.exit(1);
}

console.log('🔑 Using API Key:', apiKey.substring(0, 5) + '...');

async function testCreateAgent() {
    console.log('🚀 Attempting to create test agent...');

    // Payload from our implementation
    const payload = {
        conversation_config: {
            agent: {
                prompt: {
                    prompt: "Eres un agente de prueba creado mediante script."
                },
                first_message: "Hola, soy un agente de prueba.",
                language: "es"
            }
        },
        name: "Test Agent Script " + new Date().toISOString()
    };

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        console.log(`📡 Status Code: ${status}`);

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Creation Failed:', JSON.stringify(data, null, 2));
        } else {
            console.log('✅ Agent Created Successfully!');
            console.log('🆔 Agent ID:', data.agent_id);
            console.log('🔍 Full Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('💥 Unexpected Error:', error);
    }
}

testCreateAgent();
