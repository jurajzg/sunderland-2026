import { handle } from '../../worker/src/index.js';

export async function onRequest(context) {
  try {
    return await handle(context.request, context.env);
  } catch {
    return new Response(JSON.stringify({ error: 'Interna pogreška.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
}
