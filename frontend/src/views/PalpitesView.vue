<template>
  <div>
    <h1 class="page-title">⚽ Meus Palpites</h1>

    <!-- Artilheiro -->
    <div v-if="!artLoading" class="card">
      <div class="phase-header">
        <h2>🥇 Artilheiro da Copa</h2>
        <span class="badge" :class="artData.is_locked ? 'badge-locked' : 'badge-open'">
          {{ artData.is_locked ? '🔒 Travado' : '🟢 Aberto' }}
        </span>
      </div>

      <div v-if="artData.is_locked && artData.user_choice" class="alert alert-info">
        Sua escolha: <strong>{{ artData.user_choice.artilheiro_name }}</strong>
        ({{ artData.user_choice.team }}) —
        <strong>{{ artData.user_choice.goals }} gol{{ artData.user_choice.goals !== 1 ? 's' : '' }}</strong>
        = <strong>+{{ artData.user_choice.goals }} pts</strong>
      </div>
      <div v-else-if="artData.is_locked && !artData.user_choice" class="alert alert-warning">
        Você não escolheu um artilheiro.
      </div>

      <div v-if="!artData.is_locked">
        <div class="form-group">
          <label>Escolha seu artilheiro</label>
          <select v-model.number="selectedArtilheiro" class="form-control">
            <option value="" disabled>Selecione um jogador...</option>
            <option v-for="a in artData.artilheiros" :key="a.id" :value="a.id">
              {{ a.name }} {{ a.team ? `(${a.team})` : '' }}
            </option>
          </select>
        </div>
        <div v-if="artStatus" class="alert" :class="artStatus.cls">{{ artStatus.msg }}</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <button @click="saveArtilheiro" class="btn btn-primary" :disabled="artSaving || !selectedArtilheiro">
            {{ artSaving ? 'Salvando...' : 'Confirmar artilheiro' }}
          </button>
          <span v-if="artData.user_choice" style="color:#555;font-size:14px">
            Atual: <strong>{{ artData.user_choice.artilheiro_name }}</strong>
          </span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card" style="text-align:center;color:#888;padding:30px">Carregando jogos...</div>

    <div v-else-if="phases.length === 0" class="card" style="text-align:center;color:#888;padding:30px">
      Nenhum jogo cadastrado ainda.
    </div>

    <div v-else>
      <div v-for="phase in phases" :key="phase.id" class="card">
        <div class="phase-header">
          <h2>{{ phase.display_name }}</h2>
          <span class="badge" :class="phase.is_locked ? 'badge-locked' : 'badge-open'">
            {{ phase.is_locked ? '🔒 Travado' : '🟢 Aberto' }}
          </span>
        </div>

        <div v-if="phase.is_locked" class="alert alert-info">
          Fase travada — palpites encerrados.
          <router-link :to="`/ver-palpites/${phase.id}`" style="font-weight:bold">
            Ver palpites de todos →
          </router-link>
        </div>

        <div v-for="game in phase.games" :key="game.id" class="game-card">
          <div class="game-teams">
            <span class="team home">{{ game.home_team }}</span>

            <div class="score-area">
              <template v-if="!phase.is_locked">
                <input
                  type="number" min="0" max="99"
                  v-model.number="preds[game.id].home"
                  class="score-input"
                />
                <span class="vs">x</span>
                <input
                  type="number" min="0" max="99"
                  v-model.number="preds[game.id].away"
                  class="score-input"
                />
              </template>
              <template v-else>
                <span class="score-locked">
                  {{ game.prediction != null ? `${game.prediction.home_score} x ${game.prediction.away_score}` : '— x —' }}
                </span>
              </template>
            </div>

            <span class="team away">{{ game.away_team }}</span>
          </div>

          <div class="game-meta">
            <span v-if="game.game_datetime" class="game-date">{{ fmtDate(game.game_datetime) }}</span>
            <span v-if="game.prediction && !phase.is_locked" class="saved-tag">✓ salvo</span>
            <span v-if="game.is_finished" :class="ptsClass(game.prediction?.points)" class="pts-tag">
              {{ ptsLabel(game.prediction?.points) }}
              &nbsp;|&nbsp; Resultado: {{ game.home_score }} x {{ game.away_score }}
            </span>
          </div>
        </div>

        <div v-if="!phase.is_locked" class="save-row">
          <div v-if="status[phase.id]" class="alert" :class="status[phase.id].cls">
            {{ status[phase.id].msg }}
          </div>
          <button @click="save(phase)" class="btn btn-success" :disabled="saving[phase.id]">
            {{ saving[phase.id] ? 'Salvando...' : 'Salvar palpites desta fase' }}
          </button>
        </div>
      </div>
    </div>
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

const artData           = ref({ artilheiros: [], user_choice: null, is_locked: false })
const artLoading        = ref(true)
const selectedArtilheiro = ref('')
const artSaving         = ref(false)
const artStatus         = ref(null)

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
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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
    status[phase.id] = { cls: 'alert-success', msg: 'Palpites salvos com sucesso!' }
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
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function ptsClass(pts) {
  if (pts === 3) return 'pts-exact'
  if (pts === 1) return 'pts-partial'
  if (pts === 0) return 'pts-wrong'
  return ''
}
function ptsLabel(pts) {
  if (pts === 3) return '🎯 Placar exato +3'
  if (pts === 1) return '✅ Vencedor certo +1'
  if (pts === 0) return '❌ Errou 0'
  return ''
}
</script>

<style scoped>
.phase-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
}
.phase-header h2 { font-size: 17px; font-weight: bold; color: #333; }

.game-card {
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 10px;
  background: #fafafa;
}
.game-teams {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.team { font-weight: bold; font-size: 14px; flex: 1; }
.home { text-align: right; }
.away { text-align: left; }

.score-area { display: flex; align-items: center; gap: 6px; }
.score-input {
  width: 52px; padding: 6px 4px; border: 2px solid #0d6efd;
  border-radius: 8px; font-size: 20px; font-weight: bold;
  text-align: center; color: #0d6efd; outline: none;
}
.score-locked {
  font-size: 20px; font-weight: bold; color: #555;
  min-width: 80px; text-align: center;
}
.vs { font-weight: bold; color: #888; font-size: 15px; }

.game-meta { margin-top: 6px; font-size: 12px; color: #888; display: flex; gap: 12px; flex-wrap: wrap; }
.saved-tag { color: #198754; font-weight: bold; }
.pts-tag { font-weight: bold; }
.pts-exact   { color: #155724; }
.pts-partial { color: #856404; }
.pts-wrong   { color: #721c24; }

.save-row { margin-top: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
</style>
