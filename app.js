const URL =
"https://script.google.com/macros/s/AKfycbxyaSNgT0GA-X86v661OUcoWzHvaBDGQaIYBLMHcjO1NlneikjWZztS-AumYflFC6xDJQ/exec";

async function carregarRanking() {

    try {

        const response = await fetch(URL);
        const ranking = await response.json();

        ranking.sort(
            (a, b) => Number(b.pontos || 0) - Number(a.pontos || 0)
        );

        const lista = document.getElementById("ranking-lista");
        lista.innerHTML = "";

        ranking.forEach((item, index) => {

            let posicao = index + 1;
            let posClasse = "";

            if (index === 0) { posicao = "🥇"; posClasse = "pos-ouro"; }
            else if (index === 1) { posicao = "🥈"; posClasse = "pos-prata"; }
            else if (index === 2) { posicao = "🥉"; posClasse = "pos-bronze"; }

            lista.innerHTML += `
                <div class="ranking-card ${posClasse}">
                    <span class="ranking-pos">${posicao}</span>
                    <a class="participante ranking-nome"
                       href="participante.html?nome=${encodeURIComponent(item.nome)}">
                        ${item.nome}
                    </a>
                    <span class="ranking-pontos">${item.pontos} <small>pts</small></span>
                </div>
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

    document.querySelectorAll("#ranking-lista .ranking-card").forEach(card => {

        const nome = card.querySelector(".ranking-nome")?.textContent.toLowerCase() ?? "";
        card.style.display = nome.includes(termo) ? "" : "none";
    });
});