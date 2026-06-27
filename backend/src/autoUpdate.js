const axios = require('axios');

const API_KEY = 'd8f11bedecf64f2c84190bd2a40a24be';
const BACKEND_URL = 'https://bolao-backend-cl0j.onrender.com/api';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// Mapa: nome no banco → nome na API football-data.org
const TEAM_MAP = {
  'México': 'Mexico',
  'África do Sul': 'South Africa',
  'Coreia do Sul': 'South Korea',
  'Rep. Tcheca': 'Czechia',
  'Canadá': 'Canada',
  'Bósnia': 'Bosnia-Herzegovina',
  'Catar': 'Qatar',
  'Suíça': 'Switzerland',
  'Brasil': 'Brazil',
  'Marrocos': 'Morocco',
  'Escócia': 'Scotland',
  'Haiti': 'Haiti',
  'EUA': 'United States',
  'Estados Unidos': 'United States',
  'Turquia': 'Turkey',
  'Austrália': 'Australia',
  'Paraguai': 'Paraguay',
  'Alemanha': 'Germany',
  'Equador': 'Ecuador',
  'Costa do Marfim': 'Ivory Coast',
  'Curaçao': 'Curaçao',
  'Holanda': 'Netherlands',
  'Japão': 'Japan',
  'Suécia': 'Sweden',
  'Tunísia': 'Tunisia',
  'Bélgica': 'Belgium',
  'Irã': 'Iran',
  'Egito': 'Egypt',
  'Nova Zelândia': 'New Zealand',
  'Espanha': 'Spain',
  'Uruguai': 'Uruguay',
  'Arábia Saudita': 'Saudi Arabia',
  'Cabo Verde': 'Cape Verde Islands',
  'França': 'France',
  'Senegal': 'Senegal',
  'Noruega': 'Norway',
  'Iraque': 'Iraq',
  'Argentina': 'Argentina',
  'Áustria': 'Austria',
  'Argélia': 'Algeria',
  'Jordânia': 'Jordan',
  'Portugal': 'Portugal',
  'Colômbia': 'Colombia',
  'RD Congo': 'Congo DR',
  'Uzbequistão': 'Uzbekistan',
  'Inglaterra': 'England',
  'Croácia': 'Croatia',
  'Panamá': 'Panama',
  'Gana': 'Ghana',
};

// Mapa: nome no banco → nome na API football-data.org
const ARTILHEIRO_MAP = {
  'Mbappé':          'Kylian Mbappé',
  'Neymar':          'Neymar',
  'Kai Havertz':     'Kai Havertz',
  'Erling Haaland':  'Erling Haaland',
  'Cristiano Ronaldo': 'Cristiano Ronaldo',
  'Kane':            'Harry Kane',
  'Vini Jr':         'Vinicius Junior',
  'Messi':           'Lionel Messi',
  'Olise':           'Michael Olise',
  'Lautaro Martínez': 'Lautaro Martínez',
  'Julian Álvarez':  'Julián Álvarez',
  'Enner Valencia':  'Enner Valencia',
  'Dembélé': 'Ousmane Dembélé'
};

const STATUS_MAP = {
  'IN_PLAY': 'EA',
  'PAUSED':  'IN',
  'FINISHED': 'FZ',
};

let token = null;

async function login() {
  const { data } = await axios.post(`${BACKEND_URL}/auth/login`, {
    username: ADMIN_USER,
    password: ADMIN_PASS,
  });
  token = data.token;
  console.log('Login realizado com sucesso!');
}

function headers() {
  return { Authorization: `Bearer ${token}` };
}

