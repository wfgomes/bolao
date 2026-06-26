<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-logo">⚽</div>
      <h1>Bolão Copa 2026</h1>
      <p class="subtitle">Entre com seus dados para participar</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Usuário</label>
          <input v-model="username" class="form-control" placeholder="seu.usuario" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••" autocomplete="current-password" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:4px" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const username = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.push(auth.isAdmin ? '/admin' : '/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px 32px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 24px rgba(0,0,0,.12);
  text-align: center;
}
.login-logo { font-size: 48px; margin-bottom: 8px; }
h1 { font-size: 22px; color: #0d6efd; margin-bottom: 6px; }
.subtitle { color: #888; font-size: 14px; margin-bottom: 28px; }
</style>
