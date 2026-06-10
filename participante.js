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

        console.log(dados);

        if (!dados || !dados.palpites) {

            tabela.innerHTML =
                "<tr><td>Nenhum palpite encontrado.</td></tr>";

            return;
        }

        document.getElementById("titulo").innerHTML =
            `⚽ Palpites de ${dados.nome}`;

        const linhas = dados.palpites;

        let html = `
            <thead>
                <tr>
                    <th>Time 1</th>
                    <th>Placar</th>
                    <th>Time 2</th>
                </tr>
            </thead>
            <tbody>
        `;

        for (let i = 1; i < linhas.length; i++) {

            const linha = linhas[i];

            const time1 = linha[1];
            const placar1 = linha[2];
            const placar2 = linha[3];
            const time2 = linha[4];

            if (!time1 || !time2) continue;

            html += `
                <tr>
                    <td>${time1}</td>
                    <td><strong>${placar1} x ${placar2}</strong></td>
                    <td>${time2}</td>
                </tr>
            `;
        }

        html += "</tbody>";

        tabela.innerHTML = html;

    } catch (erro) {

        console.error(erro);

        tabela.innerHTML =
            "<tr><td>Erro ao carregar palpites.</td></tr>";
    }

    document.getElementById("loading").style.display =
        "none";
}

carregarParticipante();