<template>
  <div>
    <h1 class="page-title">🏆 Classificação</h1>

    <div class="card">
      <div v-if="loading" style="color:#888;text-align:center;padding:20px">Carregando...</div>
      <template v-else>
        <div v-for="(p, i) in standings" :key="p.id">
          <!-- Linha do usuário (clicável) -->
          <div
            class="rank-row"
            :class="{ gold: i===0, silver: i===1, bronze: i===2, expanded: expandedId === p.id }"
            @click="toggleUser(p)"
          >
            <span class="pos">{{ i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1 }}</span>
            <span class="name">{{ p.name }}</span>
            <span class="pts">{{ p.points }} <small>pts</small></span>
            <span class="detail">🎯{{ p.exact_scores }} ✅{{ p.correct_outcomes }} ❌{{ p.wrong }}</span>
            <span v-if="p.artilheiro_name" class="detail art-detail">⚽ {{ p.artilheiro_name }} ({{ p.artilheiro_effective_goals }})</span>
            <span class="expand-icon">{{ expandedId === p.id ? '▲' : '▼' }}</span>
          </div>

          <!-- Palpites expandidos -->
          <div v-if="expandedId === p.id" class="user-preds-panel">
            <div v-if="loadingUser" style="color:#888;padding:10px 14px">Carregando palpites...</div>
            <template v-else-if="userPreds[p.id]">
              <div v-for="group in userPreds[p.id]" :key="group.phase" class="phase-group">
                <div class="phase-label">{{ group.phase }}</div>
                <div v-for="pred in group.preds" :key="pred.id" class="pred-row">
                  <span class="pred-team">{{ pred.home_team }}</span>
                  <span class="pred-score">{{ pred.home_score }} × {{ pred.away_score }}</span>
                  <span class="pred-team away">{{ pred.away_team }}</span>
                  <template v-if="pred.is_finished">
                    <span class="actual-score">
                      ({{ pred.game_home }} × {{ pred.game_away }})
                    </span>
                    <span class="badge" :class="ptsClass(pred.points)">{{ ptsLabel(pred.points) }}</span>
                  </template>
                  <span v-else-if="pred.game_home !== null" class="live-score">
                    🔴 {{ pred.game_home }} × {{ pred.game_away }}
                  </span>
                </div>
              </div>
              <p v-if="userPreds[p.id].length === 0" style="color:#888;padding:10px 14px">
                Nenhum palpite cadastrado.
              </p>
            </template>
          </div>
        </div>

        <p v-if="standings.length === 0" style="color:#888;text-align:center;padding:20px">
          Nenhuma pontuação ainda.
        </p>
      </template>
    </div>

    <div class="card">
      <h2 class="section-title">Ver palpites por fase</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button
          v-for="ph in phases"
          :key="ph.id"
          @click="loadPreds(ph)"
          class="btn btn-sm"
          :class="selectedPhase?.id === ph.id ? 'btn-primary' : 'btn-secondary'"
        >
          {{ ph.display_name }}
        </button>
      </div>
    </div>

    <div v-if="selectedPhase" class="card">
      <h2 class="section-title">Palpites — {{ selectedPhase.display_name }}</h2>
      <div v-if="loadingPreds" style="color:#888">Carregando...</div>
      <div v-else>
        <div v-for="g in groups" :key="g.user_id" style="margin-bottom:20px">
          <div class="user-label">{{ g.user_name }}</div>
          <div v-for="pred in g.predictions" :key="pred.id" class="pred-row">
            <span class="pred-team">{{ pred.home_team }}</span>
            <span class="pred-score">{{ pred.home_score }} × {{ pred.away_score }}</span>
            <span class="pred-team away">{{ pred.away_team }}</span>
            <span v-if="pred.is_finished" class="badge" :class="ptsClass(pred.points)">{{ ptsLabel(pred.points) }}</span>
          </div>
        </div>
        <p v-if="groups.length === 0" style="color:#888;text-align:center;padding:10px">
          Nenhum palpite nesta fase.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api'

const standings     = ref([])
const phases        = ref([])
const loading       = ref(true)
const selectedPhase = ref(null)
const groups        = ref([])
const loadingPreds  = ref(false)

