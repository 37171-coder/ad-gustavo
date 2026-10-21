# Contexto Operacional — Mini Sistema de Games

**Última atualização:** 20/10/2026  
**Status do Projeto:** Concluído com Sucesso e Validado

---

## 1. Nome e Objetivo do Projeto
- **Nome:** Mini Sistema de Games (GameVault)
- **Objetivo:** Aplicação web full stack funcional para catálogo, cadastro, consulta, edição e exclusão de consoles e aparelhos gamer, com backend independente em Node.js/Express e MongoDB Mongoose, preparado para Vercel Serverless, e frontend desacoplado moderno em HTML5/CSS3/JS puro.

---

## 2. Tecnologias Utilizadas e Versões
- **Runtime:** Node.js v22.14.0 (Windows x64)
- **Gerenciador de Pacotes:** npm 10.9.2
- **Backend:** Express.js 4.21.2, Mongoose 8.9.5, dotenv 16.4.7, cors 2.8.5
- **Banco de Dados:** MongoDB (MongoDB Atlas para produção; MongoMemoryServer 10.1.3 para testes automatizados com persistência real em memória)
- **Frontend:** HTML5 semântico, CSS3 com variáveis customizadas e paleta gamer (dark mode, acentos neon ciano e violeta), JavaScript ES6+ puro (Fetch API, `Intl.NumberFormat`)
- **Testes:** Jest 29.7.0, Supertest 7.0.0, MongoMemoryServer 10.1.3
- **Deploy:** Vercel (Serverless Functions via `backend/api/index.js` e `backend/vercel.json`)

---

## 3. Arquitetura Atual
- **Padrão:** MVC desacoplado para API REST + Frontend SPA Vanilla estático
- **Comunicação:** JSON sobre HTTP/HTTPS
- **Isolamento de Diretórios:**
  - `backend/`: Código fonte, modelos, rotas, controladores, middleware e testes automatizados
  - `frontend/`: Arquivos estáticos (HTML, CSS, JS e Assets)
- **Compatibilidade Dual:** O backend inclui middleware estático para servir o frontend quando executado unificado em desenvolvimento local (`http://localhost:3000`), mas mantém o frontend 100% desacoplado para deploy independente na Vercel ou CDN.

---

## 4. Estrutura Real de Pastas
```text
ad-gustavo/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   └── Game.js
│   │   ├── controllers/
│   │   │   └── gameController.js
│   │   ├── routes/
│   │   │   └── gameRoutes.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── app.js
│   │   └── server.js
│   ├── api/
│   │   └── index.js
│   ├── tests/
│   │   └── games.test.js
│   ├── package.json
│   ├── .env.example
│   └── vercel.json
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── assets/
│       └── .gitkeep
├── Roadmap.md
├── Contexto.md
├── api.md
├── .gitignore
└── README.md
```

---

## 5. Modelo de Dados e Validações
O documento `Game` é modelado com os seguintes atributos:
- `genero`: String, obrigatório, trim, não vazio (ex: "Console de Mesa", "Portátil", "Retrô").
- `ano`: Number, obrigatório, inteiro, compreendido na faixa plausível [1958, ano_atual + 2]. 1958 marca a criação do primeiro jogo interativo (*Tennis for Two*); o limite superior acomoda lançamentos com prévia anunciada.
- `marca`: String, obrigatório, trim, não vazio (ex: "Sony", "Microsoft", "Nintendo").
- `modelo`: String, obrigatório, trim, não vazio (ex: "PlayStation 5", "Nintendo Switch").
- `preco`: Number, obrigatório, finito, $\ge 0$.
- `foto`: String, obrigatório, URL HTTP ou HTTPS válida validada via regex.
- `timestamps`: `createdAt` e `updatedAt` automáticos via Mongoose.
- `toJSON`: `transform` converte `_id` para `id` e remove `__v` na serialização.

---

## 6. Endpoints Implementados
- `GET /api/health`: Verifica status da aplicação (`online`) e conexão com o banco (`connected` | `disconnected`).
- `GET /api/games`: Lista todos os aparelhos com suporte a busca (`busca`), filtros (`genero`, `marca`) e ordenação (`sort`).
- `GET /api/games/:id`: Busca por ObjectId (200 com item, 400 ID inválido, 404 não encontrado).
- `POST /api/games`: Cadastro com validação completa (201 criado, 400 dados inválidos).
- `PUT /api/games/:id`: Atualização com validação completa (200 atualizado, 400 dados inválidos, 404 não encontrado).
- `DELETE /api/games/:id`: Exclusão confirmada (200 excluído, 400 ID inválido, 404 não encontrado).

---

## 7. Variáveis de Ambiente Necessárias
- `PORT`: Porta do servidor HTTP local (padrão: 3000).
- `NODE_ENV`: Ambiente de execução (`development`, `production`, `test`).
- `MONGODB_URI`: String de conexão MongoDB Atlas (`mongodb+srv://...`).
- `ALLOWED_ORIGIN`: Origens autorizadas para CORS (ex: `http://localhost:3000,http://127.0.0.1:5500,https://seu-frontend.vercel.app` ou `*`).

---

## 8. Testes Executados e Resultados
- **Ferramentas:** Jest + Supertest + MongoMemoryServer
- **Arquivo de Testes:** `backend/tests/games.test.js`
- **Total de Testes:** 26
- **Testes Aprovados:** 26 (100% de sucesso)
- **Falhas:** 0
- **Destaques dos Testes:**
  - Validação de CRUD completo com persistência em banco MongoDB real
  - Validação de regras de negócio (ano fora do limite, preço negativo, ausência de campos, URL de foto inválida)
  - Validação de segurança (IDs malformados retornam 400, rotas desconhecidas retornam 404 em JSON, JSON quebrado retorna 400 em JSON amigável)

---

## 9. Decisões Técnicas Consolidadas
1. **Cache de Conexão Mongoose em Serverless:** Implementado em `backend/src/config/database.js` para reaproveitar conexões Mongoose entre invocações das Serverless Functions da Vercel.
2. **Uso do MongoMemoryServer nos Testes:** Permite executar toda a suíte de testes de persistência real sem exigir banco de dados externo ou conexão com a internet, garantindo reprodutibilidade em qualquer ambiente.
3. **Frontend Desacoplado com Detecção Inteligente:** O frontend em JavaScript Vanilla detecta automaticamente a URL da API (mesma origem, porta 3000, `window.API_BASE_URL` ou `localStorage.getItem('GAMEVAULT_API_URL')`), permitindo desenvolvimento local e publicação na nuvem sem necessidade de recompilação.
4. **Resiliência Visual:** Tratamento de erro de carregamento de fotos com placeholder SVG gamer caso a imagem externa fornecida na URL não esteja disponível.

---

## 10. Status da Execução em Tempo Real
- **Servidor Ativo:** Sim, rodando na porta `3000` (PID em execução como Daemon).
- **Acesso Unificado ao Frontend:** [http://localhost:3000](http://localhost:3000)
- **Healthcheck Validado:** [http://localhost:3000/api/health](http://localhost:3000/api/health) (Status: `application: online`, `database: connected`).
- **Banco de Dados em Desenvolvimento:** Inicialização automática de MongoDB em memória real com catálogo de 5 aparelhos gamers populares (PlayStation 5, Xbox Series X, Nintendo Switch OLED, Steam Deck, SNES), permitindo que a aplicação rode sem exigir configuração de credenciais prévias do Atlas.

---

## 11. Próxima Ação Recomendada
O servidor já está ativo e operando. Basta abrir o navegador em [http://localhost:3000](http://localhost:3000) para utilizar a interface web completa.
