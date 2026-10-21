/**
 * GameVault — Frontend Application Logic
 * JavaScript Vanilla (ES6+) desacoplado e modular
 */

// ==========================================================================
// 1. Configuração da API
// ==========================================================================

/**
 * Resolve dinamicamente a URL base da API.
 * Prioridade:
 * 1. window.API_BASE_URL (injetada via script ou HTML de ambiente)
 * 2. localStorage.getItem('GAMEVAULT_API_URL') (configuração manual pelo usuário)
 * 3. Mesma origem caso esteja rodando na mesma porta do backend (/api)
 * 4. http://localhost:3000/api como fallback padrão de desenvolvimento local
 */
function getApiBaseUrl() {
  if (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL.trim() !== '') {
    return window.API_BASE_URL.replace(/\/$/, '');
  }

  const storedUrl = localStorage.getItem('GAMEVAULT_API_URL');
  if (storedUrl) {
    return storedUrl.replace(/\/$/, '');
  }

  const { hostname, port, protocol } = window.location;
  if (port === '3000' || (!port && (protocol === 'http:' || protocol === 'https:'))) {
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
  }

  return 'http://localhost:3000/api';
}

const API_BASE_URL = getApiBaseUrl();

// ==========================================================================
// 2. Estado da Aplicação
// ==========================================================================

const state = {
  games: [],
  isLoading: false,
  apiOnline: false,
  filters: {
    busca: '',
    genero: '',
    sort: 'recente',
  },
  modalMode: 'create', // 'create' | 'edit'
  editingGameId: null,
  deletingGameId: null,
};

// ==========================================================================
// 3. Seletores do DOM
// ==========================================================================

const elements = {
  apiStatusBadge: document.getElementById('apiStatusBadge'),
  btnOpenCreateModal: document.getElementById('btnOpenCreateModal'),
  searchInput: document.getElementById('searchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  genreFilter: document.getElementById('genreFilter'),
  sortSelect: document.getElementById('sortSelect'),
  btnReload: document.getElementById('btnReload'),
  resultsCount: document.getElementById('resultsCount'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  errorMessageTitle: document.getElementById('errorMessageTitle'),
  errorMessageDesc: document.getElementById('errorMessageDesc'),
  btnRetry: document.getElementById('btnRetry'),
  emptyState: document.getElementById('emptyState'),
  emptyStateText: document.getElementById('emptyStateText'),
  btnClearFilters: document.getElementById('btnClearFilters'),
  gamesGrid: document.getElementById('gamesGrid'),
  // Modal de Criação / Edição
  gameModal: document.getElementById('gameModal'),
  modalTitle: document.getElementById('modalTitle'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelModal: document.getElementById('btnCancelModal'),
  gameForm: document.getElementById('gameForm'),
  formAlert: document.getElementById('formAlert'),
  gameId: document.getElementById('gameId'),
  formModelo: document.getElementById('formModelo'),
  formMarca: document.getElementById('formMarca'),
  formGenero: document.getElementById('formGenero'),
  formAno: document.getElementById('formAno'),
  formPreco: document.getElementById('formPreco'),
  formFoto: document.getElementById('formFoto'),
  imagePreview: document.getElementById('imagePreview'),
  previewPlaceholder: document.getElementById('previewPlaceholder'),
  btnSubmitForm: document.getElementById('btnSubmitForm'),
  // Modal de Exclusão
  deleteModal: document.getElementById('deleteModal'),
  deleteGameName: document.getElementById('deleteGameName'),
  btnCloseDeleteModal: document.getElementById('btnCloseDeleteModal'),
  btnCancelDelete: document.getElementById('btnCancelDelete'),
  btnConfirmDelete: document.getElementById('btnConfirmDelete'),
  // Toasts
  toastContainer: document.getElementById('toastContainer'),
};

// ==========================================================================
// 4. Utilitários e Formatação
// ==========================================================================

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatPrice(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return currencyFormatter.format(value);
}

function showToast(message, type = 'info') {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250" fill="%23121824"><rect width="400" height="250" fill="%23121824"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="48">🎮</text><text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="14">Sem Imagem Disponível</text></svg>';

// ==========================================================================
// 5. Comunicação com a API
// ==========================================================================

async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      state.apiOnline = true;
      const isDbConnected = data.database && data.database.connected;
      updateStatusBadge('online', isDbConnected ? 'API & Banco Online' : 'API Online (Banco desconectado)');
      return;
    }
    throw new Error('Healthcheck status ' + res.status);
  } catch (error) {
    state.apiOnline = false;
    updateStatusBadge('offline', 'API Offline');
  }
}

function updateStatusBadge(status, text) {
  if (!elements.apiStatusBadge) return;
  elements.apiStatusBadge.className = `status-badge ${status}`;
  elements.apiStatusBadge.querySelector('.status-text').textContent = text;
}

async function fetchGames() {
  setLoading(true);
  hideError();
  hideEmpty();

  try {
    const params = new URLSearchParams();
    if (state.filters.busca) params.append('busca', state.filters.busca);
    if (state.filters.genero) params.append('genero', state.filters.genero);
    if (state.filters.sort) params.append('sort', state.filters.sort);

    const url = `${API_BASE_URL}/games?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP ${res.status}`);
    }

    const json = await res.json();
    state.games = Array.isArray(json.data) ? json.data : [];
    state.apiOnline = true;
    updateStatusBadge('online', 'API Conectada');

    renderGamesList();
  } catch (error) {
    showError(
      'Falha ao conectar à API',
      `Não foi possível carregar o catálogo de aparelhos (${error.message}). Verifique se o backend está rodando em ${API_BASE_URL}.`
    );
    updateStatusBadge('offline', 'API Indisponível');
  } finally {
    setLoading(false);
  }
}

