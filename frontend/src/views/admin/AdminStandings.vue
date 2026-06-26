<template>
  <div>
    <h1 class="page-title">🏆 Classificação</h1>

    <div class="card">
      <div v-if="loading" style="color:#888;text-align:center;padding:20px">Carregando...</div>
      <template v-else>
        <div
          v-for="(p, i) in standings"
          :key="p.id"
          class="rank-row"
          :class="{ gold: i===0, silver: i===1, bronze: i===2 }"
        >
          <span class="pos">{{ i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1 }}</span>
          <span class="name">{{ p.name }}</span>
          <span class="pts">{{ p.points }} <small>pts</small></span>
          <span class="detail">🎯{{ p.exact_scores }} ✅{{ p.correct_outcomes }} ❌{{ p.wrong }}</span>
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
          <div v-for="p in g.predictions" :key="p.id" class="pred-row">
            <span class="pred-team">{{ p.home_team }}</span>
            <span class="pred-score">{{ p.home_score }} x {{ p.away_score }}</span>
            <span class="pred-team away">{{ p.away_team }}</span>
            <span v-if="p.is_finished" class="badge" :class="ptsClass(p.points)">{{ ptsLabel(p.points) }}</span>
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
import { ref, onMounted } from 'vue'
import api from '../../api'

const standings    = ref([])
const phases       = ref([])
const loading      = ref(true)
const selectedPhase = ref(null)
const groups       = ref([])
const loadingPreds = ref(false)

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([api.get('/admin/standings'), api.get('/admin/phases')])
    standings.value = s.data
    phases.value    = p.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

async function loadPreds(ph) {
  if (selectedPhase.value?.id === ph.id) { selectedPhase.value = null; return }
  selectedPhase.value = ph
  loadingPreds.value  = true
  try {
    const { data } = await api.get(`/admin/predictions?phase_id=${ph.id}`)
    // Group by user
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
  if (pts === 10) return 'badge-exact'
  if (pts === 5)  return 'badge-partial'
  if (pts === 0)  return 'badge-wrong'
  return ''
}
function ptsLabel(pts) {
  if (pts === 10) return '🎯 +10'
  if (pts === 5)  return '✅ +5'
  if (pts === 0)  return '❌ 0'
  return ''
}
</script>

<style scoped>
.rank-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border: 1px solid #dee2e6;
  border-radius: 10px; margin-bottom: 8px;
}
.gold   { border-left: 4px solid #FFD700; }
.silver { border-left: 4px solid #A8A8A8; }
.bronze { border-left: 4px solid #CD7F32; }
.pos  { font-size: 20px; min-width: 34px; text-align: center; }
.name { flex: 1; font-weight: bold; }
.pts  { font-size: 17px; font-weight: bold; color: #198754; white-space: nowrap; }
.pts small { font-size: 11px; color: #888; font-weight: normal; }
.detail { font-size: 12px; color: #888; white-space: nowrap; }

.user-label {
  font-weight: bold; font-size: 14px; color: #0d6efd;
  background: #e8f0fe; padding: 5px 12px; border-radius: 6px; margin-bottom: 6px;
}
.pred-row {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 4px; border-bottom: 1px solid #f0f0f0;
}
.pred-row:last-child { border-bottom: none; }
.pred-team { font-weight: bold; font-size: 13px; flex: 1; text-align: right; }
.pred-team.away { text-align: left; }
.pred-score { font-size: 16px; font-weight: bold; color: #0d6efd; min-width: 70px; text-align: center; }
</style>
