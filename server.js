/**
 * Local proxy server for Anthropic API
 *
 * This server sits between your browser and the Anthropic API.
 * It injects the API key server-side so it never appears in your HTML file.
 * It also overrides the model name so any user can adjust it here without
 * touching the HTML file.
 *
 * Usage:
 *   1. Set your API key in ANTHROPIC_API_KEY below.
 *   2. Optionally change MODEL to a different model string.
 *   3. Run:  node server.js
 *   4. Open platform_local.html in your browser.
 */

const http  = require('http');
const https = require('https');

// ─────────────────────────────────────────────
// CONFIGURATION — edit these two lines only
// ─────────────────────────────────────────────
const ANTHROPIC_API_KEY = 'sk-ant-YOUR_KEY_HERE';
const MODEL             = 'claude-haiku-4-5-20251001';
// ─────────────────────────────────────────────
//
// Other available models (replace MODEL value above):
//   'claude-opus-4-5'
//   'claude-haiku-4-5-20251001'
//   'claude-sonnet-4-5'   ← default, good balance of speed and quality
//
// ─────────────────────────────────────────────

const PORT = 3001;

if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'sk-ant-YOUR_KEY_HERE') {
  console.warn('\n  WARNING: No API key set. Edit server.js and replace sk-ant-YOUR_KEY_HERE.\n');
}

console.log('  Model override: ' + MODEL);

const server = http.createServer((req, res) => {

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/messages') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  // Collect request body
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {

    // Parse and override model name
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      return;
    }

    const originalModel = parsed.model || '?';
    parsed.model = MODEL;  // override with configured model
    body = JSON.stringify(parsed);

    const bodyBuffer = Buffer.from(body, 'utf-8');

    const options = {
      hostname : 'api.anthropic.com',
      port     : 443,
      path     : '/v1/messages',
      method   : 'POST',
      headers  : {
        'Content-Type'      : 'application/json',
        'Content-Length'    : bodyBuffer.length,
        'x-api-key'         : ANTHROPIC_API_KEY,
        'anthropic-version' : '2023-06-01'
      }
    };

    const proxyReq = https.request(options, proxyRes => {
      let responseBody = '';
      proxyRes.on('data', chunk => { responseBody += chunk.toString(); });
      proxyRes.on('end', () => {

        const ts = new Date().toISOString();
        if (proxyRes.statusCode === 200) {
          let tokens = '';
          try {
            const data = JSON.parse(responseBody);
            tokens = 'in=' + data.usage.input_tokens + ' out=' + data.usage.output_tokens;
          } catch {}
          console.log('[' + ts + '] 200 OK  model=' + MODEL + '  ' + tokens);
        } else {
          console.error('[' + ts + '] ERROR ' + proxyRes.statusCode + '  model=' + MODEL + '  (original=' + originalModel + ')');
          console.error('Anthropic response:', responseBody);
        }

        res.writeHead(proxyRes.statusCode, {
          'Content-Type'                : 'application/json',
          'Access-Control-Allow-Origin' : '*'
        });
        res.end(responseBody);
      });
    });

    proxyReq.on('error', err => {
      console.error('Proxy request error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Proxy error: ' + err.message } }));
    });

    proxyReq.write(bodyBuffer);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log('\n  Proxy running at http://localhost:' + PORT);
  console.log('  Open platform_local.html in your browser.\n');
});
