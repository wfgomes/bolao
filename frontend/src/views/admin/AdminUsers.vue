<template>
  <div>
    <h1 class="page-title">👥 Usuários</h1>

    <div class="card">
      <h2 class="section-title">{{ editing ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
      <div v-if="formError" class="alert alert-error">{{ formError }}</div>

      <form @submit.prevent="submit" style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
        <div class="form-group">
          <label>Login</label>
          <input v-model="form.username" class="form-control" :disabled="!!editing" placeholder="joao.silva" required />
        </div>
        <div class="form-group">
          <label>Nome completo</label>
          <input v-model="form.name" class="form-control" placeholder="João Silva" required />
        </div>
        <div class="form-group">
          <label>Senha {{ editing ? '(deixe em branco p/ manter)' : '' }}</label>
          <input v-model="form.password" type="password" class="form-control" :required="!editing" placeholder="••••••" />
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end;gap:12px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" v-model="form.is_admin" /> Admin
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" v-model="form.active" /> Ativo
          </label>
        </div>
        <div style="display:flex;gap:8px;grid-column:1/-1">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar usuário' }}
          </button>
          <button v-if="editing" type="button" @click="cancelEdit" class="btn btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2 class="section-title">Participantes cadastrados</h2>
      <div v-if="loadingUsers" style="color:#888">Carregando...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Login</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.name }}</td>
            <td>{{ u.username }}</td>
            <td>
              <span v-if="u.is_admin" class="badge badge-admin">Admin</span>
              <span v-else-if="u.active" class="badge badge-open">Ativo</span>
              <span v-else class="badge badge-inactive">Inativo</span>
            </td>
            <td>
              <div class="table-actions">
                <button @click="startEdit(u)" class="btn btn-warning btn-sm">Editar</button>
                <button @click="remove(u)" class="btn btn-danger btn-sm">Excluir</button>
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

const users        = ref([])
const loadingUsers = ref(true)
const saving       = ref(false)
const formError    = ref('')
const editing      = ref(null)

const form = reactive({ username: '', name: '', password: '', is_admin: false, active: true })

onMounted(loadUsers)

async function loadUsers() {
  loadingUsers.value = true
  try { users.value = (await api.get('/admin/users')).data }
  catch (e) { console.error(e) }
  finally { loadingUsers.value = false }
}

async function submit() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/admin/users/${editing.value}`, form)
    } else {
      await api.post('/admin/users', form)
    }
    resetForm()
    await loadUsers()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

function startEdit(u) {
  editing.value  = u.id
  form.username  = u.username
  form.name      = u.name
  form.password  = ''
  form.is_admin  = u.is_admin
  form.active    = u.active
}

function cancelEdit() { editing.value = null; resetForm() }

function resetForm() {
  form.username = ''; form.name = ''; form.password = ''
  form.is_admin = false; form.active = true
}

async function remove(u) {
  if (!confirm(`Excluir ${u.name}?`)) return
  try {
    await api.delete(`/admin/users/${u.id}`)
    await loadUsers()
  } catch (e) { alert(e.response?.data?.error || 'Erro') }
}
</script>
