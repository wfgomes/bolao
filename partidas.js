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

        const tbody = document.querySelector("#partidasTable tbody");
        tbody.innerHTML = "";

        for(const partida of partidas){

            const { time1, time2, resultado1, resultado2, status, acertadores } = partida;

            let placarTexto;
            if(status === "AG"){
                placarTexto = `<span class="placar-ag">– x –</span>`;
            } else {
                placarTexto = `<strong>${resultado1} x ${resultado2}</strong>`;
            }

            const totalAcertos = acertadores.length;

            const badgeAcertos = totalAcertos > 0
                ? `<span class="badge-acertos">${totalAcertos}</span>`
                : `<span class="badge-zero">0</span>`;

            const nomesTexto = acertadores.length > 0
                ? acertadores.map(n =>
                    `<a class="participante" href="participante.html?nome=${encodeURIComponent(n)}">${n}</a>`
                  ).join(", ")
                : "–";

            tbody.innerHTML += `
            <tr>
                <td class="td-time">${time1}</td>
                <td>${placarTexto}</td>
                <td class="td-time">${time2}</td>
                <td>${badgeAcertos}</td>
                <td class="td-acertadores">${nomesTexto}</td>
            </tr>
            `;
        }

    } catch (erro) {

        console.error(erro);

        document.querySelector("#partidasTable tbody")
            .innerHTML =
            "<tr><td colspan='5'>Erro ao carregar dados</td></tr>";
    }

    document.getElementById("loading").style.display = "none";
}

carregarPartidas();
