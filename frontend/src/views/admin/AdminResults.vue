<template>
  <div>
    <h1 class="page-title">🏁 Resultados</h1>

    <div v-if="loading" class="card" style="text-align:center;color:#888;padding:30px">Carregando...</div>

    <template v-else>
      <div v-for="phaseGroup in grouped" :key="phaseGroup.phase" class="card">
        <h2 class="section-title">{{ phaseGroup.phase }}</h2>
        <div v-for="g in phaseGroup.games" :key="g.id" class="result-row">
          <div class="result-teams">
            <span class="team">{{ g.home_team }}</span>
            <div class="result-scores">
              <input
                type="number" min="0" max="99"
                v-model.number="results[g.id].home"
                class="score-input"
                :class="{ finished: g.is_finished }"
                placeholder="0"
              />
              <span class="vs">x</span>
              <input
                type="number" min="0" max="99"
                v-model.number="results[g.id].away"
                class="score-input"
                :class="{ finished: g.is_finished }"
                placeholder="0"
              />
            </div>
            <span class="team away">{{ g.away_team }}</span>
          </div>

          <div class="result-meta">
            <span v-if="g.game_datetime" class="game-date">{{ fmtDate(g.game_datetime) }}</span>
            <span v-if="g.is_finished" class="badge badge-locked">Finalizado</span>
            <button
              @click="saveResult(g)"
              class="btn btn-success btn-sm"
              :disabled="saving[g.id]"
            >
              {{ saving[g.id] ? '...' : g.is_finished ? 'Atualizar' : 'Salvar resultado' }}
            </button>
          </div>

          <div v-if="status[g.id]" class="alert" :class="status[g.id].cls" style="margin-top:6px;margin-bottom:0">
            {{ status[g.id].msg }}
          </div>
        </div>
      </div>
      <p v-if="games.length === 0" class="card" style="text-align:center;color:#888;padding:20px">
        Nenhum jogo cadastrado.
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../api'

const games   = ref([])
const loading = ref(true)
const saving  = reactive({})
const status  = reactive({})
const results = reactive({})

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
      results[g.id] = {
        home: g.home_score ?? '',
        away: g.away_score ?? '',
      }
    })
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function saveResult(g) {
  const h = results[g.id].home
  const a = results[g.id].away
  if (h === '' || a === '') {
    status[g.id] = { cls: 'alert-error', msg: 'Preencha o placar completo' }
    return
  }
  saving[g.id] = true
  status[g.id] = null
  try {
    await api.put(`/admin/games/${g.id}/result`, { home_score: h, away_score: a })
    status[g.id] = { cls: 'alert-success', msg: 'Resultado salvo! Pontos recalculados.' }
    await load()
  } catch (e) {
    status[g.id] = { cls: 'alert-error', msg: e.response?.data?.error || 'Erro' }
  } finally {
    saving[g.id] = false
  }
}

function fmtDate(dt) {
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.result-row {
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 10px;
  background: #fafafa;
}
.result-teams {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.team { font-weight: bold; font-size: 14px; flex: 1; text-align: right; }
.away { text-align: left; }
.result-scores { display: flex; align-items: center; gap: 6px; }
.score-input {
  width: 52px; padding: 6px 4px; border: 2px solid #198754;
  border-radius: 8px; font-size: 20px; font-weight: bold;
  text-align: center; color: #198754; outline: none;
}
.score-input.finished { border-color: #aaa; color: #555; }
.vs { font-weight: bold; color: #888; }
.result-meta { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.game-date { font-size: 12px; color: #888; flex: 1; }
</style>
