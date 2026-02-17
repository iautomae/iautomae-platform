require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const apiKey = process.env.ELEVEN_LABS_API_KEY;
const convId = 'conv_8601khmkewm1eawbc0q9m9zczcg7';
const COST_PER_CREDIT = 22 / 100000; // $0.00022

async function testCalculation() {
    try {
        console.log(`Analyzing cost for ${convId}...`);
        const res = await axios.get(`https://api.elevenlabs.io/v1/convai/conversations/${convId}`, {
            headers: { 'xi-api-key': apiKey }
        });

        const transcript = res.data.transcript || [];
        let totalCost = 0;

        transcript.forEach((turn, i) => {
            const llm = turn.llm_usage || {};
            const itemCost = (llm.model_usage?.['gemini-2.5-flash']?.input?.price || 0) +
                (llm.model_usage?.['gemini-2.5-flash']?.output_total?.price || 0) +
                (llm.model_usage?.['gemini-2.5-flash']?.input_cache_read?.price || 0) +
                (llm.model_usage?.['gemini-2.5-flash']?.input_cache_write?.price || 0);

            // Also check generic structure if model name varies
            // ... (simplified for this test based on known structure)

            totalCost += itemCost;
            console.log(`Turn ${i}: $${itemCost.toFixed(6)}`);
        });

        console.log(`\n--- RESULT ---`);
        console.log(`Total Cost (USD): $${totalCost.toFixed(6)}`);

        const calculatedCredits = totalCost / COST_PER_CREDIT;
        console.log(`Calculated Credits (Real): ${calculatedCredits.toFixed(2)}`);
        console.log(`Client Credits (2x): ${(calculatedCredits * 2).toFixed(2)}`);

    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

testCalculation();
