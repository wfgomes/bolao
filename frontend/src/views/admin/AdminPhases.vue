<template>
  <div>
    <h1 class="page-title">📅 Fases</h1>

    <div class="card">
      <h2 class="section-title">{{ editing ? 'Editar Fase' : 'Nova Fase' }}</h2>
      <div v-if="formError" class="alert alert-error">{{ formError }}</div>

      <form @submit.prevent="submit" style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
        <div class="form-group">
          <label>Slug (ex: oitavas)</label>
          <input v-model="form.name" class="form-control" placeholder="oitavas" required />
        </div>
        <div class="form-group">
          <label>Nome de exibição</label>
          <input v-model="form.display_name" class="form-control" placeholder="Oitavas de Final" required />
        </div>
        <div class="form-group">
          <label>Ordem</label>
          <input v-model.number="form.order_num" type="number" min="1" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Data/hora de início (trava automática 30 min antes)</label>
          <input v-model="form.start_time" type="datetime-local" class="form-control" />
        </div>
        <div style="grid-column:1/-1;display:flex;gap:8px">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar fase' }}
          </button>
          <button v-if="editing" type="button" @click="cancelEdit" class="btn btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2 class="section-title">Fases cadastradas</h2>
      <div v-if="loading" style="color:#888">Carregando...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nome</th>
            <th>Início</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ph in phases" :key="ph.id">
            <td>{{ ph.order_num }}</td>
            <td><strong>{{ ph.display_name }}</strong></td>
            <td>{{ ph.start_time ? fmtDate(ph.start_time) : '—' }}</td>
            <td>
              <span class="badge" :class="ph.is_locked_manually ? 'badge-locked' : 'badge-open'">
                {{ ph.is_locked_manually ? '🔒 Travada' : '🟢 Aberta' }}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button @click="toggleLock(ph)" class="btn btn-sm" :class="ph.is_locked_manually ? 'btn-warning' : 'btn-danger'">
                  {{ ph.is_locked_manually ? 'Destravar' : 'Travar' }}
                </button>
                <button @click="startEdit(ph)" class="btn btn-warning btn-sm">Editar</button>
                <button @click="remove(ph)" class="btn btn-danger btn-sm">Excluir</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api'

const phases    = ref([])
const loading   = ref(true)
const saving    = ref(false)
const formError = ref('')
const editing   = ref(null)

const form = reactive({ name: '', display_name: '', order_num: 1, start_time: '' })

onMounted(load)

async function load() {
  loading.value = true
  try { phases.value = (await api.get('/admin/phases')).data }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function submit() {
  formError.value = ''
  saving.value = true
  try {
    const payload = {
      ...form,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
    }
    if (editing.value) await api.put(`/admin/phases/${editing.value}`, payload)
    else await api.post('/admin/phases', payload)
    cancelEdit()
    await load()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

async function toggleLock(ph) {
  try {
    await api.put(`/admin/phases/${ph.id}`, { is_locked_manually: !ph.is_locked_manually })
    await load()
  } catch (e) { alert('Erro') }
}

function startEdit(ph) {
  editing.value        = ph.id
  form.name            = ph.name
  form.display_name    = ph.display_name
  form.order_num       = ph.order_num
  form.start_time      = ph.start_time ? toLocalInput(ph.start_time) : ''
}

function cancelEdit() {
  editing.value = null
  form.name = ''; form.display_name = ''; form.order_num = 1; form.start_time = ''
}

async function remove(ph) {
  if (!confirm(`Excluir fase "${ph.display_name}"? Isso apagará todos os jogos e palpites desta fase.`)) return
  try { await api.delete(`/admin/phases/${ph.id}`); await load() }
  catch (e) { alert(e.response?.data?.error || 'Erro') }
}

function fmtDate(dt) {
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toLocalInput(dt) {
  if (!dt) return ''
  // Normaliza formato PostgreSQL "2025-06-27 13:00:00+00" → ISO válido
  const normalized = typeof dt === 'string' ? dt.trim().replace(' ', 'T') : dt
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>
