<template>
  <div>
    <h1 class="page-title">🏁 Resultados</h1>

    <div v-if="loading" class="card" style="text-align:center;color:#64748b;padding:30px">Carregando...</div>

    <template v-else>
      <div v-for="phaseGroup in grouped" :key="phaseGroup.phase" class="card">
        <h2 class="section-title">{{ phaseGroup.phase }}</h2>

        <div v-for="g in phaseGroup.games" :key="g.id" class="result-card">
          <!-- Header: times + status -->
          <div class="result-header">
            <div class="result-teams-row">
              <span class="r-team">{{ g.home_team }}</span>
              <div class="r-inputs">
                <input type="number" min="0" max="99" v-model.number="scores[g.id].home" class="r-score-input" placeholder="0" />
                <span class="r-sep">×</span>
                <input type="number" min="0" max="99" v-model.number="scores[g.id].away" class="r-score-input" placeholder="0" />
              </div>
              <span class="r-team away">{{ g.away_team }}</span>
            </div>
            <div class="result-badges">
              <span v-if="g.status === 'EA' || g.status === 'IN'" class="badge-live">🔴 Ao vivo</span>
              <span v-else-if="g.status === 'FZ'" class="badge badge-open">✅ Finalizado</span>
              <span v-else class="badge badge-inactive">⏳ Pendente</span>
              <span v-if="g.game_datetime" class="game-date">{{ fmtDate(g.game_datetime) }}</span>
            </div>
          </div>

          <!-- Mensagem de status -->
          <div v-if="statusMsg[g.id]" class="alert" :class="statusMsg[g.id].cls" style="margin-bottom:8px">
            {{ statusMsg[g.id].msg }}
          </div>

          <!-- Botões de ação -->
          <div class="result-actions">
            <button
              @click="saveEA(g)"
              class="btn btn-warning btn-sm"
              :disabled="busy[g.id]"
            >
              {{ g.status === 'EA' || g.status === 'IN' ? '🔄 Atualizar' : '▶ Em Andamento' }}
            </button>

            <button
              v-if="g.status === 'EA' || g.status === 'IN'"
              @click="finalizar(g)"
              class="btn btn-success btn-sm"
              :disabled="busy[g.id]"
            >
              ✅ Finalizar Jogo
            </button>

            <button
              v-if="g.status === 'EA' || g.status === 'IN' || g.status === 'FZ'"
              @click="cancelar(g)"
              class="btn btn-danger btn-sm"
              :disabled="busy[g.id]"
            >
              ✕ Cancelar Resultado
            </button>
          </div>
        </div>
      </div>

      <p v-if="games.length === 0" class="card" style="text-align:center;color:#64748b;padding:20px">
        Nenhum jogo cadastrado.
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../api'

const games     = ref([])
const loading   = ref(true)
const busy      = reactive({})
const statusMsg = reactive({})
const scores    = reactive({})

const grouped = computed(() => {
  const map = {}
  games.value.forEach(g => {
    if (!map[g.phase_display]) map[g.phase_display] = []
    map[g.phase_display].push(g)
  })
  return Object.entries(map).map(([phase, games]) => ({ phase, games }))
})

onMounted(load)

async function load() {
  loading.value = true
  try {
    games.value = (await api.get('/admin/games')).data
    games.value.forEach(g => {
      scores[g.id] = { home: g.home_score ?? '', away: g.away_score ?? '' }
    })
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function saveEA(g) {
  const h = scores[g.id].home, a = scores[g.id].away
  if (h === '' || a === '') { setMsg(g.id, 'alert-error', 'Preencha o placar'); return }
  await exec(g.id, () => api.put(`/admin/games/${g.id}/result`, { home_score: h, away_score: a }),
    '🔴 Em andamento! Pontos recalculados.')
}

async function finalizar(g) {
  if (!confirm(`Finalizar ${g.home_team} ${scores[g.id].home} × ${scores[g.id].away} ${g.away_team}?`)) return
  await exec(g.id, () => api.put(`/admin/games/${g.id}/finalizar`), '✅ Jogo finalizado!')
}

async function cancelar(g) {
  if (!confirm(`Cancelar o resultado de ${g.home_team} × ${g.away_team}? Os pontos serão removidos.`)) return
  await exec(g.id, () => api.delete(`/admin/games/${g.id}/result`), '↩ Resultado cancelado.')
}

async function exec(id, fn, successMsg) {
  busy[id] = true
  statusMsg[id] = null
  try {
    await fn()
    setMsg(id, 'alert-success', successMsg)
    await load()
  } catch (e) {
    setMsg(id, 'alert-error', e.response?.data?.error || 'Erro')
  } finally {
    busy[id] = false
  }
}

function setMsg(id, cls, msg) { statusMsg[id] = { cls, msg } }

function fmtDate(dt) {
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.result-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: #fafafa;
}
.result-header { margin-bottom: 8px; }

.result-teams-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.r-team { font-weight: 700; font-size: 14px; flex: 1; text-align: right; }
.r-team.away { text-align: left; }
.r-inputs { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.r-score-input {
  width: 50px; height: 46px;
  border: 2px solid #16a34a; border-radius: 10px;
  font-size: 20px; font-weight: 700;
  text-align: center; color: #15803d; outline: none; background: #f0fdf4;
}
.r-score-input:focus { background: white; box-shadow: 0 0 0 3px rgba(22,163,74,.15); }
.r-sep { font-size: 16px; font-weight: 700; color: #94a3b8; }

.result-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.badge-live {
  background: #dc2626; color: white;
  font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  animation: pulse 1.2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
.badge-inactive { background: #f1f5f9; color: #94a3b8; }
.game-date { font-size: 11px; color: #94a3b8; }

.result-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
