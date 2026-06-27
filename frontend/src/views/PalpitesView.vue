<template>
  <div>
    <h1 class="page-title">⚽ Meus Palpites</h1>

    <!-- Artilheiro -->
    <div v-if="!artLoading" class="card art-card">
      <div class="art-header">
        <div>
          <div class="art-label">Artilheiro da Copa</div>
          <div v-if="artData.user_choice" class="art-chosen">
            {{ artData.user_choice.artilheiro_name }}
            <span v-if="artData.user_choice.team" class="art-team">{{ artData.user_choice.team }}</span>
          </div>
          <div v-else class="art-none">Nenhum escolhido</div>
        </div>
        <span class="badge" :class="artData.is_locked ? 'badge-locked' : 'badge-open'">
          {{ artData.is_locked ? '🔒 Travado' : '🟢 Aberto' }}
        </span>
      </div>

      <div v-if="artData.is_locked && artData.user_choice" class="art-goals">
        ⚽ {{ artData.user_choice.goals }} gol{{ artData.user_choice.goals !== 1 ? 's' : '' }}
        → <strong>+{{ artData.user_choice.goals }} pts</strong>
      </div>

      <div v-if="!artData.is_locked" style="margin-top:12px">
        <select v-model.number="selectedArtilheiro" class="form-control" style="margin-bottom:10px">
          <option value="" disabled>Selecione um jogador...</option>
          <option v-for="a in artData.artilheiros" :key="a.id" :value="a.id">
            {{ a.name }}{{ a.team ? ` (${a.team})` : '' }}
          </option>
        </select>
        <div v-if="artStatus" class="alert" :class="artStatus.cls">{{ artStatus.msg }}</div>
        <button @click="saveArtilheiro" class="btn btn-primary btn-full" :disabled="artSaving || !selectedArtilheiro">
          {{ artSaving ? 'Salvando...' : artData.user_choice ? 'Alterar artilheiro' : 'Confirmar artilheiro' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="card" style="text-align:center;color:#64748b;padding:30px">
      Carregando jogos...
    </div>
    <div v-else-if="phases.length === 0" class="card" style="text-align:center;color:#64748b;padding:30px">
      Nenhum jogo cadastrado ainda.
    </div>

    <template v-else>
      <div v-for="phase in phases" :key="phase.id" class="card">
        <div class="phase-header">
          <span class="phase-name">{{ phase.display_name }}</span>
          <span class="badge" :class="phase.is_locked ? 'badge-locked' : 'badge-open'">
            {{ phase.is_locked ? '🔒' : '🟢' }}
          </span>
        </div>

        <div v-if="phase.is_locked" class="alert alert-info" style="margin-bottom:10px">
          Travado.
          <router-link :to="`/ver-palpites/${phase.id}`" style="font-weight:700">
            Ver palpites de todos →
          </router-link>
        </div>

        <div v-for="game in phase.games" :key="game.id" class="game-card">
          <div v-if="game.game_datetime" class="game-date">
            {{ fmtDate(game.game_datetime) }}
          </div>

          <div class="game-row">
            <span class="team-name">{{ game.home_team }}</span>

            <div class="score-box">
              <template v-if="!phase.is_locked">
                <input
                  type="number" min="0" max="99"
                  v-model.number="preds[game.id].home"
                  class="score-input"
                />
                <span class="score-sep">×</span>
                <input
                  type="number" min="0" max="99"
                  v-model.number="preds[game.id].away"
                  class="score-input"
                />
              </template>
              <template v-else>
                <span class="score-locked">
                  {{ game.prediction != null ? `${game.prediction.home_score} × ${game.prediction.away_score}` : '— × —' }}
                </span>
              </template>
            </div>

            <span class="team-name away">{{ game.away_team }}</span>
          </div>

          <div v-if="game.status === 'EA' || game.status === 'IN'" class="game-result live-result">
            <span class="live-badge">🔴 Ao vivo</span>
            <span class="result-label">{{ game.home_score }} × {{ game.away_score }}</span>
            <span v-if="game.prediction?.points != null" class="badge" :class="ptsClass(game.prediction.points)">
              {{ ptsLabel(game.prediction.points) }}
            </span>
          </div>
          <div v-else-if="game.status === 'FZ'" class="game-result">
            <span class="result-label">Resultado: {{ game.home_score }} × {{ game.away_score }}</span>
            <span v-if="game.prediction?.points != null" class="badge" :class="ptsClass(game.prediction.points)">
              {{ ptsLabel(game.prediction.points) }}
            </span>
          </div>
          <div v-else-if="game.prediction && !phase.is_locked" class="saved-label">✓ palpite salvo</div>
        </div>

        <div v-if="!phase.is_locked" class="save-row">
          <div v-if="status[phase.id]" class="alert" :class="status[phase.id].cls">{{ status[phase.id].msg }}</div>
          <button @click="save(phase)" class="btn btn-success btn-full" :disabled="saving[phase.id]">
            {{ saving[phase.id] ? 'Salvando...' : 'Salvar palpites' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api'

const phases  = ref([])
const loading = ref(true)
const preds   = reactive({})
const saving  = reactive({})
const status  = reactive({})

const artData            = ref({ artilheiros: [], user_choice: null, is_locked: false })
const artLoading         = ref(true)
const selectedArtilheiro = ref('')
const artSaving          = ref(false)
const artStatus          = ref(null)

onMounted(() => { load(); loadArtilheiro() })

async function loadArtilheiro() {
  artLoading.value = true
  try {
    const { data } = await api.get('/artilheiro')
    artData.value = data
    if (data.user_choice) selectedArtilheiro.value = data.user_choice.artilheiro_id
  } catch (e) { console.error(e) }
  finally { artLoading.value = false }
}

async function saveArtilheiro() {
  artSaving.value = true
  artStatus.value = null
  try {
    await api.post('/artilheiro', { artilheiro_id: selectedArtilheiro.value })
    artStatus.value = { cls: 'alert-success', msg: 'Artilheiro salvo!' }
    await loadArtilheiro()
  } catch (e) {
    artStatus.value = { cls: 'alert-error', msg: e.response?.data?.error || 'Erro ao salvar' }
  } finally {
    artSaving.value = false
  }
}

async function load() {
  try {
    const { data } = await api.get('/games')
    phases.value = data
    data.forEach(phase => {
      phase.games.forEach(g => {
        preds[g.id] = {
          home: g.prediction?.home_score ?? '',
          away: g.prediction?.away_score ?? '',
        }
      })
    })
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function save(phase) {
  const list = phase.games
    .filter(g => preds[g.id].home !== '' && preds[g.id].away !== '')
    .map(g => ({ game_id: g.id, home_score: preds[g.id].home, away_score: preds[g.id].away }))

  if (!list.length) {
    status[phase.id] = { cls: 'alert-error', msg: 'Preencha pelo menos um palpite' }
    return
  }

  saving[phase.id] = true
  status[phase.id] = null
  try {
    await api.post('/predictions', { predictions: list })
    status[phase.id] = { cls: 'alert-success', msg: '✓ Palpites salvos!' }
    const { data } = await api.get('/games')
    phases.value = data
    data.forEach(ph => {
      ph.games.forEach(g => {
        if (g.prediction) {
          preds[g.id] = { home: g.prediction.home_score, away: g.prediction.away_score }
        }
      })
    })
  } catch (e) {
    status[phase.id] = { cls: 'alert-error', msg: e.response?.data?.error || 'Erro ao salvar' }
  } finally {
    saving[phase.id] = false
  }
}

function fmtDate(dt) {
  return new Date(dt).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}
function ptsClass(pts) {
  if (pts === 3) return 'badge-exact'
  if (pts === 1) return 'badge-partial'
  return 'badge-wrong'
}
function ptsLabel(pts) {
  if (pts === 3) return '🎯 +3'
  if (pts === 1) return '✅ +1'
  return '❌ 0'
}
</script>

<style scoped>
/* Artilheiro card */
.art-card { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); color: white; }
.art-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
.art-label  { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; opacity: .75; margin-bottom: 4px; }
.art-chosen { font-size: 18px; font-weight: 700; }
.art-none   { font-size: 15px; opacity: .65; }
.art-team   { font-size: 13px; font-weight: 400; opacity: .8; margin-left: 6px; }
.art-goals  { font-size: 14px; opacity: .9; margin-top: 6px; }
.art-card .badge-locked { background: rgba(255,255,255,.15); color: white; }
.art-card .badge-open   { background: rgba(255,255,255,.2); color: white; }
.art-card .form-control { color: #0f172a; }
.art-card .btn-primary  { background: white; color: #1d4ed8; }

/* Phase */
.phase-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.phase-name   { font-weight: 700; font-size: 16px; }

/* Game card */
.game-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.game-date { font-size: 11px; color: #94a3b8; text-transform: capitalize; margin-bottom: 8px; }
.game-row  { display: flex; align-items: center; gap: 6px; }

.team-name { font-weight: 700; font-size: 14px; flex: 1; text-align: right; }
.team-name.away { text-align: left; }

.score-box { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.score-input {
  width: 48px; height: 48px;
  border: 2px solid #1d4ed8;
  border-radius: 10px;
  font-size: 22px; font-weight: 700;
  text-align: center;
  color: #1d4ed8;
  outline: none;
  -webkit-appearance: none;
  background: #eff6ff;
}
.score-input:focus { background: white; box-shadow: 0 0 0 3px rgba(29,78,216,.15); }
.score-sep    { font-size: 18px; font-weight: 700; color: #94a3b8; }
.score-locked { font-size: 20px; font-weight: 700; color: #475569; min-width: 80px; text-align: center; }

.game-result { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; flex-wrap: wrap; }
.result-label { color: #64748b; }
.saved-label  { font-size: 12px; color: #16a34a; margin-top: 6px; font-weight: 600; }
.live-result  { background: #fff1f2; border-radius: 8px; padding: 5px 8px; }
.live-badge   { font-size: 11px; font-weight: 700; color: #dc2626; animation: pulse 1.2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

.save-row { margin-top: 14px; }
</style>
