<template>
  <div>
    <h1 class="page-title">👤 Meu Perfil</h1>

    <div class="card">
      <div class="login-display">
        <span class="login-label">Login</span>
        <span class="login-value">{{ auth.user?.username }}</span>
        <span class="login-note">não pode ser alterado</span>
      </div>
    </div>

    <!-- Nome -->
    <div class="card">
      <h2 class="section-title">Nome completo</h2>
      <input
        v-model="name"
        type="text"
        class="form-control"
        placeholder="Seu nome completo"
        style="margin-bottom:12px"
      />
      <div v-if="nameStatus" class="alert" :class="nameStatus.cls" style="margin-bottom:10px">
        {{ nameStatus.msg }}
      </div>
      <button @click="saveName" class="btn btn-primary btn-full" :disabled="nameSaving || !name.trim() || name.trim() === auth.user?.name">
        {{ nameSaving ? 'Salvando...' : 'Salvar nome' }}
      </button>
    </div>

    <!-- Senha -->
    <div class="card">
      <h2 class="section-title">Alterar senha</h2>
      <input
        v-model="currentPassword"
        type="password"
        class="form-control"
        placeholder="Senha atual"
        style="margin-bottom:10px"
        autocomplete="current-password"
      />
      <input
        v-model="newPassword"
        type="password"
        class="form-control"
        placeholder="Nova senha"
        style="margin-bottom:10px"
        autocomplete="new-password"
      />
      <input
        v-model="confirmPassword"
        type="password"
        class="form-control"
        placeholder="Confirmar nova senha"
        style="margin-bottom:12px"
        autocomplete="new-password"
      />
      <div v-if="passStatus" class="alert" :class="passStatus.cls" style="margin-bottom:10px">
        {{ passStatus.msg }}
      </div>
      <button @click="savePassword" class="btn btn-primary btn-full" :disabled="passSaving">
        {{ passSaving ? 'Salvando...' : 'Alterar senha' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const name            = ref(auth.user?.name || '')
const nameSaving      = ref(false)
const nameStatus      = ref(null)

const currentPassword = ref('')
const newPassword     = ref('')
const confirmPassword = ref('')
const passSaving      = ref(false)
const passStatus      = ref(null)

async function saveName() {
  if (!name.value.trim()) return
  nameSaving.value = true
  nameStatus.value = null
  try {
    const { data } = await api.put('/auth/profile', { name: name.value.trim() })
    auth.updateUser(data.token, data.user)
    nameStatus.value = { cls: 'alert-success', msg: '✓ Nome atualizado!' }
  } catch (e) {
    nameStatus.value = { cls: 'alert-error', msg: e.response?.data?.error || 'Erro ao salvar' }
  } finally {
    nameSaving.value = false
  }
}

async function savePassword() {
  passStatus.value = null
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passStatus.value = { cls: 'alert-error', msg: 'Preencha todos os campos' }
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passStatus.value = { cls: 'alert-error', msg: 'Nova senha e confirmação não conferem' }
    return
  }
  passSaving.value = true
  try {
    const { data } = await api.put('/auth/profile', {
      current_password: currentPassword.value,
      new_password: newPassword.value,
    })
    auth.updateUser(data.token, data.user)
    passStatus.value = { cls: 'alert-success', msg: '✓ Senha alterada com sucesso!' }
    currentPassword.value = ''
    newPassword.value     = ''
    confirmPassword.value = ''
  } catch (e) {
    passStatus.value = { cls: 'alert-error', msg: e.response?.data?.error || 'Erro ao alterar senha' }
  } finally {
    passSaving.value = false
  }
}
</script>

<style scoped>
.login-display {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.login-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.login-value {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.login-note {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 20px;
}
</style>
