<template>
  <div>
    <h1 class="page-title">⚽ Artilheiros</h1>

    <div class="card">
      <h2 class="section-title">{{ editing ? 'Editar Artilheiro' : 'Novo Artilheiro' }}</h2>
      <div v-if="formError" class="alert alert-error">{{ formError }}</div>

      <form @submit.prevent="submit" style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
        <div class="form-group">
          <label>Nome do jogador</label>
          <input v-model="form.name" class="form-control" placeholder="Neymar Jr." required />
        </div>
        <div class="form-group">
          <label>Seleção</label>
          <input v-model="form.team" class="form-control" placeholder="Brasil" />
        </div>
        <div class="form-group">
          <label>Gols marcados (total API)</label>
          <input v-model.number="form.goals" type="number" min="0" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Base (gols antes do bolão)</label>
          <input v-model.number="form.goals_offset" type="number" min="0" class="form-control" required />
        </div>
        <div style="display:flex;align-items:center;gap:8px;grid-column:1/-1">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar' }}
          </button>
          <button v-if="editing" type="button" @click="cancelEdit" class="btn btn-secondary">Cancelar</button>
          <span v-if="form.goals_offset > 0 || form.goals > 0" style="font-size:13px;color:#64748b">
            Gols no bolão: <strong>{{ Math.max(form.goals - form.goals_offset, 0) }}</strong>
          </span>
        </div>
      </form>
    </div>

    <div class="card">
      <h2 class="section-title">Artilheiros cadastrados</h2>
      <div v-if="loading" style="color:#888">Carregando...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Jogador</th>
            <th>Seleção</th>
            <th title="Gols totais na API">API</th>
            <th title="Gols antes do bolão (não contam)">Base</th>
            <th title="Gols que contam para o bolão">Bolão</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in artilheiros" :key="a.id">
            <td><strong>{{ a.name }}</strong></td>
            <td>{{ a.team || '—' }}</td>
            <td style="color:#64748b">{{ a.goals }}</td>
            <td style="color:#64748b">{{ a.goals_offset }}</td>
            <td>
              <span class="gols-badge">⚽ {{ a.effective_goals }}</span>
            </td>
            <td>
              <div class="table-actions">
                <button @click="startEdit(a)" class="btn btn-warning btn-sm">Editar</button>
                <button @click="remove(a)" class="btn btn-danger btn-sm">Excluir</button>
              </div>
            </td>
          </tr>
          <tr v-if="artilheiros.length === 0">
            <td colspan="6" style="text-align:center;color:#888;padding:20px">Nenhum artilheiro cadastrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="artilheiros.length > 0" class="card">
      <h2 class="section-title">Quem escolheu cada artilheiro</h2>
      <div v-if="loadingChoices" style="color:#888">Carregando...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Artilheiro</th>
            <th>Participantes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in choiceGroups" :key="group.artilheiro">
            <td><strong>{{ group.artilheiro }}</strong></td>
            <td>{{ group.users.join(', ') || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../api'

const artilheiros    = ref([])
const choices        = ref([])
const loading        = ref(true)
const loadingChoices = ref(true)
const saving         = ref(false)
const formError      = ref('')
const editing        = ref(null)

const form = reactive({ name: '', team: '', goals: 0, goals_offset: 0 })

const choiceGroups = computed(() => {
  const map = {}
  artilheiros.value.forEach(a => { map[a.name] = [] })
  choices.value.forEach(c => {
    if (c.artilheiro_name && map[c.artilheiro_name] !== undefined) {
      map[c.artilheiro_name].push(c.user_name)
    }
  })
  return Object.entries(map).map(([artilheiro, users]) => ({ artilheiro, users }))
})

onMounted(load)

async function load() {
  loading.value = true
  loadingChoices.value = true
  try {
    const [artRes, choiceRes] = await Promise.all([
      api.get('/admin/artilheiros'),
      api.get('/admin/artilheiro-choices'),
    ])
    artilheiros.value = artRes.data
    choices.value     = choiceRes.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    loadingChoices.value = false
  }
}

async function submit() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) await api.put(`/admin/artilheiros/${editing.value}`, form)
    else await api.post('/admin/artilheiros', form)
    cancelEdit()
    await load()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

function startEdit(a) {
  editing.value       = a.id
  form.name           = a.name
  form.team           = a.team || ''
  form.goals          = a.goals
  form.goals_offset   = a.goals_offset
}

function cancelEdit() {
  editing.value = null
  form.name = ''; form.team = ''; form.goals = 0; form.goals_offset = 0
}

async function remove(a) {
  if (!confirm(`Excluir ${a.name}?`)) return
  try { await api.delete(`/admin/artilheiros/${a.id}`); await load() }
  catch (e) { alert(e.response?.data?.error || 'Erro') }
}
</script>

<style scoped>
.gols-badge {
  background: #d4edda; color: #155724;
  padding: 3px 10px; border-radius: 10px;
  font-weight: bold; font-size: 13px;
}
</style>
