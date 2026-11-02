import { DEFAULTS } from './config';

const SERVERS_URL = (placeId, cursor) =>
  `https://games.roblox.com/v1/games/${placeId}/servers/Public` +
  `?sortOrder=Asc&excludeFullGames=true&limit=100` +
  (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fetch com retry simples para o rate limit (HTTP 429) da API pública.
async function getJson(url, { retries = 3 } = {}) {
  let wait = 1500;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 429) {
      if (attempt === retries) throw new Error('Limite de requisições da Roblox (429). Aguarde um pouco e tente de novo.');
      await sleep(wait);
      wait *= 2;
      continue;
    }
    if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao falar com a Roblox.`);
    return res.json();
  }
  throw new Error('Falha inesperada na requisição.');
}

// Retorna o nome do jogo para o placeId (ajuda a confirmar que o ID está certo).
export async function validatePlace(placeId) {
  const u = await getJson(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
  if (!u.universeId) throw new Error('Place ID não encontrado.');
  const g = await getJson(`https://games.roblox.com/v1/games?universeIds=${u.universeId}`);
  const game = g.data && g.data[0];
  if (!game) throw new Error('Jogo não encontrado para esse Place ID.');
  return { name: game.name, playing: game.playing, universeId: u.universeId };
}

// Busca servidores públicos e devolve os que têm entre minPlayers e maxPlayers.
// A lista vem ordenada do menos cheio para o mais cheio, então podemos parar
// assim que passarmos do limite.
export async function findServers(placeId, opts = {}) {
  const { minPlayers = DEFAULTS.minPlayers, maxPlayers = DEFAULTS.maxPlayers, maxPages = DEFAULTS.maxPages, onProgress } = opts;
  const found = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page++) {
    const json = await getJson(SERVERS_URL(placeId, cursor));
    const data = json.data || [];
    for (const s of data) {
      if (s.playing >= minPlayers && s.playing <= maxPlayers) found.push(s);
    }
    onProgress && onProgress(page + 1, found.length);
    const passedRange = data.length > 0 && data[data.length - 1].playing > maxPlayers;
    if (passedRange || !json.nextPageCursor) break;
    cursor = json.nextPageCursor;
    await sleep(400); // gentileza com a API
  }
  // Prioridade: 1 jogador, depois 2, depois menor ping.
  found.sort((a, b) => a.playing - b.playing || (a.ping ?? 9999) - (b.ping ?? 9999));
  return found;
}

export const joinUrl = (placeId, serverId) =>
  `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${serverId}`;

export const joinWebUrl = (placeId, serverId) =>
  `https://www.roblox.com/games/start?placeId=${placeId}&gameInstanceId=${serverId}`;
