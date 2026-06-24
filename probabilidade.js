const URL_API =
    "https://script.google.com/macros/s/AKfycbxyaSNgT0GA-X86v661OUcoWzHvaBDGQaIYBLMHcjO1NlneikjWZztS-AumYflFC6xDJQ/exec";

// Mapeamento artilheiro → time (para encontrar jogos restantes)
const ARTILHEIRO_TIMES = {
    "Kylian Mbappé": "França",
    "Mbappé": "França",
    "Messi": "Argentina",
    "Lionel Messi": "Argentina",
    "Cristiano Ronaldo": "Portugal",
    "Ronaldo": "Portugal",
    "Neymar": "Brasil",
    "Neymar Jr": "Brasil",
    "Haaland": "Noruega",
    "Erling Haaland": "Noruega",
    "Harry Kane": "Inglaterra",
    "Kane": "Inglaterra",
    "Lewandowski": "Polônia",
    "Robert Lewandowski": "Polônia",
    "Lautaro": "Argentina",
    "Lautaro Martínez": "Argentina",
    "Vinicius": "Brasil",
    "Vinicius Jr": "Brasil",
    "Benzema": "França",
    "Karim Benzema": "França",
    "Salah": "Egito",
    "Mohamed Salah": "Egito",
    "Son": "Coreia do Sul",
    "Son Heung-min": "Coreia do Sul",
    "Richarlison": "Brasil",
    "Lukaku": "Bélgica",
    "Romelu Lukaku": "Bélgica",
};

function getArtilheiroTime(nome) {
    if (!nome) return null;
    if (ARTILHEIRO_TIMES[nome]) return ARTILHEIRO_TIMES[nome];
    const nomeLower = nome.toLowerCase();
    for (const [jogador, time] of Object.entries(ARTILHEIRO_TIMES)) {
        if (nomeLower.includes(jogador.toLowerCase()) ||
            jogador.toLowerCase().includes(nomeLower)) {
            return time;
        }
    }
    return null;
}

// Distribuição de Poisson — quantos gols o artilheiro marca no jogo
function poissonSample(lambda) {
    if (lambda <= 0) return 0;
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
}

async function fetchParticipante(nome) {
    const resp = await fetch(`${URL_API}?participante=${encodeURIComponent(nome)}`);
    return resp.json();
}

function parseData(dados) {
    const linhas = dados.palpites;
    let pontosAtuais = 0;
    let artilheiro = null;
    let artilheiroGols = 0;
    const jogosAG = [];
    const jogosJogadosPorTime = {}; // time → nº de jogos finalizados

    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        if (!linha || !linha[1]) continue;

        if (linha[5] === "Artilheiro") {
            artilheiro = linha[6];
            artilheiroGols = Number(linha[7]) || 0;
            continue;
        }
        if (linha[6] === "TOTAL") {
            pontosAtuais = Number(linha[7]) || 0;
            continue;
        }

        const time1 = linha[1];
        const time2 = linha[4];
        if (!time1 || !time2) continue;

        const status = linha[8];

        if (status != "FZ") {
            jogosAG.push({
                key: `${time1}|||${time2}`,
                time1,
                placar1: Number(linha[2]),
                placar2: Number(linha[3]),
                time2
            });
        } else {
            // FZ — jogo já disputado
            jogosJogadosPorTime[time1] = (jogosJogadosPorTime[time1] || 0) + 1;
            jogosJogadosPorTime[time2] = (jogosJogadosPorTime[time2] || 0) + 1;
        }
    }

    return {
        nome: dados.nome,
        pontosAtuais,
        artilheiro,
        artilheiroGols,
        jogosAG,
        jogosJogadosPorTime
    };
}

function getOutcome(p1, p2) {
    return p1 > p2 ? "H" : p1 < p2 ? "A" : "D";
}

