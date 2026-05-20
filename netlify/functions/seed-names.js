/**
 * ALLOSTICKER — seed-names.js
 * Netlify Function : génère les vrais noms de cartes via Claude API
 * et les insère directement dans Supabase.
 *
 * Usage :
 *   GET /.netlify/functions/seed-names?secret=Jj0624988240@&collection=list
 *   GET /.netlify/functions/seed-names?secret=Jj0624988240@&batch=0
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gyierirtxsroaqlaphax.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aWVyaXJ0eHNyb2FxbGFwaGF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk3MTQ5NCwiZXhwIjoyMDk0NTQ3NDk0fQ.fYelgh24iaUHsf5ip3ldil8GiLI6BiZ_QDQh9fHNzFA";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "Jj0624988240@";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "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";

// Collections à traiter avec leur contexte pour Claude
const COLLECTIONS = [
  { slug: "panini-ucl-2425",           nom: "Panini Champions League 2024-25",        nb: 720, contexte: "stickers Panini UEFA Champions League saison 2024-2025, joueurs des clubs européens" },
  { slug: "panini-euro-2024",           nom: "Panini UEFA Euro 2024",                  nb: 720, contexte: "stickers Panini UEFA Euro 2024 en Allemagne, équipes nationales européennes" },
  { slug: "panini-ucl-2324",            nom: "Panini Champions League 2023-24",        nb: 710, contexte: "stickers Panini UEFA Champions League saison 2023-2024" },
  { slug: "panini-fifa-wc-2018",        nom: "FIFA World Cup Russia 2018",             nb: 682, contexte: "stickers Panini Coupe du Monde FIFA 2018 en Russie" },
  { slug: "panini-euro-2020",           nom: "Panini UEFA Euro 2020",                  nb: 678, contexte: "stickers Panini UEFA Euro 2020 (joué en 2021)" },
  { slug: "panini-fifa-wc-2022",        nom: "FIFA World Cup Qatar 2022",              nb: 670, contexte: "stickers Panini Coupe du Monde FIFA 2022 au Qatar" },
  { slug: "panini-premier-league-2425", nom: "Panini Premier League 2024-25",         nb: 652, contexte: "stickers Panini Premier League anglaise saison 2024-2025" },
  { slug: "panini-premier-league-2324", nom: "Panini Premier League 2023-24",         nb: 648, contexte: "stickers Panini Premier League anglaise saison 2023-2024" },
  { slug: "panini-fifa-wc-2014",        nom: "FIFA World Cup Brazil 2014",             nb: 640, contexte: "stickers Panini Coupe du Monde FIFA 2014 au Brésil" },
  { slug: "panini-liga-2425",           nom: "Panini LaLiga 2024-25",                  nb: 600, contexte: "stickers Panini LaLiga espagnole saison 2024-2025" },
  { slug: "panini-liga-2324",           nom: "Panini LaLiga 2023-24",                  nb: 595, contexte: "stickers Panini LaLiga espagnole saison 2023-2024" },
  { slug: "panini-serie-a-2425",        nom: "Panini Serie A 2024-25",                 nb: 580, contexte: "stickers Panini Serie A italienne saison 2024-2025" },
  { slug: "panini-bundesliga-2425",     nom: "Panini Bundesliga 2024-25",              nb: 572, contexte: "stickers Panini Bundesliga allemande saison 2024-2025" },
  { slug: "panini-ligue1-2324",         nom: "Panini Ligue 1 2023-24",                 nb: 534, contexte: "stickers Panini Ligue 1 française saison 2023-2024" },
  { slug: "panini-ligue1-2223",         nom: "Panini Ligue 1 2022-23",                 nb: 528, contexte: "stickers Panini Ligue 1 française saison 2022-2023" },
  { slug: "adrenalyn-xl-ucl-2425",      nom: "Adrenalyn XL Champions League 2024-25", nb: 520, contexte: "cartes Adrenalyn XL UEFA Champions League 2024-2025" },
  { slug: "match-attax-2425",           nom: "Match Attax 2024-25",                    nb: 500, contexte: "cartes Match Attax Topps saison 2024-2025" },
  { slug: "match-attax-2324",           nom: "Match Attax 2023-24",                    nb: 496, contexte: "cartes Match Attax Topps saison 2023-2024" },
  { slug: "adrenalyn-xl-premier-2425",  nom: "Adrenalyn XL Premier League 2024-25",   nb: 490, contexte: "cartes Adrenalyn XL Premier League 2024-2025" },
  { slug: "adrenalyn-xl-liga-2425",     nom: "Adrenalyn XL LaLiga 2024-25",            nb: 480, contexte: "cartes Adrenalyn XL LaLiga espagnole 2024-2025" },
  { slug: "panini-rugby-wc-2023",       nom: "Panini Rugby World Cup 2023",            nb: 480, contexte: "stickers Panini Coupe du Monde Rugby 2023 en France" },
  { slug: "panini-women-wc-2023",       nom: "Panini Women World Cup 2023",            nb: 480, contexte: "stickers Panini Coupe du Monde Féminine 2023 en Australie et Nouvelle-Zélande" },
  { slug: "panini-mls-2024",            nom: "Panini MLS 2024",                        nb: 450, contexte: "stickers Panini Major League Soccer 2024" },
  { slug: "panini-nba-stickers-2425",   nom: "Panini NBA Stickers 2024-25",            nb: 400, contexte: "stickers Panini NBA saison 2024-2025" },
  { slug: "panini-top14-2425",          nom: "Panini Top 14 2024-25",                  nb: 360, contexte: "stickers Panini Top 14 rugby français saison 2024-2025" },
  { slug: "panini-top14-2324",          nom: "Panini Top 14 2023-24",                  nb: 354, contexte: "stickers Panini Top 14 rugby français saison 2023-2024" },
  { slug: "topps-mlb-series1-2024",     nom: "Topps MLB Series 1 2024",               nb: 330, contexte: "cartes Topps MLB Baseball Series 1 2024" },
  { slug: "panini-nba-prizm-2324",      nom: "Panini NBA Prizm 2023-24",              nb: 300, contexte: "cartes Panini NBA Prizm saison 2023-2024" },
  { slug: "panini-nba-prizm-2425",      nom: "Panini NBA Prizm 2024-25",              nb: 300, contexte: "cartes Panini NBA Prizm saison 2024-2025" },
  { slug: "panini-nfl-prizm-2024",      nom: "Panini NFL Prizm 2024",                 nb: 300, contexte: "cartes Panini NFL Prizm football américain 2024" },
  { slug: "panini-nba-hoops-2425",      nom: "Panini NBA Hoops 2024-25",              nb: 280, contexte: "cartes Panini NBA Hoops saison 2024-2025" },
  { slug: "panini-wwe-2024",            nom: "Panini WWE 2024",                        nb: 280, contexte: "cartes Panini WWE catch 2024, lutteurs WWE" },
  { slug: "magic-bloomburrow",          nom: "Magic Bloomburrow",                      nb: 276, contexte: "cartes Magic the Gathering extension Bloomburrow 2024" },
  { slug: "magic-duskmourn",            nom: "Magic Duskmourn",                        nb: 276, contexte: "cartes Magic the Gathering extension Duskmourn 2024" },
  { slug: "panini-marvel-2024",         nom: "Panini Marvel Heroes 2024",             nb: 240, contexte: "stickers Panini Marvel Heroes 2024, super-héros Marvel" },
  { slug: "panini-f1-2025",             nom: "Panini F1 2025",                         nb: 220, contexte: "stickers Panini Formula 1 saison 2025" },
  { slug: "topps-mlb-chrome-2024",      nom: "Topps Chrome MLB 2024",                 nb: 220, contexte: "cartes Topps Chrome MLB Baseball 2024" },
  { slug: "panini-disney-100",          nom: "Panini Disney 100 Ans",                  nb: 216, contexte: "stickers Panini Disney 100 ans, personnages Disney classiques et modernes" },
  { slug: "panini-dragon-ball",         nom: "Panini Dragon Ball Super",               nb: 216, contexte: "stickers Panini Dragon Ball Super, personnages de l anime" },
  { slug: "panini-naruto",              nom: "Panini Naruto Shippuden",                nb: 216, contexte: "stickers Panini Naruto Shippuden, personnages de l anime" },
  { slug: "lorcana-into-inklands",      nom: "Lorcana Into the Inklands",              nb: 204, contexte: "cartes Disney Lorcana set Into the Inklands" },
  { slug: "lorcana-rise-floodborn",     nom: "Lorcana Rise of the Floodborn",          nb: 204, contexte: "cartes Disney Lorcana set Rise of the Floodborn" },
  { slug: "lorcana-shimmering-skies",   nom: "Lorcana Shimmering Skies",               nb: 204, contexte: "cartes Disney Lorcana set Shimmering Skies" },
  { slug: "lorcana-first-chapter",      nom: "Lorcana The First Chapter",              nb: 204, contexte: "cartes Disney Lorcana premier set The First Chapter" },
  { slug: "lorcana-ursula-return",      nom: "Lorcana Ursula Return",                  nb: 204, contexte: "cartes Disney Lorcana set Ursula's Return" },
  { slug: "topps-f1-2025",              nom: "Topps F1 2025",                          nb: 200, contexte: "cartes Topps Formula 1 saison 2025" },
  { slug: "topps-ucl-2425",             nom: "Topps UEFA Champions League 2024-25",    nb: 200, contexte: "cartes Topps UEFA Champions League 2024-2025" },
  { slug: "topps-f1-2024",              nom: "Topps F1 2024",                          nb: 196, contexte: "cartes Topps Formula 1 saison 2024" },
  { slug: "topps-f1-2023",              nom: "Topps F1 2023",                          nb: 190, contexte: "cartes Topps Formula 1 saison 2023" },
  { slug: "panini-dragon-ball",         nom: "Dragon Ball Super Fusion World FS01",    nb: 116, contexte: "cartes Dragon Ball Super Fusion World starter deck FS01" },
  { slug: "dbs-fusion-world-02",        nom: "Dragon Ball Super Fusion World FS02",    nb: 116, contexte: "cartes Dragon Ball Super Fusion World starter deck FS02" },
  { slug: "dbs-fusion-world-03",        nom: "Dragon Ball Super Fusion World FS03",    nb: 116, contexte: "cartes Dragon Ball Super Fusion World starter deck FS03" },
  { slug: "yugioh-phantom-nightmare",   nom: "Yu-Gi-Oh Phantom Nightmare",             nb: 100, contexte: "cartes Yu-Gi-Oh extension Phantom Nightmare" },
];

// ── Helpers Supabase ─────────────────────────────────────────
async function getCollectionId(slug) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/collections?select=id,nb_cartes&slug=eq.${slug}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const data = await r.json();
  return data && data[0] ? data[0] : null;
}

async function upsertCards(collectionId, cards) {
  const rows = cards.map(c => ({
    collection_id: collectionId,
    numero: String(c.numero),
    nom: c.nom,
    sous_groupe: c.sous_groupe || null
  }));

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(batch)
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Supabase: ${err.slice(0, 200)}`);
    }
  }
  return rows.length;
}

// ── Appel Claude API ─────────────────────────────────────────
async function generateCardsWithClaude(collection) {
  const prompt = `Tu es une base de données de cartes à collectionner.
  
Génère la liste complète des ${collection.nb} cartes de la collection "${collection.nom}" (${collection.contexte}).

Retourne UNIQUEMENT un tableau JSON valide, sans aucun texte avant ou après, sans backticks, sans markdown.
Format exact :
[{"numero":"1","nom":"Nom de la carte","sous_groupe":"Groupe/Équipe/Rareté"},...]

Règles :
- "numero" : numéro de la carte (string), commencer à "1" sauf si format spécial (ex: OP01-001 pour One Piece)
- "nom" : vrai nom du joueur/personnage/carte (PAS "Carte #X")
- "sous_groupe" : équipe du joueur, ou rareté (Commun, Rare, ex, VSTAR...), ou catégorie
- Génère exactement ${collection.nb} cartes
- Pour les stickers foot : écusson d'équipe, joueurs par équipe, cartes spéciales
- Pour les cartes TCG : vrais noms des cartes avec leur rareté`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Claude API: ${err.slice(0, 200)}`);
  }

  const data = await r.json();
  const text = data.content[0].text.trim();

  // Parser le JSON retourné par Claude
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
  const cards = JSON.parse(cleaned);

  if (!Array.isArray(cards)) throw new Error('Claude na pas retourné un tableau JSON');
  return cards;
}

// ── Handler ──────────────────────────────────────────────────
exports.handler = async (event) => {
  const p = event.queryStringParameters || {};

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (p.secret !== ADMIN_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  // Lister les collections
  if (p.collection === 'list') {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        total: COLLECTIONS.length,
        collections: COLLECTIONS.map((c, i) => ({ index: i, slug: c.slug, nom: c.nom, nb: c.nb }))
      }, null, 2)
    };
  }

  // Traiter une collection par index
  const idx = parseInt(p.batch || '0', 10);
  const entry = COLLECTIONS[idx];

  if (!entry) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ done: true, message: `Toutes les ${COLLECTIONS.length} collections traitées !` })
    };
  }

  try {
    // Récupérer l'ID Supabase
    const col = await getCollectionId(entry.slug);
    if (!col) throw new Error(`Slug "${entry.slug}" introuvable dans Supabase`);

    // Générer les noms avec Claude
    const cards = await generateCardsWithClaude(entry);

    // Insérer dans Supabase
    const count = await upsertCards(col.id, cards);

    const nextIdx = idx + 1;
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        ok: true,
        progression: `${idx + 1}/${COLLECTIONS.length}`,
        slug: entry.slug,
        nom: entry.nom,
        cartes_generees: cards.length,
        cartes_inserees: count,
        suivant: nextIdx < COLLECTIONS.length
          ? `/.netlify/functions/seed-names?secret=${p.secret}&batch=${nextIdx}`
          : null,
        done: nextIdx >= COLLECTIONS.length
      })
    };

  } catch (e) {
    const nextIdx = idx + 1;
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        ok: false,
        slug: entry.slug,
        erreur: e.message,
        progression: `${idx + 1}/${COLLECTIONS.length}`,
        suivant: `/.netlify/functions/seed-names?secret=${p.secret}&batch=${nextIdx}`
      })
    };
  }
};
