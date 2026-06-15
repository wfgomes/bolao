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

async function toggleDetalhes(idx) {
  const detalhes = document.getElementById(`detalhes-${idx}`);
  const aberto = detalhes.style.display !== "none";

  if (aberto) {
    detalhes.style.display = "none";
    return;
  }

  detalhes.style.display = "block";
  if (detalhes.dataset.carregado === "true") return;

  detalhes.innerHTML = `<div class="loading-detalhes">Carregando...</div>`;

  try {
    const dados = await fetch(`${URL}?partida=${idx}`).then(r => r.json());

    const cravadores = [], acertadores = [], erradores = [];

    for (const p of dados) {
      if (p.status !== "FZ" && p.status !== "EA" && p.status !== "IN") continue;
      if (p.pontuacao == 3) cravadores.push(p.nome);
      else if (p.pontuacao == 1) acertadores.push(p.nome);
      else erradores.push(p.nome);
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
  } catch (erro) {
    detalhes.innerHTML = `<p style="color:red">Erro ao carregar detalhes.</p>`;
  }
}

async function carregarPartidas() {
  try {
    const resumo = await fetch(`${URL}?resumo=true`).then(r => r.json());

    const partidas = resumo.map(r => ({
      time1:      r.time1,
      time2:      r.time2,
      resultado1: r.resultado1,
      resultado2: r.resultado2,
      status:     r.status,
      cravadas:   r.cravadas,
      acertos:    r.acertos,
      erros:      r.erros,
    }));

    dadosGlobais = partidas;
    renderPartidas(partidas);
  } catch (erro) {
    console.error(erro);
    document.getElementById("partidas-lista")
      .innerHTML = `<p style="padding:16px;color:red">Erro ao carregar dados. Tente novamente.</p>`;
  }
  document.getElementById("loading").style.display = "none";
}

carregarPartidas();
