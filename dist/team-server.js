import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = parseInt(process.env.TEAM_PORT || '6001', 10);
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000';
const TEAM_HTML = path.join(__dirname, '..', 'public', 'team.html');
app.use('/api', (req, res) => {
    const targetUrl = new URL(API_TARGET);
    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        path: req.originalUrl,
        method: req.method,
        headers: { ...req.headers, host: targetUrl.host },
    };
    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
        console.error('[TeamServer] Proxy error:', err.message);
        res.status(502).json({ error: 'API backend unavailable' });
    });
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.pipe(proxyReq);
    }
    else {
        proxyReq.end();
    }
});
app.get('/team', (_, res) => {
    res.sendFile(TEAM_HTML);
});
app.get('/', (_, res) => {
    res.sendFile(TEAM_HTML);
});
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));
app.use((req, res) => {
    if (req.method === 'GET') {
        res.sendFile(TEAM_HTML);
    }
    else {
        res.status(404).json({ error: 'Not found' });
    }
});
app.listen(PORT, () => {
    console.log(`[TeamServer] Serving team page on http://localhost:${PORT}`);
    console.log(`[TeamServer] Proxying /api/* -> ${API_TARGET}`);
});
//# sourceMappingURL=team-server.js.map