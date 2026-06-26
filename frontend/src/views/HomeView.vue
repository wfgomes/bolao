<template>
  <div>
    <h1 class="page-title">🏆 Classificação</h1>

    <div v-if="loading" class="card" style="text-align:center;color:#888;padding:30px">
      Carregando...
    </div>

    <div v-else class="card">
      <div v-if="standings.length === 0" style="text-align:center;color:#888;padding:20px">
        Nenhuma pontuação registrada ainda.
      </div>
      <div
        v-for="(p, i) in standings"
        :key="p.id"
        class="rank-row"
        :class="{ gold: i === 0, silver: i === 1, bronze: i === 2 }"
      >
        <span class="rank-pos">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 }}</span>
        <span class="rank-name">{{ p.name }}</span>
        <div class="rank-right">
          <span class="rank-pts">{{ p.points }} <small>pts</small></span>
          <span class="rank-detail">🎯 {{ p.exact_scores }} &nbsp;✅ {{ p.correct_outcomes }} &nbsp;❌ {{ p.wrong }}</span>
          <span v-if="p.artilheiro_name" class="rank-art">
            ⚽ {{ p.artilheiro_name }} — {{ p.artilheiro_goals }} gol{{ p.artilheiro_goals !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="lockedPhases.length > 0" class="card">
      <h2 class="section-title">Ver palpites por fase</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <router-link
          v-for="phase in lockedPhases"
          :key="phase.id"
          :to="`/ver-palpites/${phase.id}`"
          class="btn btn-primary btn-sm"
        >
          {{ phase.display_name }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'

const standings = ref([])
const phases    = ref([])
const loading   = ref(true)

const lockedPhases = computed(() => phases.value.filter(p => p.is_locked))

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([api.get('/standings'), api.get('/games/phases')])
    standings.value = s.data
    phases.value    = p.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  margin-bottom: 8px;
}
.gold   { border-left: 4px solid #FFD700; }
.silver { border-left: 4px solid #A8A8A8; }
.bronze { border-left: 4px solid #CD7F32; }
.rank-pos  { font-size: 22px; min-width: 36px; text-align: center; }
.rank-name { flex: 1; font-weight: bold; font-size: 15px; }
.rank-right { text-align: right; }
.rank-pts  { font-size: 18px; font-weight: bold; color: #198754; display: block; }
.rank-pts small { font-size: 11px; color: #888; font-weight: normal; }
.rank-detail { font-size: 12px; color: #888; }
.rank-art    { font-size: 11px; color: #198754; display: block; }
</style>
