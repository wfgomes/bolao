<template>
  <div class="app-wrapper">

    <header v-if="auth.token" class="top-header">
      <span class="header-brand">⚽ Bolão dos Amigos</span>
      <div class="header-right">
        <span class="header-user">{{ auth.user?.name }}</span>
        <button @click="logout" class="btn-logout">Sair</button>
      </div>
    </header>

    <!-- Nav desktop para admin e usuário -->
    <nav v-if="auth.token" class="desktop-nav">
      <div class="desktop-nav-inner">
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
      </div>
    </nav>

    <main class="main-content" :class="{ 'no-bottom': !auth.token || auth.isAdmin }">
      <router-view />
    </main>

    <!-- Bottom nav mobile (só para usuários comuns) -->
    <nav v-if="auth.token && !auth.isAdmin" class="bottom-nav">
      <router-link to="/" class="bnav-item">
        <span class="bnav-icon">🏆</span>
        <span>Classificação</span>
      </router-link>
      <router-link to="/palpites" class="bnav-item">
        <span class="bnav-icon">⚽</span>
        <span>Palpites</span>
      </router-link>
    </nav>

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
