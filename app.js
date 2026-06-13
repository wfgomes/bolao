const URL =
"https://script.google.com/macros/s/AKfycbywSw01CSQHHRH5ZF1H8fALI6vbSfQFJwZHk-bWLIjrrXDyCxuX6sgNcyOJoiaD9idXug/exec";

async function carregarRanking() {

    try {

        const response = await fetch(URL);
        const ranking = await response.json();

        ranking.sort(
            (a, b) => Number(b.pontos || 0) - Number(a.pontos || 0)
        );

        const tbody =
            document.querySelector("#rankingTable tbody");

        tbody.innerHTML = "";

        ranking.forEach((item, index) => {

            let posicao = index + 1;

            if (index === 0) posicao = "🥇";
            else if (index === 1) posicao = "🥈";
            else if (index === 2) posicao = "🥉";

            tbody.innerHTML += `
                <tr>
                    <td>${posicao}</td>

                    <td>
                        <a class="participante"
                           href="participante.html?nome=${encodeURIComponent(item.nome)}">
                            ${item.nome}
                        </a>
                    </td>

                    <td>${item.pontos}</td>
                </tr>
            `;
        });

    } catch (erro) {

        console.error(erro);

        document.querySelector("#rankingTable tbody")
            .innerHTML =
            "<tr><td colspan='3'>Erro ao carregar dados</td></tr>";
    }

    document.getElementById("loading").style.display = "none";
}

carregarRanking();

setInterval(carregarRanking, 30000);

document.getElementById("pesquisa").addEventListener("input", function(){

    const termo = this.value.toLowerCase();

    document.querySelectorAll("#rankingTable tbody tr").forEach(tr => {

        const nome = tr.querySelector("td:nth-child(2)")?.textContent.toLowerCase() ?? "";
        tr.style.display = nome.includes(termo) ? "" : "none";
    });
});