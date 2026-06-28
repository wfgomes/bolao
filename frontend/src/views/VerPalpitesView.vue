<template>
  <div>
    <router-link to="/" class="back-btn">← Voltar</router-link>
    <h1 class="page-title">{{ phaseName }}</h1>

    <div v-if="loading" class="card" style="text-align:center;color:#64748b;padding:30px">Carregando...</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else>
      <div v-if="groups.length === 0" class="card" style="text-align:center;color:#64748b;padding:20px">
        Nenhum palpite registrado nesta fase.
      </div>

      <div v-for="g in groups" :key="g.user_id" class="card">
        <h2 class="user-title">{{ g.user_name }}</h2>
        <div v-for="p in g.predictions" :key="p.id" class="pred-row">
          <span class="pred-team">{{ p.home_team }}</span>
          <span class="pred-score">{{ p.home_score }} × {{ p.away_score }}</span>
          <span class="pred-team away">{{ p.away_team }}</span>
          <span v-if="p.is_finished" class="badge" :class="ptsClass(p.points)">
            {{ ptsLabel(p.points) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route     = useRoute()
const groups    = ref([])
const phaseName = ref('')
const loading   = ref(true)
const error     = ref('')

onMounted(async () => {
  try {
    const [pRes, phRes] = await Promise.all([
      api.get(`/predictions/phase/${route.params.phaseId}`),
      api.get('/games/phases'),
    ])
    groups.value    = pRes.data.sort((a, b) => a.user_name.localeCompare(b.user_name, 'pt'))
    const ph        = phRes.data.find(p => p.id == route.params.phaseId)
    phaseName.value = ph?.display_name || 'Palpites'
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao carregar palpites'
  } finally {
    loading.value = false
  }
})

function ptsClass(pts) {
  if (pts === 3) return 'badge-exact'
  if (pts === 1) return 'badge-partial'
  return 'badge-wrong'
}
function ptsLabel(pts) {
  if (pts === 3) return '🎯 +3'
  if (pts === 1) return '✅ +1'
  return '❌ 0'
}
</script>

<style scoped>
.back-btn {
  display: inline-block;
  margin-bottom: 14px;
  color: #1d4ed8;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
.user-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}
.pred-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.pred-row:last-child { border-bottom: none; }
.pred-team { font-weight: 600; font-size: 13px; flex: 1; text-align: right; }
.pred-team.away { text-align: left; }
.pred-score {
  font-size: 17px;
  font-weight: 700;
  color: #1d4ed8;
  min-width: 72px;
  text-align: center;
  flex-shrink: 0;
}
</style>
