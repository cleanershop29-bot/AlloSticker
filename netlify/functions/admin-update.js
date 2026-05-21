/**
 * ALLOSTICKER — admin-update.js
 * Netlify Function : mise à jour admin (plan user, plan collection)
 * Protégée par ADMIN_SECRET
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gyierirtxsroaqlaphax.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aWVyaXJ0eHNyb2FxbGFwaGF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk3MTQ5NCwiZXhwIjoyMDk0NTQ3NDk0fQ.fYelgh24iaUHsf5ip3ldil8GiLI6BiZ_QDQh9fHNzFA';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'Jj0624988240@';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function sbUpdate(table, id, updates) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON invalide' }) }; }

  const { secret, action, id, updates } = body;

  if (secret !== ADMIN_SECRET) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  if (!action || !id || !updates) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'action, id et updates requis' }) };
  }

  try {
    let table;
    if (action === 'update_user') table = 'profiles';
    else if (action === 'update_collection') table = 'collections';
    else return { statusCode: 400, headers, body: JSON.stringify({ error: 'action inconnue' }) };

    const data = await sbUpdate(table, id, updates);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, data }) };

  } catch (err) {
    console.error('admin-update error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
