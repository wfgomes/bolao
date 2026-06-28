<template>
  <div>
    <h1 class="page-title">🏆 Classificação</h1>

    <div v-if="loading" class="card" style="text-align:center;color:#64748b;padding:30px">
      Carregando...
    </div>

    <div v-else class="card" style="padding:12px">
      <div v-if="standings.length === 0" style="text-align:center;color:#64748b;padding:20px">
        Nenhuma pontuação ainda.
      </div>

      <div
        v-for="(p, i) in standings"
        :key="p.id"
        class="rank-row"
        :class="{ gold: i===0, silver: i===1, bronze: i===2 }"
      >
        <span class="rank-pos">{{ i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1 }}</span>

        <div class="rank-info">
          <router-link :to="`/participante/${p.id}`" class="rank-name">{{ p.name }}</router-link>
          <div class="rank-meta">
            <span class="rank-stat">🎯 {{ p.exact_scores }}</span>
            <span class="rank-stat">✅ {{ p.correct_outcomes }}</span>
            <span class="rank-stat">❌ {{ p.wrong }}</span>
            <span v-if="p.artilheiro_name" class="rank-art">
              ⚽ {{ p.artilheiro_name }} ({{ p.artilheiro_effective_goals }})
            </span>
          </div>
        </div>

        <span class="rank-pts">
          {{ p.points }}<small>pts</small>
        </span>
      </div>
    </div>

    <div v-if="lockedPhases.length > 0" class="card">
      <h2 class="section-title">Ver palpites por fase</h2>
      <div class="phase-btns">
        <router-link
          v-for="phase in lockedPhases"
          :key="phase.id"
          :to="`/ver-palpites/${phase.id}`"
          class="btn btn-ghost btn-sm"
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
  gap: 10px;
  padding: 12px 10px;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: background .15s;
}
.rank-row:hover { background: #f8fafc; }
.gold   { border-left: 4px solid #f59e0b; background: #fffbeb; }
.silver { border-left: 4px solid #94a3b8; background: #f8fafc; }
.bronze { border-left: 4px solid #b45309; background: #fffbeb; }

.rank-pos { font-size: 24px; min-width: 36px; text-align: center; flex-shrink: 0; }

.rank-info { flex: 1; min-width: 0; }
.rank-name {
  font-weight: 700; font-size: 15px; color: #0f172a;
  display: block; margin-bottom: 3px;
  text-decoration: none;
}
.rank-name:hover { color: #1d4ed8; text-decoration: underline; }
.rank-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.rank-stat { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 1px 7px; border-radius: 8px; }
.rank-art  { font-size: 12px; color: #16a34a; background: #f0fdf4; padding: 1px 7px; border-radius: 8px; }

.rank-pts {
  font-size: 22px;
  font-weight: 800;
  color: #1d4ed8;
  white-space: nowrap;
  flex-shrink: 0;
}
.rank-pts small {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: 1px;
}

.phase-btns { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
