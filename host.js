const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function parseKeys(envName) {
    const raw = process.env[envName] || '';
    return raw.split(',').map(k => k.trim()).filter(Boolean);
}

function getGeminiApiKeys() { return parseKeys('GEMINI_API_KEYS'); }
function getOpenaiApiKeys() { return parseKeys('OPENAI_API_KEYS'); }

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

function sendJson(res, status, payload) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(payload));
}

function handleCorsPreflight(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return true;
    }
    return false;
}

async function callOpenAI(apiKey, prompt) {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a helpful English vocabulary teacher. Always respond with valid JSON only when asked.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
    }
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenAI returned empty content');
    return text;
}

async function callGemini(apiKey, prompt) {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned empty content');
    return text;
}

async function tryProvider(name, keys, callFn, prompt) {
    let lastError = '';
    for (let i = 0; i < keys.length; i++) {
        try {
            const text = await callFn(keys[i], prompt);
            return { ok: true, text, provider: name };
        } catch (e) {
            lastError = e.message;
            console.warn(`${name} key ${i + 1} failed: ${lastError}`);
        }
    }
    return { ok: false, lastError, provider: name, keyCount: keys.length };
}

async function handleAiApi(req, res) {
    if (handleCorsPreflight(req, res)) return;

    let body;
    try {
        body = JSON.parse(await readBody(req));
    } catch (e) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        return;
    }

    const prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string') {
        sendJson(res, 400, { error: 'Missing prompt' });
        return;
    }

    const openaiKeys = getOpenaiApiKeys();
    const geminiKeys = getGeminiApiKeys();
    const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();

    const order = [];
    if (provider === 'openai') order.push('openai');
    else if (provider === 'gemini') order.push('gemini');
    else {
        if (openaiKeys.length) order.push('openai');
        if (geminiKeys.length) order.push('gemini');
    }

    if (order.length === 0) {
        sendJson(res, 503, {
            error: 'Chưa cấu hình AI. Trên Render thêm OPENAI_API_KEYS (ChatGPT) hoặc GEMINI_API_KEYS — không đưa key vào GitHub.'
        });
        return;
    }

    const errors = [];

    for (const p of order) {
        if (p === 'openai' && openaiKeys.length) {
            const result = await tryProvider('OpenAI', openaiKeys, callOpenAI, prompt);
            if (result.ok) {
                sendJson(res, 200, { text: result.text, provider: 'openai' });
                return;
            }
            errors.push(`ChatGPT: ${result.lastError} (${result.keyCount} key)`);
        }
        if (p === 'gemini' && geminiKeys.length) {
            const result = await tryProvider('Gemini', geminiKeys, callGemini, prompt);
            if (result.ok) {
                sendJson(res, 200, { text: result.text, provider: 'gemini' });
                return;
            }
            errors.push(`Gemini: ${result.lastError} (${result.keyCount} key)`);
        }
    }

    sendJson(res, 502, {
        error: `Tất cả AI đều thất bại. ${errors.join(' | ')}`
    });
}

function serveStatic(req, res) {
    let urlPath = (req.url || '/').split('?')[0];
    try {
        urlPath = decodeURIComponent(urlPath);
    } catch (e) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }

    if (urlPath === '/') urlPath = 'test.html';
    urlPath = urlPath.replace(/^\/+/, '');

    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(DIR, safePath);

    if (!filePath.startsWith(DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'test.html');
        }
    } catch (e) {}

    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found: ' + urlPath);
        return;
    }

    const ext = path.extname(filePath);
    const types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg'
    };
    const contentType = types[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
    });
    res.end(fs.readFileSync(filePath));
}

http.createServer(async (req, res) => {
    const urlPath = (req.url || '/').split('?')[0];

    if (urlPath === '/api/ai' || urlPath === '/api/gemini') {
        await handleAiApi(req, res);
        return;
    }

    serveStatic(req, res);
}).listen(PORT, '0.0.0.0', () => {
    const openai = getOpenaiApiKeys().length;
    const gemini = getGeminiApiKeys().length;
    const provider = process.env.AI_PROVIDER || 'auto';
    console.log(`Server on port ${PORT} | AI: ${provider} | OpenAI: ${openai} key(s) | Gemini: ${gemini} key(s)`);
});
