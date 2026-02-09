
import fs from 'fs';
import path from 'path';
import https from 'https';

// Read .env file manually
const envPath = path.join(process.cwd(), '.env');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env file");
    process.exit(1);
}

if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

console.log(`Checking models for API Key: ${apiKey.substring(0, 10)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", JSON.stringify(json.error, null, 2));
            } else {
                console.log("Available Models:");
                if (json.models) {
                    json.models.forEach(m => console.log(`- ${m.name}`));
                } else {
                    console.log("No models returned (empty list).");
                }
            }
        } catch (e) {
            console.error("Failed to parse response:", data);
        }
    });
}).on('error', (e) => {
    console.error("Request failed:", e.message);
});
