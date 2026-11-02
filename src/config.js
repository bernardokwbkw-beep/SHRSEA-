// Jogos pré-definidos. Os IDs vieram de pesquisa na web e PRECISAM ser
// confirmados no app (botão "Validar" mostra o nome real do jogo).
// Para conferir manualmente: abra a página do jogo no roblox.com;
// o número depois de /games/ na URL é o place ID.
export const PRESETS = [
  { label: 'Steal An Egg (ID raiz citado)', placeId: '107778070777162' },
  { label: 'Steal An Egg (ID alternativo)', placeId: '10563114921' },
  { label: 'Steal a Egg (Crazay Minds)', placeId: '7861158392' },
];

export const DEFAULTS = {
  placeId: PRESETS[0].placeId,
  minPlayers: 1, // 0 costuma ser servidor morrendo/fechando
  maxPlayers: 2, // faixa "ideal"
  maxPages: 5, // páginas de 100 servidores por busca
};

export const STORAGE_KEYS = {
  visited: 'egghopper:visited',
  settings: 'egghopper:settings',
};
