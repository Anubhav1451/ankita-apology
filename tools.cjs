// Static server and build tools for Ankita's Apology & Romantic Universe
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = __dirname;

const mode = process.argv[2] || 'serve';

function copyRecursiveSync(src, dest) {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
            copyRecursiveSync(path.join(src, child), path.join(dest, child));
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

if (mode === 'vendor' || mode === 'build') {
    fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
    const threeSrc = path.join(root, 'node_modules/three/build/three.min.js');
    const licenseSrc = path.join(root, 'node_modules/three/LICENSE');
    if (fs.existsSync(threeSrc)) fs.copyFileSync(threeSrc, path.join(root, 'vendor/three.min.js'));
    if (fs.existsSync(licenseSrc)) fs.copyFileSync(licenseSrc, path.join(root, 'vendor/LICENSE.three'));
}

if (mode === 'build') {
    const buildFiles = ['index.html', 'main.js', 'audio.js', 'style.css', 'noormahal.mp3'];
    for (const file of buildFiles) {
        const srcPath = path.join(root, file);
        if (fs.existsSync(srcPath)) {
            const target = path.join(root, 'dist', file);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.copyFileSync(srcPath, target);
        }
    }
    copyRecursiveSync(path.join(root, 'vendor'), path.join(root, 'dist/vendor'));
    copyRecursiveSync(path.join(root, 'music'), path.join(root, 'dist/music'));
    copyRecursiveSync(path.join(root, 'images'), path.join(root, 'dist/images'));
    console.log('Static production build complete in dist/');
}

if (mode === 'serve') {
    const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.json': 'application/json; charset=utf-8',
        '.ico': 'image/x-icon'
    };

    const server = http.createServer((request, response) => {
        try {
            let reqPath = decodeURI(new URL(request.url, 'http://localhost').pathname);
            if (reqPath === '/' || reqPath === '') {
                reqPath = '/index.html';
            }

            // Prevent path traversal
            const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
            const filePath = path.join(root, safePath);

            // Check if file exists within root
            if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
                response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                return response.end('404 Not Found');
            }

            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
                return response.end('403 Forbidden');
            }

            const total = stat.size;
            const ext = path.extname(filePath).toLowerCase();
            const contentType = types[ext] || 'application/octet-stream';
            const range = request.headers.range;

            // Handle HTTP Range Requests (essential for seeking audio smoothly)
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

                if (isNaN(start) || isNaN(end) || start >= total || end >= total || start > end) {
                    response.writeHead(416, {
                        'Content-Range': `bytes */${total}`,
                        'Content-Type': 'text/plain'
                    });
                    return response.end('416 Requested Range Not Satisfiable');
                }

                const chunkSize = (end - start) + 1;
                response.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${total}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': contentType,
                    'Cache-Control': 'no-cache'
                });

                fs.createReadStream(filePath, { start, end }).pipe(response);
            } else {
                response.writeHead(200, {
                    'Content-Length': total,
                    'Accept-Ranges': 'bytes',
                    'Content-Type': contentType,
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });

                fs.createReadStream(filePath).pipe(response);
            }
        } catch (err) {
            console.error('Server error:', err);
            if (!response.headersSent) {
                response.writeHead(500, { 'Content-Type': 'text/plain' });
                response.end('500 Internal Server Error');
            }
        }
    });

    server.on('error', error => {
        console.error(error.code === 'EADDRINUSE' ? 'Port 3000 is already in use.' : error.message);
        process.exitCode = 1;
    });

    server.listen(3000, () => console.log('For Ankita: http://localhost:3000'));
}
