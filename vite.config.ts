import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function cashfreeDevPlugin(env: Record<string, string>): Plugin {
  const appId = env.VITE_CASHFREE_APP_ID || env.CASHFREE_APP_ID;
  const secretKey = env.VITE_CASHFREE_SECRET_KEY || env.CASHFREE_SECRET_KEY;
  const isProd = (env.VITE_CASHFREE_ENV || env.CASHFREE_ENV) === 'production';
  const baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

  return {
    name: 'cashfree-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        if (req.method === 'POST' && url.startsWith('/api/cashfree/create-order')) {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              if (!appId || !secretKey) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Cashfree credentials missing in .env.local' }));
                return;
              }
              const parsed = bodyStr ? JSON.parse(bodyStr) : {};
              const cfRes = await fetch(`${baseUrl}/orders`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-version': '2026-01-01',
                  'x-client-id': appId,
                  'x-client-secret': secretKey,
                },
                body: JSON.stringify(parsed),
              });
              const data = await cfRes.json();
              res.writeHead(cfRes.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.method === 'GET' && url.startsWith('/api/cashfree/verify-order/')) {
          const orderId = url.replace('/api/cashfree/verify-order/', '').split('?')[0];
          try {
            if (!appId || !secretKey) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Cashfree credentials missing in .env.local' }));
              return;
            }
            const cfRes = await fetch(`${baseUrl}/orders/${orderId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2026-01-01',
                'x-client-id': appId,
                'x-client-secret': secretKey,
              },
            });
            const data = await cfRes.json();
            res.writeHead(cfRes.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), cashfreeDevPlugin(env)],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
