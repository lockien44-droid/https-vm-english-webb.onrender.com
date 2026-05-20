// Chạy: node check-api.js
// Tạo file .env cùng thư mục (không commit):
//   GEMINI_API_KEYS=key_moi_cua_ban
// hoặc OPENAI_API_KEYS=sk-...

const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

function parseKeys(name) {
    return (process.env[name] || '').split(',').map(k => k.trim()).filter(Boolean);
}

async function testGemini(key, model = 'gemini-2.0-flash') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply OK only' }] }] })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

async function testOpenAI(key) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Reply OK only' }],
            max_tokens: 10
        })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

async function main() {
    loadEnv();
    const gemini = parseKeys('GEMINI_API_KEYS');
    const openai = parseKeys('OPENAI_API_KEYS');

    if (!gemini.length && !openai.length) {
        console.log('❌ Chưa có key. Tạo file .env với GEMINI_API_KEYS hoặc OPENAI_API_KEYS');
        process.exit(1);
    }

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-flash-latest'];
    for (let i = 0; i < gemini.length; i++) {
        console.log(`\n--- Gemini key #${i + 1} ---`);
        for (const model of models) {
            try {
                const r = await testGemini(gemini[i], model);
                if (r.ok) {
                    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    console.log(`✅ OK [${model}]:`, text?.trim());
                    break;
                } else {
                    console.log(`❌ [${model}] HTTP`, r.status, '-', r.data?.error?.message);
                }
            } catch (e) {
                console.log(`❌ [${model}]`, e.message);
            }
        }
    }

    for (let i = 0; i < openai.length; i++) {
        console.log(`\n--- OpenAI key #${i + 1} ---`);
        try {
            const r = await testOpenAI(openai[i]);
            if (r.ok) {
                console.log('✅ OK:', r.data?.choices?.[0]?.message?.content?.trim());
            } else {
                console.log('❌ FAIL HTTP', r.status);
                console.log(r.data?.error?.message || JSON.stringify(r.data));
            }
        } catch (e) {
            console.log('❌ Lỗi mạng:', e.message);
        }
    }
}

main();
