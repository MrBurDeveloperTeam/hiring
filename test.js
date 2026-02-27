import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}); // use service role or anon key

fetch(`${supabaseUrl}/rest/v1/organizations?select=id,org_name,verified_status`, {
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
    }
}).then(res => res.json()).then(data => {
    console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
