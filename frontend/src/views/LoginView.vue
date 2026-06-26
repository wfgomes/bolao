<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">⚽</div>
      <h1 class="login-title">Bolão dos Amigos</h1>
      <p class="login-sub">Copa do Mundo 2026</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Usuário</label>
          <input
            v-model="username"
            class="form-control"
            placeholder="seu.usuario"
            autocomplete="username"
            required
          />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
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
    error.value = e.response?.data?.error || 'Usuário ou senha incorretos'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%);
}
.login-card {
  background: white;
  border-radius: 20px;
  padding: 36px 28px 32px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  text-align: center;
}
.login-logo {
  font-size: 52px;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.15));
}
.login-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
  letter-spacing: -.5px;
}
.login-sub {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 28px;
  font-weight: 500;
}
.login-form { text-align: left; }
</style>
