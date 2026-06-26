<template>
  <div>
    <nav v-if="auth.token" class="navbar">
      <div class="nav-container">
        <span class="nav-brand">⚽ Bolão Copa 2026</span>
        <div class="nav-links">
          <template v-if="!auth.isAdmin">
            <router-link to="/">🏆 Classificação</router-link>
            <router-link to="/palpites">⚽ Meus Palpites</router-link>
          </template>
          <template v-else>
            <router-link to="/admin/jogos">Jogos</router-link>
            <router-link to="/admin/resultados">Resultados</router-link>
            <router-link to="/admin/fases">Fases</router-link>
            <router-link to="/admin/usuarios">Usuários</router-link>
            <router-link to="/admin/classificacao">Classificação</router-link>
            <router-link to="/admin/artilheiros">Artilheiros</router-link>
          </template>
          <button @click="logout" class="btn-logout">Sair ({{ auth.user?.name }})</button>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
