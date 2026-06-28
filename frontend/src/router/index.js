import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/palpites', component: () => import('../views/PalpitesView.vue') },
  { path: '/ver-palpites/:phaseId', component: () => import('../views/VerPalpitesView.vue') },
  { path: '/partidas',             component: () => import('../views/PartidasView.vue') },
  { path: '/participante/:userId', component: () => import('../views/ParticipanteView.vue') },
  { path: '/perfil',               component: () => import('../views/PerfilView.vue') },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { admin: true },
    children: [
      { path: '',           redirect: '/admin/jogos' },
      { path: 'usuarios',   component: () => import('../views/admin/AdminUsers.vue') },
      { path: 'fases',      component: () => import('../views/admin/AdminPhases.vue') },
      { path: 'jogos',      component: () => import('../views/admin/AdminGames.vue') },
      { path: 'resultados', component: () => import('../views/admin/AdminResults.vue') },
      { path: 'classificacao', component: () => import('../views/admin/AdminStandings.vue') },
      { path: 'artilheiros',  component: () => import('../views/admin/AdminArtilheiros.vue') },
      { path: 'palpites-faltando', component: () => import('../views/admin/AdminMissingPreds.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.token) return next('/login')
  if (to.meta.admin && !auth.isAdmin)  return next('/')
  next()
})

export default router
