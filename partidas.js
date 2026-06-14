const URL =
"https://script.google.com/macros/s/AKfycbywSw01CSQHHRH5ZF1H8fALI6vbSfQFJwZHk-bWLIjrrXDyCxuX6sgNcyOJoiaD9idXug/exec";

const CACHE_KEY = "bolao_partidas";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

function getCached() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if(!raw) return null;
        const cache = JSON.parse(raw);
        if(Date.now() - cache.timestamp > CACHE_TTL) return null;
        return cache;
    } catch {
        return null;
    }
}

function setCache(partidas) {
    const timestamp = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp, partidas }));
    return timestamp;
}

function formatarHora(timestamp) {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderPartidas(partidas) {

    const lista = document.getElementById("partidas-lista");
    lista.innerHTML = "";

    for(const partida of partidas){

        const { time1, time2, resultado1, resultado2, status, acertadores } = partida;

        const aoVivo = status === "EA" || status === "IN";

        const placar = status === "AG"
            ? `<span class="card-placar-ag">– x –</span>`
            : `<span class="card-placar">${resultado1} x ${resultado2}</span>`;

        const statusBadge = aoVivo
            ? `<span class="card-badge-live">● Ao vivo</span>`
            : "";

        const total = acertadores.length;

        let acertosHtml;
        if(total === 0){
            acertosHtml = `<span class="card-ninguem">Ninguém acertou o placar exato</span>`;
        } else {
            const nomes = acertadores.map(n =>
                `<a class="participante" href="participante.html?nome=${encodeURIComponent(n)}">${n}</a>`
            ).join(" · ");
            acertosHtml = `
                <span class="card-total">${total} acerto${total > 1 ? "s" : ""}</span>
                <span class="card-nomes">${nomes}</span>
            `;
        }

        lista.innerHTML += `
        <div class="partida-card">
            <div class="partida-jogo">
                <span class="partida-time">${time1}</span>
                ${placar}
                <span class="partida-time">${time2}</span>
                ${statusBadge}
            </div>
            <div class="partida-acertos">
                ${acertosHtml}
            </div>
        </div>
        `;
    }
}

function setLoadingText(texto) {
    document.getElementById("loading").textContent = texto;
}

async function buscarPartidas() {

    // Tenta o arquivo pré-processado primeiro (instantâneo)
    try {
        const res = await fetch("partidas-cache.json?_=" + Date.now());
        if(res.ok){
            const data = await res.json();
            if(Array.isArray(data) && data.length > 0) return data;
        }
    } catch { /* arquivo não existe, segue para busca ao vivo */ }

    setLoadingText("Buscando participantes...");

    const ranking = await fetch(URL).then(r => r.json());
    const nomes = ranking.map(p => p.nome);

    const todos = [];
    for(let i = 0; i < nomes.length; i++){

        setLoadingText(`Carregando... (${i + 1}/${nomes.length})`);

        const data = await fetch(
            `${URL}?participante=${encodeURIComponent(nomes[i])}`
        ).then(r => r.json());

        todos.push(data);
    }

    const partidas = [];

    for(const linha of todos[0].palpites.slice(1)){
        if(linha[5] === "Artilheiro" || !linha[1] || !linha[4]) continue;
        partidas.push({
            time1:       linha[1],
            time2:       linha[4],
            resultado1:  linha[5],
            resultado2:  linha[6],
            status:      linha[8],
            acertadores: []
        });
    }

    for(const participante of todos){

        let idx = 0;

        for(const linha of participante.palpites.slice(1)){

            if(linha[5] === "Artilheiro" || !linha[1] || !linha[4]) continue;

            const placar1    = Number(linha[2]);
            const placar2    = Number(linha[3]);
            const resultado1 = linha[5];
            const resultado2 = linha[6];
            const pontuacao  = linha[7];
            const statusP    = linha[8];
            const partida    = partidas[idx];

            if(statusP === "FZ" && pontuacao == 3){
                partida.acertadores.push(participante.nome);
            } else if(
                (statusP === "EA" || statusP === "IN") &&
                resultado1 !== "-" && resultado2 !== "-" &&
                placar1 === Number(resultado1) &&
                placar2 === Number(resultado2)
            ){
                partida.acertadores.push(participante.nome);
            }

            idx++;
        }
    }

    return partidas;
}

function mostrarCacheInfo(timestamp, forcarAtualizacao) {

    const info = document.getElementById("cache-info");

    info.innerHTML = `
        Atualizado às ${formatarHora(timestamp)}
        &nbsp;·&nbsp;
        <a href="#" id="btn-atualizar">Atualizar</a>
    `;

    document.getElementById("btn-atualizar").addEventListener("click", e => {
        e.preventDefault();
        localStorage.removeItem(CACHE_KEY);
        document.getElementById("loading").style.display = "flex";
        info.innerHTML = "";
        carregarPartidas();
    });
}

async function carregarPartidas() {

    try {

        const cached = getCached();

        if(cached){
            renderPartidas(cached.partidas);
            mostrarCacheInfo(cached.timestamp);
            document.getElementById("loading").style.display = "none";
            return;
        }

        const partidas = await buscarPartidas();
        const timestamp = setCache(partidas);
        renderPartidas(partidas);
        mostrarCacheInfo(timestamp);

    } catch(erro) {

        console.error(erro);

        document.getElementById("partidas-lista")
            .innerHTML = `<p style="padding:16px;color:red">Erro ao carregar dados. Tente novamente.</p>`;
    }

    document.getElementById("loading").style.display = "none";
}

carregarPartidas();