const expandedId  = ref(null)
const loadingUser = ref(false)
const userPreds   = reactive({})

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([api.get('/admin/standings'), api.get('/admin/phases')])
    standings.value = s.data
    phases.value    = p.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

async function toggleUser(p) {
  if (expandedId.value === p.id) {
    expandedId.value = null
    return
  }
  expandedId.value = p.id
  if (userPreds[p.id]) return // já carregado

  loadingUser.value = true
  try {
    const { data } = await api.get(`/admin/predictions?user_id=${p.id}`)
    // Agrupa por fase
    const phaseMap = {}
    data.forEach(pred => {
      const ph = pred.phase_display
      if (!phaseMap[ph]) phaseMap[ph] = []
      phaseMap[ph].push(pred)
    })
    userPreds[p.id] = Object.entries(phaseMap).map(([phase, preds]) => ({ phase, preds }))
  } catch (e) { console.error(e) }
  finally { loadingUser.value = false }
}

async function loadPreds(ph) {
  if (selectedPhase.value?.id === ph.id) { selectedPhase.value = null; return }
  selectedPhase.value = ph
  loadingPreds.value  = true
  try {
    const { data } = await api.get(`/admin/predictions?phase_id=${ph.id}`)
    const map = {}
    data.forEach(r => {
      if (!map[r.user_id]) map[r.user_id] = { user_id: r.user_id, user_name: r.user_name, predictions: [] }
      map[r.user_id].predictions.push(r)
    })
    groups.value = Object.values(map)
  } catch (e) { console.error(e) }
  finally { loadingPreds.value = false }
}

function ptsClass(pts) {
  if (pts === 3) return 'badge-exact'
  if (pts === 1) return 'badge-partial'
  if (pts === 0) return 'badge-wrong'
  return ''
}
function ptsLabel(pts) {
  if (pts === 3) return '🎯 +3'
  if (pts === 1) return '✅ +1'
  if (pts === 0) return '❌ 0'
  return ''
}
</script>

<style scoped>
.rank-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border: 1px solid #dee2e6;
  border-radius: 10px; margin-bottom: 2px;
  cursor: pointer; transition: background .15s;
}
.rank-row:hover  { background: #f8f9fa; }
.rank-row.expanded { background: #eff6ff; border-color: #93c5fd; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.gold   { border-left: 4px solid #FFD700; }
.silver { border-left: 4px solid #A8A8A8; }
.bronze { border-left: 4px solid #CD7F32; }
.pos  { font-size: 20px; min-width: 34px; text-align: center; }
.name { flex: 1; font-weight: bold; }
.pts  { font-size: 17px; font-weight: bold; color: #198754; white-space: nowrap; }
.pts small { font-size: 11px; color: #888; font-weight: normal; }
.detail { font-size: 12px; color: #888; white-space: nowrap; }
.art-detail { color: #16a34a; }
.expand-icon { font-size: 11px; color: #aaa; }

.user-preds-panel {
  border: 1px solid #93c5fd; border-top: none;
  border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;
  background: #f8fbff; padding: 10px 14px; margin-bottom: 8px;
}

.phase-group { margin-bottom: 12px; }
.phase-label {
  font-size: 11px; font-weight: 700; color: #1d4ed8;
  text-transform: uppercase; letter-spacing: .5px;
  margin-bottom: 6px; padding-bottom: 4px;
  border-bottom: 1px solid #dbeafe;
}

.pred-row {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 2px; border-bottom: 1px solid #f0f0f0; font-size: 13px;
}
.pred-row:last-child { border-bottom: none; }
.pred-team { font-weight: bold; flex: 1; text-align: right; }
.pred-team.away { text-align: left; }
.pred-score { font-weight: bold; color: #1d4ed8; min-width: 54px; text-align: center; }
.actual-score { font-size: 12px; color: #64748b; white-space: nowrap; }
.live-score { font-size: 11px; font-weight: 700; color: #dc2626; white-space: nowrap; }

.user-label {
  font-weight: bold; font-size: 14px; color: #0d6efd;
  background: #e8f0fe; padding: 5px 12px; border-radius: 6px; margin-bottom: 6px;
}
</style>
