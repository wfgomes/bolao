<template>
  <div>
    <router-link to="/" class="back-link">← Voltar</router-link>
    <h1 class="page-title">Palpites — {{ phaseName }}</h1>

    <div v-if="loading" class="card" style="text-align:center;color:#888;padding:30px">Carregando...</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else>
      <div v-if="groups.length === 0" class="card" style="text-align:center;color:#888;padding:20px">
        Nenhum palpite registrado nesta fase.
      </div>
      <div v-for="g in groups" :key="g.user_id" class="card">
        <h2 class="section-title">{{ g.user_name }}</h2>
        <div v-for="p in g.predictions" :key="p.id" class="pred-row">
          <span class="pred-team home">{{ p.home_team }}</span>
          <span class="pred-score">{{ p.home_score }} x {{ p.away_score }}</span>
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
    groups.value    = pRes.data
    const ph        = phRes.data.find(p => p.id == route.params.phaseId)
    phaseName.value = ph?.display_name || ''
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao carregar palpites'
  } finally {
    loading.value = false
  }
})

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
.back-link {
  display: inline-block; margin-bottom: 16px;
  color: #0d6efd; text-decoration: none; font-weight: bold;
}
.pred-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid #f0f0f0;
}
.pred-row:last-child { border-bottom: none; }
.pred-team { font-weight: bold; font-size: 14px; flex: 1; }
.pred-team.home { text-align: right; }
.pred-score {
  font-size: 18px; font-weight: bold; color: #0d6efd;
  min-width: 80px; text-align: center;
}
</style>