async function atualizarJogos() {
  // 1. Busca jogos em andamento/finalizados na API
  const { data } = await axios.get(
    'https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED,FINISHED',
    { headers: { 'X-Auth-Token': API_KEY } }
  );

  if (!data.matches || data.matches.length === 0) {
    console.log('Nenhum jogo em andamento ou finalizado.');
    return;
  }

  // Monta mapa: "HomeAPI|AwayAPI" → { homeScore, awayScore, status }
  const resultadosAPI = {};
  for (const match of data.matches) {
    const chave = `${match.homeTeam.name}|${match.awayTeam.name}`;
    resultadosAPI[chave] = {
      homeScore: match.score.fullTime.home,
      awayScore: match.score.fullTime.away,
      status: STATUS_MAP[match.status] || match.status,
    };
  }

  // 2. Busca jogos do nosso backend
  const { data: jogos } = await axios.get(`${BACKEND_URL}/admin/games`, { headers: headers() });

  let atualizados = 0;
  for (const jogo of jogos) {
    if (jogo.is_finished) continue; // não sobrescreve jogos finalizados manualmente

    const homeAPI = TEAM_MAP[jogo.home_team];
    const awayAPI = TEAM_MAP[jogo.away_team];

    if (!homeAPI || !awayAPI) {
      console.log(`Time não mapeado: ${jogo.home_team} ou ${jogo.away_team}`);
      continue;
    }

    const chave = `${homeAPI}|${awayAPI}`;
    const resultado = resultadosAPI[chave];
    if (!resultado) continue;

    const { homeScore, awayScore, status } = resultado;
    if (homeScore === null || awayScore === null) continue;

    // Atualiza placar se mudou
    if (jogo.home_score !== homeScore || jogo.away_score !== awayScore) {
      await axios.put(
        `${BACKEND_URL}/admin/games/${jogo.id}/result`,
        { home_score: homeScore, away_score: awayScore },
        { headers: headers() }
      );
      atualizados++;
      console.log(`Placar: ${jogo.home_team} ${homeScore}x${awayScore} ${jogo.away_team}`);
    }

    // Finaliza sempre que API disser FINISHED e jogo ainda não estiver FZ
    if (status === 'FZ' && jogo.status !== 'FZ') {
      await axios.put(
        `${BACKEND_URL}/admin/games/${jogo.id}/finalizar`,
        {},
        { headers: headers() }
      );
      console.log(`Finalizado: ${jogo.home_team} x ${jogo.away_team}`);
    }
  }

  console.log(`Jogos atualizados: ${atualizados}`);
}

async function atualizarArtilheiros() {
  // Busca artilheiros da API
  const { data } = await axios.get(
    'https://api.football-data.org/v4/competitions/WC/scorers?limit=50',
    { headers: { 'X-Auth-Token': API_KEY } }
  );

  if (!data.scorers || data.scorers.length === 0) return;

  // Monta mapa: nome API → gols
  const golsMap = {};
  for (const scorer of data.scorers) {
    golsMap[scorer.player.name] = scorer.goals || 0;
  }

  // Busca artilheiros do backend
  const { data: artilheiros } = await axios.get(
    `${BACKEND_URL}/admin/artilheiros`,
    { headers: headers() }
  );

  let atualizados = 0;
  for (const art of artilheiros) {
    const nomeAPI = ARTILHEIRO_MAP[art.name];
    if (!nomeAPI) {
      console.log(`Artilheiro não mapeado: ${art.name}`);
      continue;
    }

    const gols = golsMap[nomeAPI] || 0;
    if (art.goals === gols) continue;

    await axios.put(
      `${BACKEND_URL}/admin/artilheiros/${art.id}`,
      { goals: gols },
      { headers: headers() }
    );

    console.log(`Artilheiro atualizado: ${art.name} → ${gols} gols`);
    atualizados++;
  }

  console.log(`Artilheiros atualizados: ${atualizados}`);
}

async function executar() {
  try {
    await login();
    await atualizarJogos();
    await atualizarArtilheiros();
  } catch (e) {
    console.error('Erro:', e.message);
    // Se token expirou, faz login novamente na próxima execução
    if (e.response?.status === 401) token = null;
  }
}

// Roda imediatamente e depois a cada 1 minuto
executar();
setInterval(executar, 60 * 1000);

console.log('Auto-update iniciado! Atualizando a cada 1 minuto...');
