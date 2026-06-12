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
            const placar1 = Number(linha[2]);
            const placar2 = Number(linha[3]);
            const time2 = linha[4];
            const resultado1 = linha[5];
            const resultado2 = linha[6];
            const pontuacao = linha[7];
            const statusPartida = linha[8];

            if(!time1 || !time2){
                continue;
            }

            let classe = "";
            let status = "⏳ Não realizado";

            if(statusPartida !== "AG"){

                let resultado;

                if(statusPartida === "FZ"){

                    if(pontuacao == 3)     resultado = "exato";
                    else if(pontuacao == 1) resultado = "vencedor";
                    else                   resultado = "erro";

                } else {

                    const r1 = Number(resultado1);
                    const r2 = Number(resultado2);

                    if(placar1 === r1 && placar2 === r2){
                        resultado = "exato";
                    } else {
                        const vP = placar1 > placar2 ? 1 : placar2 > placar1 ? -1 : 0;
                        const vG = r1 > r2 ? 1 : r2 > r1 ? -1 : 0;
                        if(vP === vG){
                            resultado = vP === 0 ? "empate" : "vencedor";
                        } else {
                            resultado = "erro";
                        }
                    }
                }

                const sufixo =
                    statusPartida === "EA" || statusPartida === "IN" ? " ⏳ Em andamento" :
                    "";

                if(resultado === "exato"){
                    classe = "acerto-exato";
                    status = `🟢 Placar exato${sufixo}`;
                } else if(resultado === "empate"){
                    classe = "acerto-vencedor";
                    status = `🟡 Empate${sufixo}`;
                } else if(resultado === "vencedor"){
                    classe = "acerto-vencedor";
                    status = `🟡 Vencedor${sufixo}`;
                } else {
                    classe = "erro";
                    status = `🔴 Errou${sufixo}`;
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