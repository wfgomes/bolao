<template>
  <div class="reg-wrap">
    <h1 class="page-title">📜 Regulamento</h1>

    <div class="card reg-card">
      <h2>Bolão Extra da Fase Mata-Mata</h2>

      <h3>Informações Gerais</h3>
      <ol>
        <li>Este é um <strong>bolão extra</strong> e <strong>não contará para a história dos campeões</strong> do Bolão Amigo.</li>
        <li>
          A pontuação seguirá as mesmas regras do bolão oficial:
          <ul>
            <li><strong>3 pontos</strong> para o placar exato;</li>
            <li><strong>1 ponto</strong> por acertar apenas o resultado da partida (vitória, empate ou derrota);</li>
            <li><strong>1 ponto por gol marcado pelo artilheiro</strong> escolhido.</li>
          </ul>
        </li>
        <li>Cada participante receberá um <strong>login e senha</strong> para acessar o sistema, cadastrar seus palpites e escolher seu artilheiro.</li>
        <li>O sistema será bloqueado automaticamente <strong>30 minutos antes do início do primeiro jogo da fase</strong>. Após esse horário, não será mais possível alterar palpites ou escolher o artilheiro. Cada participante é responsável por realizar suas apostas dentro do prazo.</li>
        <li>O <strong>artilheiro escolhido neste bolão permanecerá o mesmo até o final da Copa</strong>, não sendo permitida sua alteração nas fases seguintes.</li>
        <li>A classificação será atualizada em <strong>tempo real</strong>. Também será possível visualizar os palpites dos demais participantes clicando sobre o nome de cada um.</li>
        <li>Os palpites deverão considerar <strong>apenas o resultado dos 90 minutos regulamentares</strong> (incluindo acréscimos). Prorrogação e disputa por pênaltis <strong>não serão consideradas</strong> para efeito de pontuação.</li>
        <li>O bolão será disputado <strong>até a final da Copa do Mundo</strong>.</li>
      </ol>

      <h3>Premiação</h3>
      <p>A premiação será distribuída da seguinte forma:</p>
      <div class="premio-list">
        <div class="premio-item gold">
          <span class="premio-medal">🥇</span>
          <span class="premio-pos">1º lugar</span>
          <span class="premio-pct">70% do valor arrecadado</span>
        </div>
        <div class="premio-item silver">
          <span class="premio-medal">🥈</span>
          <span class="premio-pos">2º lugar</span>
          <span class="premio-pct">20% do valor arrecadado</span>
        </div>
        <div class="premio-item bronze">
          <span class="premio-medal">🥉</span>
          <span class="premio-pos">3º lugar</span>
          <span class="premio-pct">10% do valor arrecadado</span>
        </div>
      </div>

      <h3>Critério de divisão em caso de empate</h3>
      <p>Caso haja empate em qualquer posição premiada, os valores correspondentes às posições envolvidas serão <strong>somados e divididos igualmente</strong> entre os participantes empatados.</p>

      <div class="exemplos">
        <div class="exemplo">
          <div class="exemplo-titulo">Exemplo 1</div>
          <p>Dois participantes empatam em 1º lugar e um fica sozinho em 3º. Os prêmios de <strong>1º (70%)</strong> e <strong>2º (20%)</strong> são somados <strong>(90%)</strong> e divididos igualmente → <strong>45% para cada um</strong>. O 3º recebe normalmente os <strong>10%</strong>.</p>
        </div>
        <div class="exemplo">
          <div class="exemplo-titulo">Exemplo 2</div>
          <p>Dois participantes empatam em 2º lugar. Os prêmios de <strong>2º (20%)</strong> e <strong>3º (10%)</strong> são somados <strong>(30%)</strong> e divididos igualmente → <strong>15% para cada um</strong>.</p>
        </div>
        <div class="exemplo">
          <div class="exemplo-titulo">Exemplo 3</div>
          <p>Três participantes empatam em 1º lugar. Os prêmios de <strong>1º, 2º e 3º</strong> são somados <strong>(100%)</strong> e divididos igualmente → <strong>33,33% para cada um</strong>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reg-wrap { max-width: 680px; margin: 0 auto; }

.reg-card h2 {
  font-size: 17px; font-weight: 700; color: #1e293b;
  margin: 0 0 18px; padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0; text-align: center;
}

h3 {
  font-size: 14px; font-weight: 700; color: #1d4ed8;
  margin: 22px 0 10px; text-transform: uppercase; letter-spacing: .5px;
}

ol {
  padding-left: 20px; margin: 0; display: flex; flex-direction: column; gap: 10px;
}
ol li { font-size: 14px; color: #334155; line-height: 1.55; }

ul { margin: 6px 0 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
ul li { font-size: 13px; color: #475569; }

p { font-size: 14px; color: #334155; line-height: 1.55; margin: 0 0 12px; }

.premio-list { display: flex; flex-direction: column; gap: 8px; margin: 12px 0 18px; }
.premio-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: 10px; border-left: 4px solid transparent;
}
.premio-item.gold   { background: #fffbeb; border-color: #f59e0b; }
.premio-item.silver { background: #f8fafc; border-color: #94a3b8; }
.premio-item.bronze { background: #fff7f0; border-color: #cd7f32; }
.premio-medal { font-size: 22px; }
.premio-pos   { font-weight: 700; font-size: 14px; min-width: 70px; color: #1e293b; }
.premio-pct   { font-size: 14px; color: #475569; }

.exemplos { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.exemplo {
  background: #f8faff; border: 1px solid #dbeafe;
  border-radius: 8px; padding: 10px 14px;
}
.exemplo-titulo {
  font-size: 12px; font-weight: 700; color: #1d4ed8;
  text-transform: uppercase; letter-spacing: .5px; margin-bottom: 5px;
}
.exemplo p { margin: 0; font-size: 13px; color: #475569; }
</style>
