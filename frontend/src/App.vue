<template>
  <div class="app-wrapper" @click="closeMenu">

    <header v-if="auth.token" class="top-header">
      <span class="header-brand">⚽ Bolão dos Amigos</span>
      <div class="header-right">
        <router-link to="/perfil" class="header-user">{{ auth.user?.name }}</router-link>
        <!-- Hamburguer: só mobile + admin -->
        <button v-if="auth.isAdmin" class="btn-hamburger" @click.stop="menuOpen = !menuOpen" :class="{ active: menuOpen }">
          <span></span><span></span><span></span>
        </button>
        <button @click="logout" class="btn-logout">Sair</button>
      </div>
    </header>

    <!-- Menu dropdown mobile para admin -->
    <nav v-if="auth.token && auth.isAdmin && menuOpen" class="admin-mobile-menu" @click.stop>
      <router-link to="/admin/jogos"        @click="menuOpen = false">⚽ Jogos</router-link>
      <router-link to="/admin/resultados"   @click="menuOpen = false">📋 Resultados</router-link>
      <router-link to="/admin/fases"        @click="menuOpen = false">🔒 Fases</router-link>
      <router-link to="/admin/usuarios"     @click="menuOpen = false">👥 Usuários</router-link>
      <router-link to="/admin/classificacao" @click="menuOpen = false">🏆 Classificação</router-link>
      <router-link to="/admin/artilheiros"  @click="menuOpen = false">🥇 Artilheiros</router-link>
      <router-link to="/partidas"           @click="menuOpen = false">📊 Acertos</router-link>
    </nav>

    <!-- Nav desktop para admin e usuário -->
    <nav v-if="auth.token" class="desktop-nav">
      <div class="desktop-nav-inner">
        <template v-if="!auth.isAdmin">
          <router-link to="/">🏆 Classificação</router-link>
          <router-link to="/palpites">⚽ Meus Palpites</router-link>
          <router-link to="/partidas">📊 Acertos</router-link>
        </template>
        <template v-else>
          <router-link to="/admin/jogos">Jogos</router-link>
          <router-link to="/admin/resultados">Resultados</router-link>
          <router-link to="/admin/fases">Fases</router-link>
          <router-link to="/admin/usuarios">Usuários</router-link>
          <router-link to="/admin/classificacao">Classificação</router-link>
          <router-link to="/admin/artilheiros">Artilheiros</router-link>
          <router-link to="/partidas">📊 Acertos</router-link>
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
      <router-link to="/partidas" class="bnav-item">
        <span class="bnav-icon">📊</span>
        <span>Acertos</span>
      </router-link>
    </nav>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const auth     = useAuthStore()
const router   = useRouter()
const menuOpen = ref(false)

function closeMenu() { menuOpen.value = false }

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
