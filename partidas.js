const URL =
"https://script.google.com/macros/s/AKfycbywSw01CSQHHRH5ZF1H8fALI6vbSfQFJwZHk-bWLIjrrXDyCxuX6sgNcyOJoiaD9idXug/exec";

async function carregarPartidas() {

    try {

        const ranking = await fetch(URL).then(r => r.json());
        const nomes = ranking.map(p => p.nome);

        const todos = await Promise.all(
            nomes.map(nome =>
                fetch(`${URL}?participante=${encodeURIComponent(nome)}`)
                    .then(r => r.json())
            )
        );

        // Monta a lista de partidas a partir do primeiro participante
        const partidas = [];

        for(const linha of todos[0].palpites.slice(1)){

            if(linha[5] === "Artilheiro" || !linha[1] || !linha[4]) continue;

            partidas.push({
                time1:        linha[1],
                time2:        linha[4],
                resultado1:   linha[5],
                resultado2:   linha[6],
                status:       linha[8],
                acertadores:  []
            });
        }

        // Para cada participante, verifica quem acertou o placar exato
        for(const participante of todos){

            let idx = 0;

            for(const linha of participante.palpites.slice(1)){

                if(linha[5] === "Artilheiro" || !linha[1] || !linha[4]) continue;

                const placar1      = Number(linha[2]);
                const placar2      = Number(linha[3]);
                const resultado1   = linha[5];
                const resultado2   = linha[6];
                const pontuacao    = linha[7];
                const statusP      = linha[8];

                const partida = partidas[idx];

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

    } catch (erro) {

        console.error(erro);

        document.getElementById("partidas-lista")
            .innerHTML = `<p style="color:red">Erro ao carregar dados.</p>`;
    }

    document.getElementById("loading").style.display = "none";
}

carregarPartidas();
