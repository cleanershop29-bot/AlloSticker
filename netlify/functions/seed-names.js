/**
 * ALLOSTICKER — seed-names.js
 * Génère les vrais noms de cartes via Claude API par tranches de 50
 * pour éviter le timeout Netlify (10s).
 *
 * Usage :
 *   Ouvre dans le navigateur et laisse tourner :
 *   https://allosticker.fr/.netlify/functions/seed-names?secret=Jj0624988240@&batch=0&html=1
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gyierirtxsroaqlaphax.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aWVyaXJ0eHNyb2FxbGFwaGF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk3MTQ5NCwiZXhwIjoyMDk0NTQ3NDk0fQ.fYelgh24iaUHsf5ip3ldil8GiLI6BiZ_QDQh9fHNzFA";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "Jj0624988240@";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const TRANCHE = 50; // cartes par appel Claude

const COLLECTIONS = [
  { slug: "panini-ucl-2425",           nom: "Panini Champions League 2024-25",        nb: 720, ctx: "stickers Panini UEFA Champions League 2024-2025, clubs européens" },
  { slug: "panini-euro-2024",           nom: "Panini UEFA Euro 2024",                  nb: 720, ctx: "stickers Panini UEFA Euro 2024 en Allemagne" },
  { slug: "panini-ucl-2324",            nom: "Panini Champions League 2023-24",        nb: 710, ctx: "stickers Panini UEFA Champions League 2023-2024" },
  { slug: "panini-fifa-wc-2018",        nom: "FIFA World Cup Russia 2018",             nb: 682, ctx: "stickers Panini Coupe du Monde 2018 en Russie" },
  { slug: "panini-euro-2020",           nom: "Panini UEFA Euro 2020",                  nb: 678, ctx: "stickers Panini UEFA Euro 2020" },
  { slug: "panini-fifa-wc-2022",        nom: "FIFA World Cup Qatar 2022",              nb: 670, ctx: "stickers Panini Coupe du Monde 2022 au Qatar" },
  { slug: "panini-premier-league-2425", nom: "Panini Premier League 2024-25",         nb: 652, ctx: "stickers Panini Premier League 2024-2025" },
  { slug: "panini-premier-league-2324", nom: "Panini Premier League 2023-24",         nb: 648, ctx: "stickers Panini Premier League 2023-2024" },
  { slug: "panini-fifa-wc-2014",        nom: "FIFA World Cup Brazil 2014",             nb: 640, ctx: "stickers Panini Coupe du Monde 2014 au Brésil" },
  { slug: "panini-liga-2425",           nom: "Panini LaLiga 2024-25",                  nb: 600, ctx: "stickers Panini LaLiga espagnole 2024-2025" },
  { slug: "panini-liga-2324",           nom: "Panini LaLiga 2023-24",                  nb: 595, ctx: "stickers Panini LaLiga espagnole 2023-2024" },
  { slug: "panini-serie-a-2425",        nom: "Panini Serie A 2024-25",                 nb: 580, ctx: "stickers Panini Serie A italienne 2024-2025" },
  { slug: "panini-bundesliga-2425",     nom: "Panini Bundesliga 2024-25",              nb: 572, ctx: "stickers Panini Bundesliga allemande 2024-2025" },
  { slug: "panini-ligue1-2324",         nom: "Panini Ligue 1 2023-24",                 nb: 534, ctx: "stickers Panini Ligue 1 française 2023-2024" },
  { slug: "panini-ligue1-2223",         nom: "Panini Ligue 1 2022-23",                 nb: 528, ctx: "stickers Panini Ligue 1 française 2022-2023" },
  { slug: "adrenalyn-xl-ucl-2425",      nom: "Adrenalyn XL Champions League 2024-25", nb: 520, ctx: "cartes Adrenalyn XL UEFA Champions League 2024-2025" },
  { slug: "match-attax-2425",           nom: "Match Attax 2024-25",                    nb: 500, ctx: "cartes Match Attax Topps 2024-2025" },
  { slug: "match-attax-2324",           nom: "Match Attax 2023-24",                    nb: 496, ctx: "cartes Match Attax Topps 2023-2024" },
  { slug: "adrenalyn-xl-premier-2425",  nom: "Adrenalyn XL Premier League 2024-25",   nb: 490, ctx: "cartes Adrenalyn XL Premier League 2024-2025" },
  { slug: "adrenalyn-xl-liga-2425",     nom: "Adrenalyn XL LaLiga 2024-25",            nb: 480, ctx: "cartes Adrenalyn XL LaLiga 2024-2025" },
  { slug: "panini-rugby-wc-2023",       nom: "Panini Rugby World Cup 2023",            nb: 480, ctx: "stickers Panini Coupe du Monde Rugby 2023 en France" },
  { slug: "panini-women-wc-2023",       nom: "Panini Womens World Cup 2023",           nb: 480, ctx: "stickers Panini Coupe du Monde Feminine 2023" },
  { slug: "panini-mls-2024",            nom: "Panini MLS 2024",                        nb: 450, ctx: "stickers Panini Major League Soccer 2024" },
  { slug: "panini-nba-stickers-2425",   nom: "Panini NBA Stickers 2024-25",            nb: 400, ctx: "stickers Panini NBA 2024-2025" },
  { slug: "panini-top14-2425",          nom: "Panini Top 14 2024-25",                  nb: 360, ctx: "stickers Panini Top 14 rugby français 2024-2025" },
  { slug: "panini-top14-2324",          nom: "Panini Top 14 2023-24",                  nb: 354, ctx: "stickers Panini Top 14 rugby français 2023-2024" },
  { slug: "topps-mlb-series1-2024",     nom: "Topps MLB Series 1 2024",               nb: 330, ctx: "cartes Topps MLB Baseball Series 1 2024" },
  { slug: "panini-nba-prizm-2324",      nom: "Panini NBA Prizm 2023-24",              nb: 300, ctx: "cartes Panini NBA Prizm 2023-2024" },
  { slug: "panini-nba-prizm-2425",      nom: "Panini NBA Prizm 2024-25",              nb: 300, ctx: "cartes Panini NBA Prizm 2024-2025" },
  { slug: "panini-nfl-prizm-2024",      nom: "Panini NFL Prizm 2024",                 nb: 300, ctx: "cartes Panini NFL Prizm football americain 2024" },
  { slug: "panini-nba-hoops-2425",      nom: "Panini NBA Hoops 2024-25",              nb: 280, ctx: "cartes Panini NBA Hoops 2024-2025" },
  { slug: "panini-wwe-2024",            nom: "Panini WWE 2024",                        nb: 280, ctx: "cartes Panini WWE catch 2024" },
  { slug: "magic-bloomburrow",          nom: "Magic Bloomburrow",                      nb: 276, ctx: "cartes Magic the Gathering Bloomburrow 2024" },
  { slug: "magic-duskmourn",            nom: "Magic Duskmourn",                        nb: 276, ctx: "cartes Magic the Gathering Duskmourn 2024" },
  { slug: "panini-marvel-2024",         nom: "Panini Marvel Heroes 2024",             nb: 240, ctx: "stickers Panini Marvel Heroes 2024" },
  { slug: "panini-f1-2025",             nom: "Panini F1 2025",                         nb: 220, ctx: "stickers Panini Formula 1 saison 2025" },
  { slug: "topps-mlb-chrome-2024",      nom: "Topps Chrome MLB 2024",                 nb: 220, ctx: "cartes Topps Chrome MLB Baseball 2024" },
  { slug: "panini-disney-100",          nom: "Panini Disney 100 Ans",                  nb: 216, ctx: "stickers Panini Disney 100 ans" },
  { slug: "panini-dragon-ball",         nom: "Panini Dragon Ball Super",               nb: 216, ctx: "stickers Panini Dragon Ball Super" },
  { slug: "panini-naruto",              nom: "Panini Naruto Shippuden",                nb: 216, ctx: "stickers Panini Naruto Shippuden" },
  { slug: "lorcana-into-inklands",      nom: "Lorcana Into the Inklands",              nb: 204, ctx: "cartes Disney Lorcana Into the Inklands" },
  { slug: "lorcana-rise-floodborn",     nom: "Lorcana Rise of the Floodborn",          nb: 204, ctx: "cartes Disney Lorcana Rise of the Floodborn" },
  { slug: "lorcana-shimmering-skies",   nom: "Lorcana Shimmering Skies",               nb: 204, ctx: "cartes Disney Lorcana Shimmering Skies" },
  { slug: "lorcana-first-chapter",      nom: "Lorcana The First Chapter",              nb: 204, ctx: "cartes Disney Lorcana The First Chapter" },
  { slug: "lorcana-ursula-return",      nom: "Lorcana Ursula Return",                  nb: 204, ctx: "cartes Disney Lorcana Ursula Return" },
  { slug: "topps-f1-2025",              nom: "Topps F1 2025",                          nb: 200, ctx: "cartes Topps Formula 1 2025" },
  { slug: "topps-ucl-2425",             nom: "Topps UEFA Champions League 2024-25",    nb: 200, ctx: "cartes Topps UEFA Champions League 2024-2025" },
  { slug: "topps-f1-2024",              nom: "Topps F1 2024",                          nb: 196, ctx: "cartes Topps Formula 1 2024" },
  { slug: "topps-f1-2023",              nom: "Topps F1 2023",                          nb: 190, ctx: "cartes Topps Formula 1 2023" },
  { slug: "dbs-fusion-world-01",        nom: "Dragon Ball Super Fusion World FS01",    nb: 116, ctx: "cartes Dragon Ball Super Fusion World FS01" },
  { slug: "dbs-fusion-world-02",        nom: "Dragon Ball Super Fusion World FS02",    nb: 116, ctx: "cartes Dragon Ball Super Fusion World FS02" },
  { slug: "dbs-fusion-world-03",        nom: "Dragon Ball Super Fusion World FS03",    nb: 116, ctx: "cartes Dragon Ball Super Fusion World FS03" },
  { slug: "yugioh-phantom-nightmare",   nom: "Yu-Gi-Oh Phantom Nightmare",             nb: 100, ctx: "cartes Yu-Gi-Oh Phantom Nightmare" },
];

// Calcul du batch global → collection + offset dans la collection
function getBatchInfo(globalBatch) {
  let offset = globalBatch * TRANCHE;
  for (let i = 0; i < COLLECTIONS.length; i++) {
    const col = COLLECTIONS[i];
    const nb = col.nb;
    if (offset < nb) {
      return { colIdx: i, col, debut: offset + 1, fin: Math.min(offset + TRANCHE, nb) };
    }
    offset -= nb;
  }
  return null; // tout terminé
}

function totalBatches() {
  return COLLECTIONS.reduce((sum, c) => sum + Math.ceil(c.nb / TRANCHE), 0);
}

// ── Supabase ─────────────────────────────────────────────────
async function getCollectionId(slug) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/collections?select=id&slug=eq.${encodeURIComponent(slug)}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const data = await r.json();
  return data && data[0] ? data[0].id : null;
}

async function upsertCards(collectionId, cards) {
  const rows = cards.map(c => ({
    collection_id: collectionId,
    numero: String(c.numero),
    nom: c.nom,
    sous_groupe: c.sous_groupe || null
  }));
  const r = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });
  if (!r.ok) throw new Error(`Supabase: ${(await r.text()).slice(0, 150)}`);
  return rows.length;
}

// ── Claude API ───────────────────────────────────────────────
async function askClaude(col, debut, fin) {
  const prompt = `Collection: "${col.nom}" (${col.ctx}).
Génère les cartes numéro ${debut} à ${fin} de cette collection.
Retourne UNIQUEMENT un tableau JSON valide, sans texte avant/après, sans backticks.
Format: [{"numero":"${debut}","nom":"Vrai nom","sous_groupe":"Équipe ou Rareté"},...]
- Pour stickers foot: écussons, joueurs par équipe, cartes spéciales
- Pour TCG: vrais noms de cartes avec rareté
- Numéros de ${debut} à ${fin} inclus`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!r.ok) throw new Error(`Claude API: ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  const text = data.content[0].text.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const cards = JSON.parse(text);
  if (!Array.isArray(cards)) throw new Error('Pas un tableau JSON');
  return cards;
}

// ── Handler ──────────────────────────────────────────────────
exports.handler = async (event) => {
  const p = event.queryStringParameters || {};
  const isHtml = p.html === '1';

  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: jsonHeaders, body: '' };
  }

  if (p.secret !== ADMIN_SECRET) {
    return { statusCode: 401, headers: jsonHeaders, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  if (p.collection === 'list') {
    return {
      statusCode: 200, headers: jsonHeaders,
      body: JSON.stringify({ total: COLLECTIONS.length, totalBatches: totalBatches(), collections: COLLECTIONS.map((c,i) => ({index:i,slug:c.slug,nom:c.nom,nb:c.nb})) }, null, 2)
    };
  }

  const globalBatch = parseInt(p.batch || '0', 10);
  const TOTAL = totalBatches();
  const info = getBatchInfo(globalBatch);

  function htmlPage(msg, type, nextBatch, done) {
    const nextUrl = `/.netlify/functions/seed-names?secret=${p.secret}&batch=${nextBatch}&html=1`;
    const refresh = done ? '' : `<meta http-equiv="refresh" content="1;url=${nextUrl}">`;
    const color = type === 'ok' ? '#3dffb0' : '#ff9f27';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<!DOCTYPE html><html><head><meta charset="UTF-8">${refresh}
<style>body{background:#0f0f10;color:#e8e8e8;font-family:sans-serif;padding:20px;max-width:500px;margin:0 auto}
.bar{height:8px;background:#2a2a2d;border-radius:4px;margin:12px 0;overflow:hidden}
.fill{height:100%;background:linear-gradient(90deg,#3d9bff,#3dffb0);border-radius:4px;width:${Math.round((globalBatch/TOTAL)*100)}%}
</style></head><body>
<h2 style="font-size:16px;margin-bottom:8px">🤖 AlloSticker — Seed en cours</h2>
<p style="color:${color}">${msg}</p>
<div class="bar"><div class="fill"></div></div>
<p style="color:#888;font-size:12px">${globalBatch}/${TOTAL} batches — ${Math.round((globalBatch/TOTAL)*100)}%</p>
${done ? '<p style="color:#3dffb0;font-size:18px;margin-top:20px">🎉 TERMINÉ !</p>' : '<p style="color:#555;font-size:11px">Rechargement automatique...</p>'}
</body></html>`
    };
  }

  if (!info) {
    if (isHtml) return htmlPage('🎉 Toutes les collections traitées !', 'ok', globalBatch, true);
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ done: true }) };
  }

  try {
    const colId = await getCollectionId(info.col.slug);
    if (!colId) throw new Error(`Slug "${info.col.slug}" introuvable`);

    const cards = await askClaude(info.col, info.debut, info.fin);
    await upsertCards(colId, cards);

    const nextBatch = globalBatch + 1;
    const msg = `✅ ${info.col.nom} [${info.debut}-${info.fin}] — ${cards.length} cartes`;

    if (isHtml) return htmlPage(msg, 'ok', nextBatch, nextBatch >= TOTAL);
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ ok: true, msg, next: nextBatch }) };

  } catch (e) {
    const nextBatch = globalBatch + 1;
    const msg = `⚠️ ${info.col.slug} [${info.debut}-${info.fin}] — ${e.message.slice(0, 100)}`;

    if (isHtml) return htmlPage(msg, 'warn', nextBatch, nextBatch >= TOTAL);
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ ok: false, msg, next: nextBatch }) };
  }
};