function buildArtilheiroInfo(participantes, gameKeys) {
    const jogosJogadosPorTime = participantes[0]?.jogosJogadosPorTime || {};

    return participantes.map(p => {
        if (!p.artilheiro) return null;
        const time = getArtilheiroTime(p.artilheiro);
        if (!time) return null;
        const jogosJogados = jogosJogadosPorTime[time] || 0;
        if (jogosJogados === 0) return null;

        const mediaPorJogo = p.artilheiroGols / jogosJogados;

        // Jogos restantes (AG) em que o time do artilheiro participa
        const jogosRestantes = gameKeys.filter(key => {
            const [t1, t2] = key.split("|||");
            return t1 === time || t2 === time;
        });

        return { time, mediaPorJogo, jogosJogados, jogosRestantes };
    });
}

function simulate(participantes, N = 100000) {
    const gameKeys = [
        ...new Set(participantes.flatMap(p => p.jogosAG.map(j => j.key)))
    ];

    const predictions = {};
    for (const key of gameKeys) {
        predictions[key] = {};
        for (const p of participantes) {
            const jogo = p.jogosAG.find(j => j.key === key);
            if (jogo) {
                predictions[key][p.nome] = {
                    placar1: jogo.placar1,
                    placar2: jogo.placar2
                };
            }
        }
    }

    const artilheiroInfo = buildArtilheiroInfo(participantes, gameKeys);

    const wins = {};
    participantes.forEach(p => (wins[p.nome] = 0));

    const P_HOME = 0.40;
    const P_DRAW = 0.25;
    const P_EXACT = 0.10;

    for (let sim = 0; sim < N; sim++) {
        const pontos = {};
        participantes.forEach(p => (pontos[p.nome] = p.pontosAtuais));

        // ── Simular resultados dos jogos AG ──────────────
        for (const key of gameKeys) {
            const rand = Math.random();
            const actualOutcome =
                rand < P_HOME ? "H" :
                rand < P_HOME + P_DRAW ? "D" : "A";

            const predMap = predictions[key];
            const correctGroups = {};

            for (const [nome, pred] of Object.entries(predMap)) {
                if (getOutcome(pred.placar1, pred.placar2) !== actualOutcome) continue;
                pontos[nome] += 1;
                const scoreKey = `${pred.placar1}-${pred.placar2}`;
                if (!correctGroups[scoreKey]) correctGroups[scoreKey] = [];
                correctGroups[scoreKey].push(nome);
            }

            // Placar exato: sorteio único por grupo de mesmo placar (correlacionado)
            for (const nomes of Object.values(correctGroups)) {
                if (Math.random() < P_EXACT) {
                    nomes.forEach(nome => (pontos[nome] += 2));
                }
            }
        }

        // ── Simular gols futuros do artilheiro ───────────
        // Cache por (time + jogo) para que participantes com o mesmo artilheiro
        // recebam exatamente os mesmos gols simulados
        const goalsCache = {};

        participantes.forEach((p, idx) => {
            const info = artilheiroInfo[idx];
            if (!info) return;

            for (const gameKey of info.jogosRestantes) {
                const cacheKey = `${info.time}|${gameKey}`;
                if (!(cacheKey in goalsCache)) {
                    goalsCache[cacheKey] = poissonSample(info.mediaPorJogo);
                }
                pontos[p.nome] += goalsCache[cacheKey];
            }
        });

        // ── Determinar vencedor ──────────────────────────
        const maxPts = Math.max(...Object.values(pontos));
        const vencedores = participantes
            .map(p => p.nome)
            .filter(nome => pontos[nome] === maxPts);
        vencedores.forEach(nome => (wins[nome] += 1 / vencedores.length));
    }

    const probs = {};
    for (const [nome, w] of Object.entries(wins)) {
        probs[nome] = ((w / N) * 100).toFixed(1);
    }
    return probs;
}

