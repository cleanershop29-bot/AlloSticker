/**
 * ALLOSTICKER — Netlify Function : seed-cards
 * 
 * Récupère les vrais noms de cartes via APIs gratuites
 * et met à jour Supabase.
 * 
 * Usage depuis le navigateur :
 *   GET /.netlify/functions/seed-cards?secret=TON_ADMIN_SECRET&collection=pokemon-ev35-pokemon-151
 *   GET /.netlify/functions/seed-cards?secret=TON_ADMIN_SECRET&collection=all&batch=0
 * 
 * Variables Netlify requises :
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_SECRET
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

// ── Helpers Supabase REST (sans SDK pour garder la function légère) ──

async function sbSelect(table, filters = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  Object.entries(filters).forEach(([k, v]) => url += `&${k}=eq.${encodeURIComponent(v)}`);
  const r = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return r.json();
}

async function sbUpsert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Supabase upsert error: ${err}`);
  }
  return true;
}

async function getCollection(slug) {
  const data = await sbSelect('collections', { slug });
  return data && data[0] ? data[0] : null;
}

async function upsertCards(collectionId, cards) {
  const rows = cards.map(c => ({
    collection_id: collectionId,
    numero: String(c.numero),
    nom: c.nom,
    sous_groupe: c.sous_groupe || null
  }));
  // Batch par 200 pour rester dans les limites
  for (let i = 0; i < rows.length; i += 200) {
    await sbUpsert('cards', rows.slice(i, i + 200));
  }
  return rows.length;
}

// ── APIs de cartes ──────────────────────────────────────────

async function fetchTCGdex(setId, lang = 'fr') {
  const r = await fetch(`https://api.tcgdex.net/v2/${lang}/sets/${setId}`);
  if (!r.ok) throw new Error(`TCGdex ${setId} → ${r.status}`);
  const data = await r.json();
  return (data.cards || []).map(c => ({
    numero: c.localId,
    nom: c.name,
    sous_groupe: c.category || null
  }));
}

async function fetchScryfall(setCode) {
  let cards = [];
  let url = `https://api.scryfall.com/cards/search?q=set:${setCode}&order=set&unique=prints`;
  while (url) {
    const r = await fetch(url);
    const data = await r.json();
    if (data.object === 'error') break;
    (data.data || []).forEach(c => cards.push({
      numero: c.collector_number,
      nom: c.name,
      sous_groupe: c.type_line?.split('—')[0]?.trim() || null
    }));
    url = data.has_more ? data.next_page : null;
    if (url) await new Promise(r => setTimeout(r, 100));
  }
  return cards;
}

async function fetchLorcana(setNum) {
  const r = await fetch(`https://api.lorcana-api.com/cards/fetch?cost=*&set=${setNum}`);
  if (!r.ok) throw new Error(`Lorcana ${setNum} → ${r.status}`);
  const data = await r.json();
  return (Array.isArray(data) ? data : []).map(c => ({
    numero: String(c.Card_Num || c.id),
    nom: [c.Name, c.Version].filter(Boolean).join(' — '),
    sous_groupe: c.Classifications || c.Type || null
  }));
}

// ── Catalogue des collections ───────────────────────────────
// Chaque entrée : { slug, api, params }

const COLLECTIONS = [
  // ── POKÉMON (TCGdex FR) ──
  { slug: 'pokemon-ecarlate-violet',            api: 'tcgdex', params: { setId: 'sv1',    lang: 'fr' } },
  { slug: 'pokemon-ev1-palette-ecarlate',       api: 'tcgdex', params: { setId: 'sv2',    lang: 'fr' } },
  { slug: 'pokemon-ev2-evolutions-paldeennes',  api: 'tcgdex', params: { setId: 'sv3',    lang: 'fr' } },
  { slug: 'pokemon-ev3-flammes-obsidiennes',    api: 'tcgdex', params: { setId: 'sv4',    lang: 'fr' } },
  { slug: 'pokemon-ev4-faille-paradoxe',        api: 'tcgdex', params: { setId: 'sv4pt5', lang: 'fr' } },
  { slug: 'pokemon-ev5-forces-temporelles',     api: 'tcgdex', params: { setId: 'sv5',    lang: 'fr' } },
  { slug: 'pokemon-ev6-mascarade-crepusculaire',api: 'tcgdex', params: { setId: 'sv6',    lang: 'fr' } },
  { slug: 'pokemon-ev65-couronne-stellaire',    api: 'tcgdex', params: { setId: 'sv6pt5', lang: 'fr' } },
  { slug: 'pokemon-ev7-paradoxe-draconique',    api: 'tcgdex', params: { setId: 'sv7',    lang: 'fr' } },
  { slug: 'pokemon-ev8-surpuissance',           api: 'tcgdex', params: { setId: 'sv8',    lang: 'fr' } },
  { slug: 'pokemon-eb10-astres-radieux',        api: 'tcgdex', params: { setId: 'swsh10', lang: 'fr' } },
  { slug: 'pokemon-eb11-origine-perdue',        api: 'tcgdex', params: { setId: 'swsh11', lang: 'fr' } },
  { slug: 'pokemon-eb12-tempete-argentee',      api: 'tcgdex', params: { setId: 'swsh12', lang: 'fr' } },
  { slug: 'pokemon-ev35-pokemon-151',           api: 'tcgdex', params: { setId: 'sv3pt5', lang: 'fr' } },
  { slug: 'pokemon-ev45-destinees-paldea',      api: 'tcgdex', params: { setId: 'sv4pt5', lang: 'fr' } },

  // ── ONE PIECE (TCGdex EN) ──
  { slug: 'one-piece-op02', api: 'tcgdex', params: { setId: 'OP-02', lang: 'en' } },
  { slug: 'one-piece-op03', api: 'tcgdex', params: { setId: 'OP-03', lang: 'en' } },
  { slug: 'one-piece-op04', api: 'tcgdex', params: { setId: 'OP-04', lang: 'en' } },
  { slug: 'one-piece-op05', api: 'tcgdex', params: { setId: 'OP-05', lang: 'en' } },
  { slug: 'one-piece-op06', api: 'tcgdex', params: { setId: 'OP-06', lang: 'en' } },
  { slug: 'one-piece-op07', api: 'tcgdex', params: { setId: 'OP-07', lang: 'en' } },
  { slug: 'one-piece-op08', api: 'tcgdex', params: { setId: 'OP-08', lang: 'en' } },

  // ── MAGIC (Scryfall) ──
  { slug: 'magic-bloomburrow', api: 'scryfall', params: { setCode: 'blb' } },
  { slug: 'magic-duskmourn',   api: 'scryfall', params: { setCode: 'dsk' } },

  // ── LORCANA ──
  { slug: 'lorcana-first-chapter',   api: 'lorcana', params: { setNum: '1' } },
  { slug: 'lorcana-rise-floodborn',  api: 'lorcana', params: { setNum: '2' } },
  { slug: 'lorcana-into-inklands',   api: 'lorcana', params: { setNum: '3' } },
  { slug: 'lorcana-ursula-return',   api: 'lorcana', params: { setNum: '4' } },
  { slug: 'lorcana-shimmering-skies',api: 'lorcana', params: { setNum: '5' } },
];

// ── Handler principal ───────────────────────────────────────

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};

  // Sécurité
  if (params.secret !== ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  // Mode : une collection spécifique ou batch
  const targetSlug = params.collection;
  const batchIndex = parseInt(params.batch || '0', 10);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // ── Mode : lister toutes les collections disponibles
  if (targetSlug === 'list') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total: COLLECTIONS.length,
        collections: COLLECTIONS.map((c, i) => ({ index: i, slug: c.slug, api: c.api }))
      }, null, 2)
    };
  }

  // ── Mode : une collection par slug
  if (targetSlug && targetSlug !== 'all') {
    const entry = COLLECTIONS.find(c => c.slug === targetSlug);
    if (!entry) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: `Collection "${targetSlug}" non trouvée dans le catalogue` }) };
    }

    try {
      const col = await getCollection(entry.slug);
      if (!col) throw new Error(`Slug "${entry.slug}" absent de Supabase`);

      let cards = [];
      if (entry.api === 'tcgdex')   cards = await fetchTCGdex(entry.params.setId, entry.params.lang);
      if (entry.api === 'scryfall') cards = await fetchScryfall(entry.params.setCode);
      if (entry.api === 'lorcana')  cards = await fetchLorcana(entry.params.setNum);

      const count = await upsertCards(col.id, cards);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, slug: entry.slug, cartes: count })
      };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── Mode : toutes les collections par batch (1 à la fois pour éviter timeout)
  if (targetSlug === 'all') {
    const entry = COLLECTIONS[batchIndex];
    if (!entry) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ done: true, message: `Toutes les ${COLLECTIONS.length} collections traitées !` })
      };
    }

    try {
      const col = await getCollection(entry.slug);
      if (!col) throw new Error(`Slug "${entry.slug}" absent de Supabase`);

      let cards = [];
      if (entry.api === 'tcgdex')   cards = await fetchTCGdex(entry.params.setId, entry.params.lang);
      if (entry.api === 'scryfall') cards = await fetchScryfall(entry.params.setCode);
      if (entry.api === 'lorcana')  cards = await fetchLorcana(entry.params.setNum);

      const count = await upsertCards(col.id, cards);

      const nextIndex = batchIndex + 1;
      const nextUrl = `/.netlify/functions/seed-cards?secret=${params.secret}&collection=all&batch=${nextIndex}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          progression: `${batchIndex + 1}/${COLLECTIONS.length}`,
          slug: entry.slug,
          cartes: count,
          suivant: nextIndex < COLLECTIONS.length ? nextUrl : null,
          done: nextIndex >= COLLECTIONS.length
        })
      };
    } catch (e) {
      // En cas d'erreur sur une collection, on continue quand même
      const nextIndex = batchIndex + 1;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: false,
          erreur: e.message,
          slug: entry.slug,
          progression: `${batchIndex + 1}/${COLLECTIONS.length}`,
          suivant: `/.netlify/functions/seed-cards?secret=${params.secret}&collection=all&batch=${nextIndex}`
        })
      };
    }
  }

  // ── Mode : page d'aide
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      usage: {
        lister: '?secret=XXX&collection=list',
        une_collection: '?secret=XXX&collection=pokemon-ev35-pokemon-151',
        tout_en_auto: '?secret=XXX&collection=all&batch=0',
      },
      info: 'Copie l\'URL "suivant" dans le navigateur pour passer à la collection suivante, ou utilise le runner HTML pour tout faire automatiquement.'
    }, null, 2)
  };
};
