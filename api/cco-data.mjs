// Vercel: /api/cco-data
import { handle } from '../cco-server/core.mjs';
export default async function (req, res) {
  const [status, body] = await handle(req.headers.authorization, process.env);
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}
