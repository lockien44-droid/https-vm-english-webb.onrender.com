const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;

http.createServer((req, res) => {
    // Bỏ query string (?v=10) — nếu không, style.css?v=10 sẽ 404 trên Render
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

    // Chặn path traversal
    if (!filePath.startsWith(DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Xử lý các đường dẫn thư mục thành file
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
    let contentType = 'text/html';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.js') contentType = 'text/javascript';
    if (ext === '.json') contentType = 'application/json';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.svg') contentType = 'image/svg+xml';
    
    // Thêm CORS để iPad không bị chặn
    res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
    });
    res.end(fs.readFileSync(filePath));
}).listen(PORT, '0.0.0.0', () => {
    console.log('Server running properly on all interfaces. Port ' + PORT);
});
