# 🎮 GameVault — Mini Sistema de Games

Aplicação web completa, moderna e responsiva para catálogo, cadastro, consulta, edição e exclusão de consoles e aparelhos gamer. Desenvolvida com backend desacoplado em Node.js/Express e MongoDB, preparada para deploy serverless na Vercel, e frontend dinâmico em HTML5, CSS3 e JavaScript Vanilla.

---

## 📋 Sumário
1. [Visão Geral e Funcionalidades](#-visão-geral-e-funcionalidades)
2. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Pré-requisitos](#-pré-requisitos)
5. [Instalação e Execução Local](#-instalação-e-execução-local)
6. [Configuração do Banco de Dados (MongoDB)](#-configuração-do-banco-de-dados-mongodb)
7. [Execução dos Testes Automatizados](#-execução-dos-testes-automatizados)
8. [Publicação na Vercel (Deploy)](#-publicação-na-vercel-deploy)
9. [Segurança e Boas Práticas](#-segurança-e-boas-práticas)
10. [Documentação Complementar](#-documentação-complementar)

---

## 🚀 Visão Geral e Funcionalidades

### Backend (API REST)
- **CRUD Completo:** Listagem (`GET /api/games`), busca por ID (`GET /api/games/:id`), cadastro (`POST /api/games`), atualização (`PUT /api/games/:id`) e exclusão (`DELETE /api/games/:id`).
- **Verificação de Integridade:** Endpoint `GET /api/health` para monitorar disponibilidade da aplicação e status da conexão com o banco.
- **Busca, Filtros e Ordenação:** Suporte na listagem a parâmetros `busca`, `genero`, `marca` e `sort` (por preço e por ano).
- **Validação Rigorosa:** Verificação de tipos, intervalos plausíveis (ano entre 1958 e o futuro próximo), URLs válidas de imagens e preços não negativos.
- **Tratamento Centralizado de Erros:** Respostas JSON consistentes, sem exposição de stack traces ou segredos.
- **Pronto para Serverless:** Suporte a execução tradicional com `app.listen()` ou Serverless Functions na Vercel através de `backend/api/index.js` com cache de conexão Mongoose.

### Frontend (SPA Vanilla)
- **Tema Gamer Moderno:** Interface escura com acentos em ciano neon e violeta, contraste acessível e animações suaves.
- **Catálogo Interativo:** Cards com foto em proporção consistente, badge de gênero, marca, modelo, ano e preço formatado em Real brasileiro (`Intl.NumberFormat`).
- **Tratamento de Imagens Quebradas:** Fallback automático com placeholder gamer caso a URL da imagem esteja inacessível.
- **Busca em Tempo Real:** Campo com *debounce* para pesquisar por modelo, marca ou gênero sem sobrecarregar a API.
- **Filtros e Ordenação:** Filtre por categoria (Console de Mesa, Portátil, Retrô, etc.) e ordene por preço ou ano.
- **Cadastro e Edição em Modal:** Formulário com validações visuais no cliente e pré-visualização da imagem em tempo real.
- **Exclusão Segura:** Modal de confirmação antes de remover qualquer item do catálogo.
- **Indicador de Conexão:** Badge em tempo real indicando se a API está conectada ou offline.
- **Responsividade Total:** Adaptado para smartphones, tablets e computadores desktop.

---

## 🛠 Tecnologias Utilizadas

| Camada | Ferramenta / Biblioteca | Descrição |
|---|---|---|
| **Runtime** | Node.js (v22+) | Ambiente de execução JavaScript |
| **Backend** | Express.js (v4.21+) | Framework HTTP minimalista para APIs REST |
| **Banco de Dados** | MongoDB & Mongoose (v8.9+) | Banco NoSQL orientado a documentos e ODM |
| **Testes** | Jest & Supertest | Suíte de testes automatizados e asserções HTTP |
| **Testes Isolados** | MongoMemoryServer | Instância real em memória do MongoDB para testes sem mock |
| **Frontend** | HTML5, CSS3, JS puro | Interface sem dependência de frameworks pesados |
| **Deploy** | Vercel | Hospedagem Serverless do backend e estáticos do frontend |

---

## 📂 Estrutura do Projeto

```text
ad-gustavo/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # Conexão Mongoose com cache serverless
│   │   ├── models/
│   │   │   └── Game.js          # Schema Mongoose com validações rigorosas
│   │   ├── controllers/
│   │   │   └── gameController.js# Lógica de controle e sanitização
│   │   ├── routes/
│   │   │   └── gameRoutes.js    # Definição dos endpoints REST
│   │   ├── middleware/
│   │   │   └── errorHandler.js  # Tratamento centralizado de erros e 404
│   │   ├── app.js               # Configuração Express e middlewares
│   │   └── server.js            # Ponto de entrada local (app.listen)
│   ├── api/
│   │   └── index.js             # Ponto de entrada Serverless para a Vercel
│   ├── tests/
│   │   └── games.test.js        # 26 testes automatizados completos
│   ├── package.json             # Scripts e dependências do backend
│   ├── .env.example             # Modelo ilustrativo de variáveis de ambiente
│   └── vercel.json              # Configuração de roteamento da Vercel
├── frontend/
│   ├── index.html               # Estrutura semântica da aplicação
│   ├── css/
│   │   └── style.css            # Folha de estilos gamer e responsiva
│   ├── js/
│   │   └── app.js               # Lógica de consumo da API, modais e estado
│   └── assets/                  # Recursos e imagens estáticas locais
├── Roadmap.md                   # Registro de progresso de cada etapa
├── Contexto.md                  # Memória operacional técnica atualizada
├── api.md                       # Especificação detalhada da API REST
├── .gitignore                   # Arquivos ignorados pelo controle de versão
└── README.md                    # Este manual de instruções
```

---

## ⚙️ Pré-requisitos

- **Node.js:** Versão 18.x ou superior (testado e homologado no Node v22.14.0).
- **npm:** Versão 9.x ou superior (testado com npm 10.9.2).
- **Conta no MongoDB Atlas** (ou instância MongoDB local) para execução em desenvolvimento com persistência contínua.

---

## 💻 Instalação e Execução Local

### 1. Clonar ou navegar até a pasta do projeto:
```bash
cd ad-gustavo
```

### 2. Instalar as dependências do backend:
```bash
cd backend
npm install
```

### 3. Configurar as variáveis de ambiente:
Copie o arquivo de exemplo para criar o seu `.env`:
```bash
cp .env.example .env
```
Edite o arquivo `.env` e preencha a sua string de conexão:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<usuario>:<senha>@cluster0.mongodb.net/gamesvault?retryWrites=true&w=majority
ALLOWED_ORIGIN=*
```

### 4. Iniciar o servidor backend:
```bash
# Modo de produção/execução padrão:
npm start

# Ou modo de desenvolvimento com recarregamento automático (Node --watch):
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

### 5. Executar o Frontend:
- **Opção A (Unificada):** Como o backend está configurado para servir os arquivos estáticos da pasta `frontend/`, basta acessar no seu navegador:  
  👉 **`http://localhost:3000`**
- **Opção B (Desacoplada):** Você pode abrir o arquivo `frontend/index.html` via Live Server no VS Code (`http://localhost:5500`) ou com qualquer servidor estático HTTP. O frontend detectará automaticamente a API e o CORS configurado permitirá a comunicação.

---

## 🗄 Configuração do Banco de Dados (MongoDB)

Para utilizar o MongoDB Atlas em nuvem:

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) e crie uma conta gratuita (Cluster M0).
2. Em **Database Access**, crie um usuário de banco com senha segura e atribua a permissão `readWriteAnyDatabase`.
3. Em **Network Access**, adicione a regra de IP para liberar o acesso:
   - Para ambiente de desenvolvimento ou Serverless na Vercel: adicione `0.0.0.0/0` (Allow access from anywhere).
4. Em **Databases**, clique em **Connect** > **Drivers** (Node.js) e copie a string de conexão:
   ```text
   mongodb+srv://<usuario>:<senha>@cluster0.exemplo.mongodb.net/gamesvault?retryWrites=true&w=majority
   ```
5. Substitua `<usuario>` e `<senha>` pelas credenciais reais e insira na variável `MONGODB_URI` no arquivo `.env` ou no painel da Vercel.

---

## 🧪 Execução dos Testes Automatizados

A suíte de testes utiliza **Jest**, **Supertest** e **MongoMemoryServer** (uma instância real do MongoDB em memória). Isso significa que você pode rodar todos os testes de persistência real mesmo sem internet ou sem configurar o MongoDB Atlas previamente!

Para executar os testes:
```bash
cd backend
npm test
```

### Cobertura dos Testes:
- ✅ `GET /api/health` — integridade da aplicação e conectividade do banco
- ✅ `GET /api/games` — listagem vazia e preenchida, filtros de gênero e busca, ordenação
- ✅ `GET /api/games/:id` — busca com sucesso, erro 404 e erro 400 para ID malformado
- ✅ `POST /api/games` — cadastro válido, persistência no banco, rejeição de campos faltantes, preço negativo, ano fora da faixa (1958 a ano atual + 2), URL inválida
- ✅ `PUT /api/games/:id` — atualização válida com persistência, validação de campos inválidos, 404 e ID malformado
- ✅ `DELETE /api/games/:id` — exclusão confirmada e remoção do banco, 404 e ID malformado
- ✅ Casos de borda: rotas inexistentes (404 em JSON) e payloads com JSON malformado (400 em JSON)

**Resultado:** 26 testes aprovados com 100% de sucesso.

---

## 🌐 Publicação na Vercel (Deploy)

O projeto está estruturado para deploy simples e compatível com a arquitetura serverless da Vercel.

### Deploy do Backend:

1. Instale a CLI da Vercel (caso não possua):
   ```bash
   npm i -g vercel
   ```
2. Acesse a pasta `backend/`:
   ```bash
   cd backend
   ```
3. Execute o comando de deploy:
   ```bash
   vercel
   ```
4. No painel do seu projeto na Vercel (**Settings** > **Environment Variables**), adicione a variável de ambiente:
   - `MONGODB_URI`: String de conexão real do MongoDB Atlas.
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGIN`: URL do seu frontend publicado (ou `*` se for público).
5. Promova o deploy para produção:
   ```bash
   vercel --prod
   ```

A API estará disponível em: `https://seu-backend.vercel.app/api/games`.

### Deploy do Frontend:
O frontend pode ser publicado diretamente a partir da pasta `frontend/`:
1. Acesse a pasta `frontend/`:
   ```bash
   cd ../frontend
   vercel
   ```
2. Para que o frontend consuma a API publicada na Vercel em vez do `localhost`, você pode:
   - Abrir o console do navegador e definir `localStorage.setItem('GAMEVAULT_API_URL', 'https://seu-backend.vercel.app/api')`, ou
   - Configurar `window.API_BASE_URL = 'https://seu-backend.vercel.app/api'` diretamente antes do script `js/app.js` no `index.html`.

---

## 🔒 Segurança e Boas Práticas

- **Segredos protegidos:** Arquivos `.env` ignorados no `.gitignore`. Nenhuma credencial ou senha gravada no código versionado.
- **Sanitização de Dados:** Remoção de espaços em branco desnecessários com `.trim()`.
- **Validação de IDs:** Proteção contra CastErrors do MongoDB antes de executar consultas.
- **Erros Tratados:** Respostas sem vazamento de pilha de execução (*stack trace*) em ambiente de produção.
- **Reutilização de Conexões:** Estratégia de cache do Mongoose em ambiente serverless para evitar sobrecarga de conexões no cluster do MongoDB.

---

## 📚 Documentação Complementar

- [Roadmap.md](Roadmap.md) — Plano de execução, histórico de etapas e status das entregas.
- [Contexto.md](Contexto.md) — Memória operacional técnica, decisões arquiteturais e estado atual.
- [api.md](api.md) — Especificação técnica detalhada dos endpoints, contratos JSON e exemplos com `curl`.
