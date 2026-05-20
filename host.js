const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

function getGeminiApiKeys() {
    const raw = process.env.GEMINI_API_KEYS || '';
    return raw.split(',').map(k => k.trim()).filter(Boolean);
}

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

async function handleGeminiApi(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
        sendJson(res, 503, {
            error: 'Chưa cấu hình GEMINI_API_KEYS trên server. Vào Render → Environment → thêm key mới (không đưa vào GitHub).'
        });
        return;
    }

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

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
    };

    let lastErrorMsg = '';

    for (let i = 0; i < apiKeys.length; i++) {
        try {
            const response = await fetch(`${GEMINI_URL}?key=${apiKeys[i]}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                sendJson(res, 200, data);
                return;
            }

            lastErrorMsg = data?.error?.message || `HTTP ${response.status}`;
            console.warn(`Gemini key ${i + 1} failed: ${lastErrorMsg}`);
        } catch (e) {
            lastErrorMsg = e.message;
            console.warn(`Gemini key ${i + 1} network error:`, e);
        }
    }

    sendJson(res, 502, {
        error: `Đã thử ${apiKeys.length} API key trên server nhưng đều thất bại. Lỗi cuối: ${lastErrorMsg}. Tạo key MỚI tại https://aistudio.google.com/app/apikey và cập nhật GEMINI_API_KEYS trên Render.`
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

    if (urlPath === '/api/gemini') {
        await handleGeminiApi(req, res);
        return;
    }

    serveStatic(req, res);
}).listen(PORT, '0.0.0.0', () => {
    const keyCount = getGeminiApiKeys().length;
    console.log(`Server running on port ${PORT} (${keyCount} Gemini API key(s) configured)`);
});
