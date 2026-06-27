<template>
  <div>
    <h1 class="page-title">⚽ Acertos por Partida</h1>

    <div v-if="loading" class="card" style="text-align:center;color:#64748b;padding:30px">
      Carregando...
    </div>

    <div v-else-if="phases.length === 0" class="card" style="text-align:center;color:#64748b;padding:30px">
      Nenhuma partida finalizada ainda.
    </div>

    <template v-else>
      <div v-for="ph in phases" :key="ph.phase">
        <div class="phase-label">{{ ph.phase }}</div>

        <div v-for="g in ph.games" :key="g.id" class="match-card">
          <!-- Placar -->
          <div class="match-score-row" :class="{ live: g.status === 'EA' || g.status === 'IN' }">
            <span class="match-team">{{ g.home_team }}</span>
            <div class="match-score-col">
              <span class="match-score">{{ g.home_score }} × {{ g.away_score }}</span>
              <span v-if="g.status === 'EA' || g.status === 'IN'" class="live-tag">🔴 Ao vivo</span>
            </div>
            <span class="match-team away">{{ g.away_team }}</span>
          </div>

          <!-- Resumo de acertos -->
          <div class="match-stats">
            <span class="stat cravou">🎯 {{ g.cravou.length }}</span>
            <span class="stat resultado">✅ {{ g.resultado.length }}</span>
            <span class="stat errou">❌ {{ g.errou.length }}</span>
            <button
              v-if="g.cravou.length + g.resultado.length + g.errou.length > 0"
              @click="toggle(g.id)"
              class="expand-btn"
            >
              {{ expanded[g.id] ? 'Fechar ▲' : 'Ver detalhes ▼' }}
            </button>
          </div>

          <!-- Detalhes expandidos -->
          <div v-if="expanded[g.id]" class="match-details">
            <div v-if="g.cravou.length" class="detail-group">
              <span class="detail-badge cravou-badge">🎯 Cravou ({{ g.cravou.length }})</span>
              <div class="name-list">
                <span v-for="n in g.cravou" :key="n" class="name-chip cravou-chip">{{ n }}</span>
              </div>
            </div>

            <div v-if="g.resultado.length" class="detail-group">
              <span class="detail-badge resultado-badge">✅ Resultado ({{ g.resultado.length }})</span>
              <div class="name-list">
                <span v-for="n in g.resultado" :key="n" class="name-chip resultado-chip">{{ n }}</span>
              </div>
            </div>

            <div v-if="g.errou.length" class="detail-group">
              <span class="detail-badge errou-badge">❌ Errou ({{ g.errou.length }})</span>
              <div class="name-list">
                <span v-for="n in g.errou" :key="n" class="name-chip errou-chip">{{ n }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api'

const phases   = ref([])
const loading  = ref(true)
const expanded = reactive({})

onMounted(async () => {
  try {
    const { data } = await api.get('/partidas')
    phases.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function toggle(id) {
  expanded[id] = !expanded[id]
}
</script>

<style scoped>
.phase-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #1d4ed8;
  background: #eff6ff;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 8px;
}

.match-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,.07);
  margin-bottom: 10px;
}

.match-score-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.match-team { font-weight: 700; font-size: 14px; flex: 1; text-align: right; }
.match-team.away { text-align: left; }
.match-score-row.live { background: #fff1f2; }
.match-score-col { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
.live-tag {
  font-size: 10px; font-weight: 700; color: #dc2626;
  animation: pulse 1.2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.match-score {
  font-size: 22px;
  font-weight: 800;
  color: #1d4ed8;
  min-width: 80px;
  text-align: center;
  flex-shrink: 0;
}

.match-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  flex-wrap: wrap;
}
.stat {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}
.cravou    { background: #f0fdf4; color: #166534; }
.resultado { background: #fffbeb; color: #92400e; }
.errou     { background: #fef2f2; color: #991b1b; }

.expand-btn {
  margin-left: auto;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
}
.expand-btn:hover { background: #f1f5f9; }

.match-details {
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.detail-group { display: flex; flex-direction: column; gap: 6px; }
.detail-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  align-self: flex-start;
}
.cravou-badge    { background: #f0fdf4; color: #166534; }
.resultado-badge { background: #fffbeb; color: #92400e; }
.errou-badge     { background: #fef2f2; color: #991b1b; }

.name-list { display: flex; flex-wrap: wrap; gap: 5px; }
.name-chip {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 20px;
}
.cravou-chip    { background: #dcfce7; color: #14532d; }
.resultado-chip { background: #fef9c3; color: #713f12; }
.errou-chip     { background: #fee2e2; color: #7f1d1d; }
</style>