function findJogosDiferentes(participantes) {
    const gameKeys = [
        ...new Set(participantes.flatMap(p => p.jogosAG.map(j => j.key)))
    ];

    const result = [];

    for (const key of gameKeys) {
        let time1 = "", time2 = "";
        const preds = {};

        for (const p of participantes) {
            const jogo = p.jogosAG.find(j => j.key === key);
            if (!jogo) continue;
            preds[p.nome] = { placar1: jogo.placar1, placar2: jogo.placar2 };
            time1 = jogo.time1;
            time2 = jogo.time2;
        }

        const scores = Object.values(preds).map(pr => `${pr.placar1}-${pr.placar2}`);
        if (new Set(scores).size === 1) continue;

        const outcomes = Object.values(preds).map(pr => getOutcome(pr.placar1, pr.placar2));

        result.push({
            key,
            time1,
            time2,
            preds,
            differentOutcome: new Set(outcomes).size > 1
        });
    }

    return result;
}

function renderResultados(participantes, probs, jogosDiff) {
    const sorted = [...participantes].sort(
        (a, b) => Number(probs[b.nome]) - Number(probs[a.nome])
    );

    const medalhas = ["🥇", "🥈", "🥉"];
    const barCores = ["#198754", "#0d6efd", "#6f42c1", "#fd7e14", "#dc3545"];

    // ── Probabilidades ───────────────────────────────
    let probHtml = '<h2 class="section-title">📊 Probabilidade de Campeão</h2>';

    sorted.forEach((p, i) => {
        const pct = probs[p.nome];
        const medalha = medalhas[i] || `${i + 1}.`;
        const cor = barCores[i] || "#aaa";

        probHtml += `
        <div class="prob-card">
            <div class="prob-header">
                <span class="prob-pos">${medalha}</span>
                <span class="prob-nome">${p.nome}</span>
                <span class="prob-pct" style="color:${cor}">${pct}%</span>
            </div>
            <div class="prob-bar-bg">
                <div class="prob-bar" style="width:${pct}%;background:${cor}"></div>
            </div>
            <div class="prob-pts">${p.pontosAtuais} pts atuais</div>
        </div>`;
    });

    document.getElementById("prob-lista").innerHTML = probHtml;

    // ── Artilheiro ───────────────────────────────────
    const artInfo = buildArtilheiroInfo(
        participantes,
        [...new Set(participantes.flatMap(p => p.jogosAG.map(j => j.key)))]
    );

    const comArtilheiro = participantes.filter(p => p.artilheiro);

    if (comArtilheiro.length > 0) {
        // Agrupa participantes por artilheiro escolhido
        const artGroups = {};
        participantes.forEach((p, idx) => {
            if (!p.artilheiro) return;
            if (!artGroups[p.artilheiro]) {
                artGroups[p.artilheiro] = {
                    gols: p.artilheiroGols,
                    info: artInfo[idx],
                    nomes: []
                };
            }
            artGroups[p.artilheiro].nomes.push(p.nome);
        });

        const artSorted = Object.entries(artGroups).sort(
            (a, b) => b[1].gols - a[1].gols
        );
        const maxGols = artSorted[0]?.[1].gols ?? 0;

        let artHtml = '<h2 class="section-title">🥅 Artilheiro (gols = pts)</h2>';
        artHtml += '<div class="diff-table">';

        for (const [jogador, { gols, info, nomes }] of artSorted) {
            const lider = gols === maxGols;
            const mediaStr = info
                ? `${info.mediaPorJogo.toFixed(2)} gols/jogo · ${info.jogosRestantes.length} jogo(s) restante(s)`
                : "time não identificado";

            artHtml += `
            <div class="diff-row">
                <div class="diff-cell diff-jogo-cell" style="flex:3;flex-direction:column;align-items:flex-start;gap:2px">
                    <div>
                        <strong>${jogador}</strong>
                        <span class="artilheiro-gols-badge">${gols} gols</span>
                        ${lider ? '<span class="badge-lider">Liderando</span>' : ""}
                    </div>
                    <div style="font-size:11px;color:#888">${mediaStr}</div>
                </div>
                <div class="diff-cell" style="flex:1;color:#555;font-size:13px">${nomes.join(", ")}</div>
            </div>`;
        }

        artHtml += "</div>";
        document.getElementById("artilheiros-lista").innerHTML = artHtml;
    }

    // ── Jogos decisivos ──────────────────────────────
    if (jogosDiff.length === 0) {
        document.getElementById("jogos-diferentes").innerHTML =
            '<p class="nenhum-diff">Todos os palpites dos jogos restantes são idênticos.</p>';
        return;
    }

    const diffOutcome = jogosDiff.filter(j => j.differentOutcome);
    const diffScore   = jogosDiff.filter(j => !j.differentOutcome);

    let diffHtml = '<h2 class="section-title">⚔️ Jogos Decisivos</h2>';

    if (diffOutcome.length > 0) {
        diffHtml += '<p class="diff-subtitle">🔴 Resultado diferente — pontos ou zero</p>';
        diffHtml += renderJogosTable(diffOutcome, sorted);
    }

    if (diffScore.length > 0) {
        diffHtml += '<p class="diff-subtitle" style="margin-top:14px">🟡 Mesmo vencedor, placar diferente — disputa pelo exato (3 pts)</p>';
        diffHtml += renderJogosTable(diffScore, sorted);
    }

    document.getElementById("jogos-diferentes").innerHTML = diffHtml;
}