async function apiCreateGame(payload) {
  const res = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.errors ? data.errors.join('<br>') : data.message || 'Erro ao cadastrar aparelho.';
    throw new Error(errorMsg);
  }

  return data;
}

async function apiUpdateGame(id, payload) {
  const res = await fetch(`${API_BASE_URL}/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.errors ? data.errors.join('<br>') : data.message || 'Erro ao atualizar aparelho.';
    throw new Error(errorMsg);
  }

  return data;
}

async function apiDeleteGame(id) {
  const res = await fetch(`${API_BASE_URL}/games/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Erro ao excluir aparelho.');
  }

  return data;
}

// ==========================================================================
// 6. Renderização da Interface
// ==========================================================================

function renderGamesList() {
  const grid = elements.gamesGrid;
  grid.innerHTML = '';

  const total = state.games.length;
  elements.resultsCount.textContent =
    total === 0
      ? 'Nenhum aparelho para exibir'
      : total === 1
      ? '1 aparelho encontrado'
      : `${total} aparelhos encontrados`;

  if (total === 0) {
    showEmpty();
    return;
  }

  hideEmpty();

  const fragment = document.createDocumentFragment();

  state.games.forEach((game) => {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.dataset.id = game.id;

    const safeModelo = escapeHtml(game.modelo);
    const safeMarca = escapeHtml(game.marca);
    const safeGenero = escapeHtml(game.genero);
    const safeFoto = escapeHtml(game.foto);
    const formattedPrice = formatPrice(game.preco);

    card.innerHTML = `
      <div class="card-media">
        <span class="card-genre-badge">${safeGenero}</span>
        <img
          src="${safeFoto}"
          alt="Foto do ${safeModelo}"
          loading="lazy"
          onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';"
        />
      </div>

      <div class="card-content">
        <span class="card-brand">${safeMarca}</span>
        <h3 class="card-title">${safeModelo}</h3>

        <div class="card-specs">
          <span class="card-spec-item" title="Ano de Lançamento">
            <span aria-hidden="true">📅</span>
            <strong>${game.ano}</strong>
          </span>
          <span class="card-spec-item" title="Categoria">
            <span aria-hidden="true">🏷️</span>
            <span>${safeGenero}</span>
          </span>
        </div>

        <div class="card-price-row">
          <div>
            <span class="card-price-label">Preço estimado</span>
            <span class="card-price-value">${formattedPrice}</span>
          </div>

          <div class="card-actions">
            <button
              type="button"
              class="btn-card-edit"
              data-id="${game.id}"
              aria-label="Editar ${safeModelo}"
              title="Editar"
            >
              ✏️ Editar
            </button>
            <button
              type="button"
              class="btn-card-delete"
              data-id="${game.id}"
              data-name="${safeModelo}"
              aria-label="Excluir ${safeModelo}"
              title="Excluir"
            >
              🗑️ Excluir
            </button>
          </div>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  if (isLoading) {
    elements.loadingState.classList.remove('hidden');
    elements.gamesGrid.classList.add('hidden');
  } else {
    elements.loadingState.classList.add('hidden');
    elements.gamesGrid.classList.remove('hidden');
  }
}

function showError(title, message) {
  elements.errorMessageTitle.textContent = title;
  elements.errorMessageDesc.textContent = message;
  elements.errorState.classList.remove('hidden');
  elements.gamesGrid.classList.add('hidden');
  elements.emptyState.classList.add('hidden');
  elements.resultsCount.textContent = 'Erro de comunicação';
}

function hideError() {
  elements.errorState.classList.add('hidden');
}

function showEmpty() {
  elements.emptyState.classList.remove('hidden');
  if (state.filters.busca || state.filters.genero) {
    elements.emptyStateText.textContent =
      'Nenhum aparelho encontrado para os critérios de busca ou filtro informados.';
  } else {
    elements.emptyStateText.textContent =
      'O catálogo está vazio. Clique em "+ Novo Aparelho" acima para cadastrar seu primeiro console ou acessório gamer!';
  }
}

function hideEmpty() {
  elements.emptyState.classList.add('hidden');
}

// ==========================================================================
// 7. Modais e Formulários
// ==========================================================================

function openCreateModal() {
  state.modalMode = 'create';
  state.editingGameId = null;
  elements.modalTitle.textContent = 'Cadastrar Novo Aparelho';
  elements.btnSubmitForm.querySelector('.btn-text').textContent = 'Salvar Aparelho';

  resetForm();
  elements.gameModal.classList.remove('hidden');
  elements.formModelo.focus();
}

function openEditModal(id) {
  const game = state.games.find((g) => g.id === id);
  if (!game) {
    showToast('Aparelho não encontrado para edição.', 'error');
    return;
  }

  state.modalMode = 'edit';
  state.editingGameId = id;
  elements.modalTitle.textContent = 'Editar Aparelho Gamer';
  elements.btnSubmitForm.querySelector('.btn-text').textContent = 'Atualizar Dados';

  resetForm();

  elements.gameId.value = game.id;
  elements.formModelo.value = game.modelo || '';
  elements.formMarca.value = game.marca || '';
  elements.formGenero.value = game.genero || '';
  elements.formAno.value = game.ano || '';
  elements.formPreco.value = game.preco != null ? game.preco : '';
  elements.formFoto.value = game.foto || '';

  updateImagePreview(game.foto);

  elements.gameModal.classList.remove('hidden');
  elements.formModelo.focus();
}

function closeModal() {
  elements.gameModal.classList.add('hidden');
  resetForm();
}

function resetForm() {
  elements.gameForm.reset();
  elements.gameId.value = '';
  elements.formAlert.classList.add('hidden');
  elements.formAlert.innerHTML = '';
  clearValidationErrors();
  updateImagePreview('');
}

function clearValidationErrors() {
  const fields = ['modelo', 'marca', 'genero', 'ano', 'preco', 'foto'];
  fields.forEach((f) => {
    const errSpan = document.getElementById(`err-${f}`);
    if (errSpan) errSpan.textContent = '';
    const input = document.getElementById(`form${capitalize(f)}`);
    if (input) input.classList.remove('is-invalid');
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateImagePreview(url) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    elements.imagePreview.src = trimmed;
    elements.imagePreview.classList.remove('hidden');
    elements.previewPlaceholder.classList.add('hidden');

    elements.imagePreview.onerror = () => {
      elements.imagePreview.src = PLACEHOLDER_IMG;
    };
  } else {
    elements.imagePreview.src = '';
    elements.imagePreview.classList.add('hidden');
    elements.previewPlaceholder.classList.remove('hidden');
  }
}

function validateClientForm(data) {
  let hasError = false;
  clearValidationErrors();

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 2;

  if (!data.modelo || data.modelo.trim() === '') {
    setFieldError('modelo', 'Informe o modelo do aparelho.');
    hasError = true;
  }

  if (!data.marca || data.marca.trim() === '') {
    setFieldError('marca', 'Informe a marca ou fabricante.');
    hasError = true;
  }

  if (!data.genero || data.genero.trim() === '') {
    setFieldError('genero', 'Selecione o gênero/categoria.');
    hasError = true;
  }

  if (isNaN(data.ano) || !Number.isInteger(data.ano) || data.ano < 1958 || data.ano > maxYear) {
    setFieldError('ano', `O ano deve ser um inteiro entre 1958 e ${maxYear}.`);
    hasError = true;
  }

  if (isNaN(data.preco) || data.preco < 0) {
    setFieldError('preco', 'O preço deve ser um valor numérico maior ou igual a zero.');
    hasError = true;
  }

  const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  if (!data.foto || !urlRegex.test(data.foto.trim())) {
    setFieldError('foto', 'Informe uma URL válida iniciando com http:// ou https://.');
    hasError = true;
  }

  return !hasError;
}

function setFieldError(field, message) {
  const errSpan = document.getElementById(`err-${field}`);
  if (errSpan) errSpan.textContent = message;
  const input = document.getElementById(`form${capitalize(field)}`);
  if (input) input.classList.add('is-invalid');
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const payload = {
    modelo: elements.formModelo.value.trim(),
    marca: elements.formMarca.value.trim(),
    genero: elements.formGenero.value.trim(),
    ano: parseInt(elements.formAno.value, 10),
    preco: parseFloat(elements.formPreco.value),
    foto: elements.formFoto.value.trim(),
  };

  if (!validateClientForm(payload)) {
    return;
  }

  elements.btnSubmitForm.disabled = true;
  elements.btnSubmitForm.querySelector('.btn-text').textContent = 'Processando...';
  elements.formAlert.classList.add('hidden');

  try {
    if (state.modalMode === 'create') {
      await apiCreateGame(payload);
      showToast(`Aparelho "${payload.modelo}" cadastrado com sucesso!`, 'success');
    } else {
      await apiUpdateGame(state.editingGameId, payload);
      showToast(`Aparelho "${payload.modelo}" atualizado com sucesso!`, 'success');
    }

    closeModal();
    await fetchGames();
  } catch (error) {
    elements.formAlert.innerHTML = `<strong>Atenção:</strong><br>${error.message}`;
    elements.formAlert.classList.remove('hidden');
  } finally {
    elements.btnSubmitForm.disabled = false;
    elements.btnSubmitForm.querySelector('.btn-text').textContent =
      state.modalMode === 'create' ? 'Salvar Aparelho' : 'Atualizar Dados';
  }
}

// Modal de Exclusão
function openDeleteModal(id, name) {
  state.deletingGameId = id;
  elements.deleteGameName.textContent = `"${name}"`;
  elements.deleteModal.classList.remove('hidden');
  elements.btnConfirmDelete.focus();
}

function closeDeleteModal() {
  state.deletingGameId = null;
  elements.deleteModal.classList.add('hidden');
}

async function handleConfirmDelete() {
  if (!state.deletingGameId) return;

  const id = state.deletingGameId;
  elements.btnConfirmDelete.disabled = true;
  elements.btnConfirmDelete.textContent = 'Excluindo...';

  try {
    await apiDeleteGame(id);
    showToast('Aparelho excluído do catálogo com sucesso.', 'success');
    closeDeleteModal();
    await fetchGames();
  } catch (error) {
    showToast(`Falha ao excluir aparelho: ${error.message}`, 'error');
  } finally {
    elements.btnConfirmDelete.disabled = false;
    elements.btnConfirmDelete.textContent = 'Sim, Excluir';
  }
}

// ==========================================================================
// 8. Event Listeners e Inicialização
// ==========================================================================

function debounce(func, delay = 350) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function initEventListeners() {
  // Busca em tempo real com debounce
  const debouncedSearch = debounce(() => {
    state.filters.busca = elements.searchInput.value.trim();
    if (state.filters.busca) {
      elements.btnClearSearch.classList.remove('hidden');
    } else {
      elements.btnClearSearch.classList.add('hidden');
    }
    fetchGames();
  });

  elements.searchInput.addEventListener('input', debouncedSearch);

  elements.btnClearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.btnClearSearch.classList.add('hidden');
    state.filters.busca = '';
    fetchGames();
  });

  // Filtro por gênero
  elements.genreFilter.addEventListener('change', (e) => {
    state.filters.genero = e.target.value;
    fetchGames();
  });

  // Ordenação
  elements.sortSelect.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    fetchGames();
  });

  // Botão recarregar
  elements.btnReload.addEventListener('click', () => {
    fetchGames();
    checkApiHealth();
  });

  // Botão tentar novamente
  elements.btnRetry.addEventListener('click', () => {
    fetchGames();
    checkApiHealth();
  });

  // Botão limpar filtros
  elements.btnClearFilters.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.btnClearSearch.classList.add('hidden');
    elements.genreFilter.value = '';
    elements.sortSelect.value = 'recente';
    state.filters.busca = '';
    state.filters.genero = '';
    state.filters.sort = 'recente';
    fetchGames();
  });

  // Abertura e fechamento de modal de cadastro
  elements.btnOpenCreateModal.addEventListener('click', openCreateModal);
  elements.btnCloseModal.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);
  elements.gameModal.addEventListener('click', (e) => {
    if (e.target === elements.gameModal) closeModal();
  });

  // Preview em tempo real da foto no formulário
  elements.formFoto.addEventListener(
    'input',
    debounce((e) => updateImagePreview(e.target.value), 250)
  );

  // Submissão do formulário
  elements.gameForm.addEventListener('submit', handleFormSubmit);

  // Eventos de clique nos cards (delegação de eventos)
  elements.gamesGrid.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-card-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      openEditModal(id);
      return;
    }

    const deleteBtn = e.target.closest('.btn-card-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const name = deleteBtn.dataset.name || 'este aparelho';
      openDeleteModal(id, name);
      return;
    }
  });

  // Modal de Exclusão
  elements.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
  elements.btnConfirmDelete.addEventListener('click', handleConfirmDelete);
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  // Atalho de teclado ESC para fechar modais
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!elements.gameModal.classList.contains('hidden')) closeModal();
      if (!elements.deleteModal.classList.contains('hidden')) closeDeleteModal();
    }
  });
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkApiHealth();
  fetchGames();
});
