const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const url     = require('url');

const PORT         = process.env.PORT || 3000;
const VESSEL_KEY   = 'EE16B67C49FFE1fc97838C162F751a6A044906245D9C9b8D4B1eebb440968202';

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // ── API proxy: /api/vessel?imo=XXXXXXX ──────────────────────────
  if (parsed.pathname === '/api/vessel') {
    const imo = (parsed.query.imo || '').replace(/\D/g, '');
    if (!imo || imo.length < 7) {
      res.writeHead(400, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error:'IMO required'}));
      return;
    }

    const apiReq = https.request(
      `https://api.vesselapi.com/v1/vessel/${imo}`,
      { headers: { 'Authorization': `Bearer ${VESSEL_KEY}` } },
      (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(data);
        });
      }
    );
    apiReq.on('error', e => {
      res.writeHead(502, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error: e.message}));
    });
    apiReq.end();
    return;
  }

  // ── Serve index.html for everything else ────────────────────────
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`CII Calculator running on port ${PORT}`);
});