function renderJogosTable(jogos, sorted) {
    let html = '<div class="diff-table">';

    html += '<div class="diff-row diff-header">';
    html += '<div class="diff-cell diff-jogo-cell">Jogo</div>';
    sorted.forEach(p => {
        html += `<div class="diff-cell diff-pred-cell">${p.nome}</div>`;
    });
    html += "</div>";

    for (const jogo of jogos) {
        const scoreFreq = {};
        sorted.forEach(p => {
            const pred = jogo.preds[p.nome];
            if (!pred) return;
            const k = `${pred.placar1}-${pred.placar2}`;
            scoreFreq[k] = (scoreFreq[k] || 0) + 1;
        });
        const maxFreq = Math.max(...Object.values(scoreFreq));

        html += '<div class="diff-row">';
        html += `
        <div class="diff-cell diff-jogo-cell">
            <span class="diff-time">${jogo.time1}</span>
            <span class="diff-vs">x</span>
            <span class="diff-time">${jogo.time2}</span>
        </div>`;

        sorted.forEach(p => {
            const pred = jogo.preds[p.nome];
            const placar = pred ? `${pred.placar1} x ${pred.placar2}` : "—";
            const k = pred ? `${pred.placar1}-${pred.placar2}` : "";
            const unico = k && scoreFreq[k] === 1 && maxFreq > 1;
            const cls = unico
                ? "diff-cell diff-pred-cell diff-pred-unico"
                : "diff-cell diff-pred-cell";
            html += `<div class="${cls}">${placar}</div>`;
        });

        html += "</div>";
    }

    html += "</div>";
    return html;
}

async function calcular() {
    const nomes = document.getElementById("participantes-input").value
        .split("\n")
        .map(n => n.trim())
        .filter(n => n.length > 0);

    if (nomes.length < 2) {
        alert("Digite pelo menos 2 participantes.");
        return;
    }

    document.getElementById("loading").style.display = "flex";
    document.getElementById("resultado").style.display = "none";
    document.getElementById("calcular-btn").disabled = true;

    await new Promise(r => setTimeout(r, 50));

    try {
        const dados = await Promise.all(nomes.map(fetchParticipante));
        const participantes = dados.map(parseData);

        const probs     = simulate(participantes);
        const jogosDiff = findJogosDiferentes(participantes);

        renderResultados(participantes, probs, jogosDiff);
        document.getElementById("resultado").style.display = "block";

    } catch (err) {
        console.error(err);
        alert("Erro ao buscar dados. Verifique os nomes e tente novamente.");
    }

    document.getElementById("loading").style.display = "none";
    document.getElementById("calcular-btn").disabled = false;
}
