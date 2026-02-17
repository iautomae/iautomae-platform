const fs = require('fs');

// Load the debug payload and strip header
let rawContent = fs.readFileSync('debug_payload.json', 'utf8');
const jsonStartIndex = rawContent.indexOf('{');
if (jsonStartIndex > 0) {
    rawContent = rawContent.substring(jsonStartIndex);
}
const payload = JSON.parse(rawContent);

// Simulate the extraction logic to be used in route.ts
function calculateTokens(payload) {
    let tokensRaw = 0;

    // 1. Try old method (legacy)
    const webData = payload.data || {};
    const usageData = payload.usage || webData.usage || {};
    if (usageData.total_tokens) {
        console.log('Found tokens in usage.total_tokens');
        tokensRaw = usageData.total_tokens;
    }

    // 2. Try new method (metadata.charging)
    if (tokensRaw === 0) {
        // Check payload.metadata.charging
        const charging = payload.metadata?.charging || webData.metadata?.charging;

        if (charging && charging.llm_usage) {
            console.log('Found charging data. Calculating...');

            // We focus on irreversible_generation (completed generations)
            const usageType = charging.llm_usage.irreversible_generation || charging.llm_usage.initiated_generation;

            if (usageType && usageType.model_usage) {
                Object.values(usageType.model_usage).forEach(model => {
                    // Sum input tokens
                    if (model.input) {
                        tokensRaw += (model.input.tokens || 0);
                    }
                    // Sum output tokens
                    if (model.output_total) {
                        tokensRaw += (model.output_total.tokens || 0);
                    }
                });
            }
        }
    }

    // 3. Try cost (Credits) - preferred by user
    const cost = payload.metadata?.cost || webData.metadata?.cost;
    if (cost !== undefined) {
        console.log(`Found metadata.cost (Credits): ${cost}`);
    }

    return { tokens: tokensRaw, credits: cost };
}

const result = calculateTokens(payload);
console.log(`\n--------------------------------`);
console.log(`Calculated Tokens (Raw LLM): ${result.tokens}`);
console.log(`Extracted Credits (Cost): ${result.credits}`);
console.log(`--------------------------------\n`);
