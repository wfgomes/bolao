const URL =
"https://script.google.com/macros/s/AKfycbxyaSNgT0GA-X86v661OUcoWzHvaBDGQaIYBLMHcjO1NlneikjWZztS-AumYflFC6xDJQ/exec";

let dadosGlobais = null; // cache dos dados completos

function renderPartidas(partidas) {
    const lista = document.getElementById("partidas-lista");
    lista.innerHTML = "";

    for (const [idx, partida] of partidas.entries()) {
        const { time1, time2, resultado1, resultado2, status, cravadas, acertos, erros } = partida;
        if (status === "AG") continue;

        const aoVivo = status === "EA" || status === "IN";
        const placar = `<span class="card-placar">${resultado1} x ${resultado2}</span>`;
        const statusBadge = aoVivo
            ? `<span class="card-badge-live">● Ao vivo</span>`
            : "";

        lista.innerHTML += `
        <div class="partida-card" id="partida-${idx}">
            <div class="partida-jogo" onclick="toggleDetalhes(${idx})" style="cursor:pointer">
                <span class="partida-time">${time1}</span>
                ${placar}
                <span class="partida-time">${time2}</span>
                ${statusBadge}
            </div>
            <div class="partida-resumo">
                <span class="resumo-item cravada">🎯 Cravou: <strong>${cravadas}</strong></span>
                <span class="resumo-item acerto">✅ Resultado: <strong>${acertos}</strong></span>
                <span class="resumo-item erro">❌ Errou: <strong>${erros}</strong></span>
            </div>
            <div class="partida-detalhes" id="detalhes-${idx}" style="display:none">
                <div class="loading-detalhes">Carregando...</div>
            </div>
        </div>
        `;
    }
}

function toggleDetalhes(idx) {
    const detalhes = document.getElementById(`detalhes-${idx}`);
    const aberto = detalhes.style.display !== "none";

    if (aberto) {
        detalhes.style.display = "none";
        return;
    }

    detalhes.style.display = "block";

    // Só calcula se ainda não foi carregado
    if (detalhes.dataset.carregado === "true") return;

    const partida = dadosGlobais[idx];
    const cravadores = [];
    const acertadores = [];
    const erradores = [];

    for (const participante of dadosGlobais._participantes) {
        const linha = participante.palpites.slice(1).filter(l =>
            l[5] !== "Artilheiro" && l[1] && l[4]
        )[idx];
        if (!linha) continue;

        const pontuacao = linha[7];
        const statusP = linha[8];

        if (statusP !== "FZ" && statusP !== "EA" && statusP !== "IN") continue;

        if (pontuacao == 3) {
            cravadores.push(participante.nome);
        } else if (pontuacao == 1) {
            acertadores.push(participante.nome);
        } else {
            erradores.push(participante.nome);
        }
    }

    const linkNome = n =>
        `<a class="participante" href="participante.html?nome=${encodeURIComponent(n)}">${n}</a>`;

    detalhes.innerHTML = `
        ${cravadores.length > 0 ? `
        <div class="detalhe-grupo">
            <span class="detalhe-label cravada">🎯 Cravou (${cravadores.length})</span>
            <span class="card-nomes">${cravadores.map(linkNome).join(" · ")}</span>
        </div>` : ""}
        ${acertadores.length > 0 ? `
        <div class="detalhe-grupo">
            <span class="detalhe-label acerto">✅ Resultado (${acertadores.length})</span>
            <span class="card-nomes">${acertadores.map(linkNome).join(" · ")}</span>
        </div>` : ""}
        ${erradores.length > 0 ? `
        <div class="detalhe-grupo">
            <span class="detalhe-label erro">❌ Errou (${erradores.length})</span>
            <span class="card-nomes">${erradores.map(linkNome).join(" · ")}</span>
        </div>` : ""}
    `;
    detalhes.dataset.carregado = "true";
}

async function carregarPartidas() {
  try {
    const dados = await fetch(`${URL}?todos=true`).then(r => r.json());
    const todos = dados.participantes;
    const resumo = dados.resumo;

    const partidas = [];
    for (const [idx, linha] of todos[0].palpites.slice(1).entries()) {
      if (linha[5] === "Artilheiro" || !linha[1] || !linha[4]) continue;
      partidas.push({
        time1:      linha[1],
        time2:      linha[4],
        resultado1: linha[5],
        resultado2: linha[6],
        status:     linha[8],
        cravadas:   resumo[idx]?.cravadas ?? 0,
        acertos:    resumo[idx]?.acertos  ?? 0,
        erros:      resumo[idx]?.erros    ?? 0,
      });
    }

    dadosGlobais = partidas;
    dadosGlobais._participantes = todos;

    renderPartidas(partidas);
  } catch (erro) {
    console.error(erro);
    document.getElementById("partidas-lista")
      .innerHTML = `<p style="padding:16px;color:red">Erro ao carregar dados. Tente novamente.</p>`;
  }
  document.getElementById("loading").style.display = "none";
}

carregarPartidas();
