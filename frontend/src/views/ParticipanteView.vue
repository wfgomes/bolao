<template>
  <div>
    <div class="back-row">
      <router-link to="/" class="back-link">← Classificação</router-link>
    </div>

    <div v-if="loading" class="card" style="text-align:center;color:#64748b;padding:30px">
      Carregando...
    </div>

    <div v-else-if="error" class="card" style="text-align:center;color:#dc2626;padding:30px">
      {{ error }}
    </div>

    <template v-else>
      <!-- Cabeçalho do participante -->
      <div class="card profile-card">
        <div class="profile-name">{{ data.user.name }}</div>
        <div class="profile-stats">
          <div class="stat-chip">
            <span class="stat-val">{{ data.stats.points }}</span>
            <span class="stat-lbl">pontos</span>
          </div>
          <div class="stat-chip">
            <span class="stat-val">🎯{{ data.stats.exact_scores }}</span>
            <span class="stat-lbl">exatos</span>
          </div>
          <div class="stat-chip">
            <span class="stat-val">✅{{ data.stats.correct_outcomes }}</span>
            <span class="stat-lbl">resultado</span>
          </div>
          <div class="stat-chip">
            <span class="stat-val">❌{{ data.stats.wrong }}</span>
            <span class="stat-lbl">errou</span>
          </div>
        </div>

        <!-- Artilheiro -->
        <div v-if="data.artilheiro" class="art-row">
          <span class="art-label">⚽ Artilheiro:</span>
          <span class="art-name">{{ data.artilheiro.artilheiro_name }}</span>
          <span v-if="data.artilheiro.team" class="art-team">{{ data.artilheiro.team }}</span>
          <span class="art-goals">{{ data.artilheiro.goals }} gol{{ data.artilheiro.goals !== 1 ? 's' : '' }} → +{{ data.artilheiro.goals }}pts</span>
        </div>
      </div>

      <div v-if="data.phases.length === 0" class="card" style="text-align:center;color:#64748b;padding:20px">
        Nenhum palpite disponível ainda (fase não travada).
      </div>

      <!-- Palpites por fase -->
      <div v-for="phase in data.phases" :key="phase.phase_id" class="card">
        <div class="phase-header">
          <span class="phase-name">{{ phase.phase_display }}</span>
          <span class="phase-pts">{{ phasePoints(phase) }} pts</span>
        </div>

        <div v-for="pred in phase.predictions" :key="pred.game_id" class="pred-row">
          <div class="pred-teams">
            <span class="pred-team">{{ pred.home_team }}</span>
            <span class="pred-score">{{ pred.home_score }} × {{ pred.away_score }}</span>
            <span class="pred-team away">{{ pred.away_team }}</span>
          </div>

          <div class="pred-result-row">
            <!-- Resultado do jogo -->
            <template v-if="pred.game_status === 'EA'">
              <span class="live-badge">🔴 Ao vivo {{ pred.game_home }} × {{ pred.game_away }}</span>
            </template>
            <template v-else-if="pred.game_status === 'FZ'">
              <span class="result-txt">Resultado: {{ pred.game_home }} × {{ pred.game_away }}</span>
            </template>
            <template v-else>
              <span class="pending-txt">Aguardando</span>
            </template>

            <!-- Badge de pontos -->
            <span v-if="pred.points != null" class="pts-badge" :class="ptsClass(pred.points)">
              {{ ptsLabel(pred.points) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const data    = ref(null)
const loading = ref(true)
const error   = ref(null)

onMounted(async () => {
  try {
    const { data: d } = await api.get(`/participante/${route.params.userId}`)
    data.value = d
  } catch (e) {
    error.value = e.response?.data?.error || 'Participante não encontrado'
  } finally {
    loading.value = false
  }
})

function phasePoints(phase) {
  return phase.predictions.reduce((sum, p) => sum + (p.points || 0), 0)
}

function ptsClass(pts) {
  if (pts === 3) return 'pts-exact'
  if (pts === 1) return 'pts-partial'
  return 'pts-wrong'
}
function ptsLabel(pts) {
  if (pts === 3) return '🎯 +3'
  if (pts === 1) return '✅ +1'
  return '❌ 0'
}
</script>

<style scoped>
.back-row { margin-bottom: 8px; }
.back-link {
  font-size: 13px; font-weight: 600;
  color: #1d4ed8; text-decoration: none;
}
.back-link:hover { text-decoration: underline; }

/* Profile card */
.profile-card { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); color: white; }
.profile-name { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
.profile-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.stat-chip {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(255,255,255,.15); border-radius: 10px; padding: 6px 14px;
  min-width: 56px;
}
.stat-val { font-size: 16px; font-weight: 800; }
.stat-lbl { font-size: 10px; opacity: .75; text-transform: uppercase; letter-spacing: .4px; }

.art-row {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.1); border-radius: 10px; padding: 8px 12px;
  flex-wrap: wrap;
}
.art-label { font-size: 12px; font-weight: 600; opacity: .8; }
.art-name  { font-size: 14px; font-weight: 700; }
.art-team  { font-size: 12px; opacity: .8; }
.art-goals { font-size: 12px; font-weight: 600; background: rgba(255,255,255,.2); border-radius: 20px; padding: 2px 8px; margin-left: auto; }

/* Phase */
.phase-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.phase-name { font-weight: 700; font-size: 16px; color: #0f172a; }
.phase-pts  { font-size: 15px; font-weight: 800; color: #1d4ed8; }

/* Prediction rows */
.pred-row {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.pred-teams { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.pred-team  { font-weight: 700; font-size: 14px; flex: 1; text-align: right; }
.pred-team.away { text-align: left; }
.pred-score {
  font-size: 20px; font-weight: 800; color: #1d4ed8;
  min-width: 80px; text-align: center; flex-shrink: 0;
  background: #eff6ff; border-radius: 8px; padding: 2px 10px;
}

.pred-result-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.result-txt  { font-size: 12px; color: #64748b; }
.pending-txt { font-size: 12px; color: #94a3b8; font-style: italic; }
.live-badge  { font-size: 11px; font-weight: 700; color: #dc2626; animation: pulse 1.2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

.pts-badge {
  font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-left: auto;
}
.pts-exact   { background: #dcfce7; color: #14532d; }
.pts-partial { background: #fef9c3; color: #713f12; }
.pts-wrong   { background: #fee2e2; color: #7f1d1d; }
</style>
