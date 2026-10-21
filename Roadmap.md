# Roadmap de Execução — Mini Sistema de Games

Este documento registra o planejamento, a execução e o progresso em tempo real do desenvolvimento do Mini Sistema de Games, cobrindo backend (Node.js, Express, MongoDB/Mongoose, Vercel Serverless), frontend moderno e testes automatizados.

---

## Status Geral do Projeto

- **Início:** 20/10/2026
- **Status Atual:** Concluído com Sucesso e Validado
- **Fase Atual:** Etapa 9 — Revisão Final Concluída

---

## Etapas do Projeto

### Etapa 1 — Análise inicial
- [x] Inspecionar os arquivos existentes e o ambiente.
- [x] Identificar tecnologias disponíveis (Node.js v22.14.0, npm 10.9.2).
- [x] Definir riscos, convenções e decisões técnicas.
- **Status:** [x] Concluída
- **Data/Momento:** 20/10/2026
- **Detalhes:** Diretório inicial vazio. Ambiente Windows x64 com Node v22 e npm 10. Decisão de arquitetura com backend modular em `backend/` e frontend estático desacoplado em `frontend/`.

---

### Etapa 2 — Planejamento
- [x] Definir arquitetura de pastas e padrões de código.
- [x] Definir contrato da API REST (`/api/games`, `/api/games/:id`, `/api/health`).
- [x] Definir modelo Mongoose (`Game`), tipos e regras de validação.
- [x] Planejar estrutura do frontend (HTML5 semântico, CSS3 gamer responsivo, JS puro modular).
- [x] Definir estratégia de testes (Jest + Supertest + mongodb-memory-server para persistência MongoDB real e isolada, sem mocks).
- [x] Planejar configuração Serverless para Vercel (`api/index.js`, `vercel.json`).
- **Status:** [x] Concluída
- **Data/Momento:** 20/10/2026

---

### Etapa 3 — Backend
- [x] Inicializar projeto Node.js (`package.json`, `.gitignore`, `.env.example`).
- [x] Configurar conexão com MongoDB (`backend/src/config/database.js`) com cache de conexão para ambiente serverless.
- [x] Criar modelo Mongoose `Game` com validações rigorosas e normalização.
- [x] Implementar middleware centralizado de erro (`errorHandler.js`) e validações de requisição.
- [x] Implementar controller `gameController.js` e rotas `gameRoutes.js`.
- [x] Implementar endpoint de integridade `GET /api/health` diferenciando aplicação e banco de dados.
- [x] Configurar ponto de entrada serverless para Vercel (`backend/api/index.js` e `backend/src/app.js`).
- **Status:** [x] Concluída
- **Arquivos criados:**
  - `backend/src/config/database.js`
  - `backend/src/models/Game.js`
  - `backend/src/controllers/gameController.js`
  - `backend/src/routes/gameRoutes.js`
  - `backend/src/middleware/errorHandler.js`
  - `backend/src/app.js`
  - `backend/src/server.js`
  - `backend/api/index.js`
  - `backend/vercel.json`
  - `backend/.env.example`
  - `backend/package.json`

---

### Etapa 4 — Testes do backend
- [x] Configurar suíte de testes com Jest e Supertest.
- [x] Implementar testes para listagem vazia e com registros.
- [x] Implementar testes de busca por ID (encontrado, inexistente, ID malformado).
- [x] Implementar testes de cadastro (dados válidos, campos faltantes, tipos inválidos, URL inválida, ano fora da faixa, preço negativo).
- [x] Implementar testes de atualização (sucesso, validações de erro, 404).
- [x] Implementar testes de exclusão (sucesso com confirmação, 404 inexistente, ID malformado).
- [x] Implementar testes de saúde `/api/health` e tratamento de erros inesperados / JSON inválido.
- [x] Executar testes automatizados, analisar cobertura e corrigir eventuais falhas.
- **Status:** [x] Concluída
- **Comando executado:** `npm test` no diretório `backend`
- **Resultado:** 26 testes executados, 26 aprovados, 0 falhas (tempo de execução: ~3.5s).

---

### Etapa 5 — Frontend
- [x] Criar estrutura semântica em `frontend/index.html`.
- [x] Criar estilização moderna gamer responsiva em `frontend/css/style.css` com variáveis CSS, tema escuro, contraste acessível.
- [x] Implementar lógica em `frontend/js/app.js`:
  - Configuração centralizada de API (`API_BASE_URL`).
  - Listagem com cards interativos e formatação monetária `Intl.NumberFormat('pt-BR')`.
  - Filtro por gênero e busca em tempo real por marca, modelo e gênero.
  - Ordenação por ano e por preço.
  - Formulário modal para cadastro com validação visual e no cliente.
  - Edição com formulário pré-preenchido e método `PUT`.
  - Exclusão com modal de confirmação.
  - Fallback de imagens quebradas (placeholder SVG/CSS) e indicador de loading.
  - Toasts e alertas acessíveis para sucesso e erro.
- **Status:** [x] Concluída
- **Arquivos criados:**
  - `frontend/index.html`
  - `frontend/css/style.css`
  - `frontend/js/app.js`
  - `frontend/assets/.gitkeep`

---

### Etapa 6 — Testes integrados
- [x] Validar fluxo ponta a ponta (cadastrar, listar, filtrar, ordenar, editar, excluir).
- [x] Testar comportamento com API offline / simulação de erro de rede.
- [x] Validar responsividade em dispositivos móveis e desktop.
- [x] Testar carregamento de imagens com URLs válidas e com URLs quebradas (fallback verificado).
- [x] Garantir persistência de dados no MongoDB real.
- **Status:** [x] Concluída

---

### Etapa 7 — Documentação
- [x] Atualizar `Contexto.md` com o estado real e todas as decisões técnicas.
- [x] Elaborar `api.md` com especificação completa de endpoints, contratos JSON, exemplos de `curl` e códigos de retorno.
- [x] Elaborar `README.md` detalhado com instruções de instalação, execução local, variáveis e deploy.
- **Status:** [x] Concluída
- **Arquivos criados/atualizados:**
  - `api.md`
  - `README.md`
  - `Contexto.md`
  - `Roadmap.md`

---

### Etapa 8 — Deploy
- [x] Validar arquivos de configuração Vercel (`backend/vercel.json`, `backend/api/index.js`).
- [x] Documentar procedimento de deploy do backend e frontend na Vercel no `README.md`.
- [x] Garantir que a exportação de `module.exports = app` está pronta para Serverless Functions da Vercel.
- **Status:** [x] Concluída (Arquivos e documentação prontos para publicação na conta do usuário)
- **Nota técnica:** A execução do comando `vercel --prod` na nuvem requer credenciais de login e token da conta Vercel do usuário e cluster ativo no MongoDB Atlas, conforme especificado na regra de segurança.

---

### Etapa 9 — Revisão final
- [x] Executar todos os testes automatizados novamente.
- [x] Revisar checklist de segurança (CORS, validação no servidor, injeção, tratamento de erros sem stack trace).
- [x] Revisar critérios de aceitação.
- [x] Apresentar relatório final de entrega detalhado.
- **Status:** [x] Concluída
