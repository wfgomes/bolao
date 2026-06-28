<template>
  <div>
    <h1 class="page-title">📋 Palpites Faltando</h1>

    <div class="card">
      <div v-if="loading" style="color:#888;text-align:center;padding:20px">Carregando...</div>
      <div v-else-if="phases.length === 0" style="color:#888;text-align:center;padding:20px">
        Nenhum jogo cadastrado ainda.
      </div>
      <div v-else class="table-wrap">
        <table class="miss-table">
          <thead>
            <tr>
              <th class="col-user">Usuário</th>
              <th v-for="ph in phases" :key="ph.phase_id" class="col-phase">
                {{ ph.phase_display }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.user_id">
              <td class="col-user">{{ u.user_name }}</td>
              <td
                v-for="ph in phases"
                :key="ph.phase_id"
                class="col-phase cell"
                :class="cellClass(u.user_id, ph.phase_id)"
              >
                {{ cellLabel(u.user_id, ph.phase_id) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api'

const rows    = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/missing-predictions')
    rows.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

const phases = computed(() => {
  const seen = new Set()
  return rows.value
    .filter(r => { if (seen.has(r.phase_id)) return false; seen.add(r.phase_id); return true })
    .map(r => ({ phase_id: r.phase_id, phase_display: r.phase_display }))
})

const users = computed(() => {
  const seen = new Set()
  return rows.value
    .filter(r => { if (seen.has(r.user_id)) return false; seen.add(r.user_id); return true })
    .map(r => ({ user_id: r.user_id, user_name: r.user_name }))
})

function getRow(userId, phaseId) {
  return rows.value.find(r => r.user_id === userId && r.phase_id === phaseId)
}

function cellLabel(userId, phaseId) {
  const r = getRow(userId, phaseId)
  if (!r) return '—'
  if (r.missing === 0) return '✓'
  return `${r.missing}/${r.total_games}`
}

function cellClass(userId, phaseId) {
  const r = getRow(userId, phaseId)
  if (!r || r.missing === 0) return 'ok'
  if (r.missing === r.total_games) return 'all-missing'
  return 'partial'
}

function totalMissing(userId) {
  return rows.value
    .filter(r => r.user_id === userId)
    .reduce((s, r) => s + r.missing, 0)
}

function totalClass(userId) {
  const t = totalMissing(userId)
  if (t === 0) return 'ok'
  if (t >= 5) return 'all-missing'
  return 'partial'
}
</script>

<style scoped>
.table-wrap { overflow-x: auto; }

.miss-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}

.miss-table th {
  background: #f1f5f9;
  padding: 8px 12px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.col-user { text-align: left !important; min-width: 130px; }
.col-phase { min-width: 90px; }
.col-total { min-width: 80px; font-weight: bold; }

.miss-table td {
  padding: 7px 12px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
}
.miss-table tr:last-child td { border-bottom: none; }
.miss-table td.col-user { text-align: left; font-weight: 600; color: #1e293b; }

.cell.ok         { color: #16a34a; font-weight: 700; }
.cell.partial    { color: #d97706; font-weight: 700; }
.cell.all-missing { color: #dc2626; font-weight: 700; }

.total-cell.ok          { color: #16a34a; }
.total-cell.partial     { color: #d97706; }
.total-cell.all-missing { color: #dc2626; }
</style>
