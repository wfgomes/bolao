const URL =
"https://script.google.com/macros/s/AKfycbywSw01CSQHHRH5ZF1H8fALI6vbSfQFJwZHk-bWLIjrrXDyCxuX6sgNcyOJoiaD9idXug/exec";

async function carregarParticipante() {

    const tabela =
        document.getElementById("palpites");

    const nome =
        new URLSearchParams(window.location.search)
        .get("nome");

    try {

        const response =
            await fetch(
                `${URL}?participante=${encodeURIComponent(nome)}`
            );

        const dados = await response.json();

        document.getElementById("titulo").innerHTML =
            `⚽ Palpites de ${dados.nome}`;

        const linhas = dados.palpites;

        let artilheiro = "";
        let artilheiroGols = "";

        let html = `
        <thead>
            <tr>
                <th>Time 1</th>
                <th>Placar</th>
                <th>Time 2</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
        `;

        for(let i = 1; i < linhas.length; i++){

            const linha = linhas[i];

            if(
                linha[5] === "Artilheiro"
            ){
                artilheiro = linha[6];
                artilheiroGols = linha[7];
                continue;
            }

            const time1 = linha[1];
            const placar1 = linha[2];
            const placar2 = linha[3];
            const time2 = linha[4];
            const pontuacao = linha[7];

            if(!time1 || !time2){
                continue;
            }

            let classe = "";
            let status = "⏳ Não realizado";

            const resultado1 = linha[5];
            const resultado2 = linha[6];

            const jogoFinalizado =
                resultado1 !== "-" &&
                resultado2 !== "-" &&
                resultado1 !== "" &&
                resultado2 !== "";

            if(jogoFinalizado){

                if(pontuacao == 3){

                    classe = "acerto-exato";
                    status = "🟢 Placar exato";

                }
                else if(pontuacao == 1){

                    classe = "acerto-vencedor";
                    status = "🟡 Acertou vencedor";

                }
                else{

                    classe = "erro";
                    status = "🔴 Errou";
                }
            }

            html += `
            <tr class="${classe}">
                <td>${time1}</td>
                <td>
                    <strong>
                        ${placar1} x ${placar2}
                    </strong>
                </td>
                <td>${time2}</td>
                <td>${status}</td>
            </tr>
            `;
        }

        html += "</tbody>";

        tabela.innerHTML = html;

        if(artilheiro){

            document.getElementById("titulo")
                .insertAdjacentHTML(
                    "afterend",
                    `
                    <div class="artilheiro-card">
                        🥇 Artilheiro escolhido:
                        <strong>${artilheiro}</strong>
                        ${artilheiroGols !== "" ? `<span class="artilheiro-gols">(${artilheiroGols} gols)</span>` : ""}
                    </div>
                    `
                );
        }

    } catch (erro) {

        console.error(erro);

        tabela.innerHTML =
            "<tr><td>Erro ao carregar dados</td></tr>";
    }

    document.getElementById("loading")
        .style.display = "none";
}

carregarParticipante();