<template>
  <div>
    <h1 class="page-title">⚽ Jogos</h1>

    <div class="card">
      <h2 class="section-title">{{ editing ? 'Editar Jogo' : 'Novo Jogo' }}</h2>
      <div v-if="formError" class="alert alert-error">{{ formError }}</div>

      <form @submit.prevent="submit" style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
        <div class="form-group">
          <label>Fase</label>
          <select v-model.number="form.phase_id" class="form-control" required>
            <option value="" disabled>Selecione a fase</option>
            <option v-for="ph in phases" :key="ph.id" :value="ph.id">{{ ph.display_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Data e hora</label>
          <input v-model="form.game_datetime" type="datetime-local" class="form-control" />
        </div>
        <div class="form-group">
          <label>Time da casa</label>
          <input v-model="form.home_team" class="form-control" placeholder="Brasil" required />
        </div>
        <div class="form-group">
          <label>Time visitante</label>
          <input v-model="form.away_team" class="form-control" placeholder="Argentina" required />
        </div>
        <div style="grid-column:1/-1;display:flex;gap:8px">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar jogo' }}
          </button>
          <button v-if="editing" type="button" @click="cancelEdit" class="btn btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2 class="section-title">Jogos cadastrados</h2>
      <div v-if="loading" style="color:#888">Carregando...</div>
      <template v-else>
        <div v-for="phaseGroup in grouped" :key="phaseGroup.phase" style="margin-bottom:20px">
          <div class="phase-label">{{ phaseGroup.phase }}</div>
          <table class="table">
            <thead>
              <tr>
                <th>Casa</th>
                <th>Visitante</th>
                <th>Data/hora</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in phaseGroup.games" :key="g.id">
                <td><strong>{{ g.home_team }}</strong></td>
                <td><strong>{{ g.away_team }}</strong></td>
                <td>{{ g.game_datetime ? fmtDate(g.game_datetime) : '—' }}</td>
                <td>
                  <div class="table-actions">
                    <button @click="startEdit(g)" class="btn btn-warning btn-sm">Editar</button>
                    <button @click="remove(g)" class="btn btn-danger btn-sm">Excluir</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="games.length === 0" style="color:#888;text-align:center;padding:20px">Nenhum jogo cadastrado.</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../api'

const games     = ref([])
const phases    = ref([])
const loading   = ref(true)
const saving    = ref(false)
const formError = ref('')
const editing   = ref(null)

const form = reactive({ phase_id: '', home_team: '', away_team: '', game_datetime: '' })

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
    const [g, p] = await Promise.all([api.get('/admin/games'), api.get('/admin/phases')])
    games.value  = g.data
    phases.value = p.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function submit() {
  formError.value = ''
  saving.value = true
  try {
    const payload = {
      ...form,
      game_datetime: form.game_datetime ? new Date(form.game_datetime).toISOString() : null,
    }
    if (editing.value) await api.put(`/admin/games/${editing.value}`, payload)
    else await api.post('/admin/games', payload)
    cancelEdit()
    await load()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Erro'
  } finally {
    saving.value = false
  }
}

function startEdit(g) {
  editing.value        = g.id
  form.phase_id        = g.phase_id
  form.home_team       = g.home_team
  form.away_team       = g.away_team
  form.game_datetime   = g.game_datetime ? toLocalInput(g.game_datetime) : ''
}

function cancelEdit() {
  editing.value = null
  form.phase_id = ''; form.home_team = ''; form.away_team = ''; form.game_datetime = ''
}

async function remove(g) {
  if (!confirm(`Excluir jogo ${g.home_team} x ${g.away_team}?`)) return
  try { await api.delete(`/admin/games/${g.id}`); await load() }
  catch (e) { alert(e.response?.data?.error || 'Erro') }
}

function fmtDate(dt) {
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function toLocalInput(dt) {
  const d = new Date(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.phase-label {
  font-weight: bold; font-size: 14px; color: #0d6efd;
  background: #e8f0fe; padding: 6px 12px; border-radius: 6px; margin-bottom: 8px;
}
</style>
