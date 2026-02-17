require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const apiKey = process.env.ELEVEN_LABS_API_KEY;
const convId = 'conv_8601khmkewm1eawbc0q9m9zczcg7';

async function inspect() {
    try {
        console.log(`Fetching conversation ${convId}...`);
        const res = await axios.get(`https://api.elevenlabs.io/v1/convai/conversations/${convId}`, {
            headers: { 'xi-api-key': apiKey }
        });

        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

inspect();
