# Documentação da API REST — GameVault

Esta documentação detalha a arquitetura, as rotas, os cabeçalhos, os corpos de requisição e resposta e as convenções da API REST do **Mini Sistema de Games (GameVault)**.

---

## 1. Visão Geral

- **Objetivo:** Fornecer operações CRUD completas para consulta, cadastro, atualização e exclusão de aparelhos gamer (consoles, portáteis, acessórios).
- **Tecnologias:** Node.js, Express.js, MongoDB (Mongoose ODM).
- **URL-base Local:** `http://localhost:3000/api`
- **URL-base de Produção (Vercel):** `https://seu-projeto.vercel.app/api`
- **Formato dos Dados:** `application/json` com codificação UTF-8.

---

## 2. Padrões de Resposta

Todas as respostas da API seguem uma estrutura JSON padronizada e previsível:

### Resposta de Sucesso
```json
{
  "success": true,
  "message": "Mensagem descritiva (opcional)",
  "data": { ... } // ou array [ ... ]
}
```

### Resposta de Erro
```json
{
  "success": false,
  "message": "Descrição amigável do erro ocorrido",
  "errors": [
    "Detalhe específico da validação ou regra violada"
  ]
}
```

---

## 3. Segurança, CORS e Cabeçalhos

- **Content-Type:** Obrigatório enviar `Content-Type: application/json` em requisições `POST` e `PUT`.
- **CORS:** Configurado para aceitar requisições de origens autorizadas (especificadas na variável `ALLOWED_ORIGIN`) ou em desenvolvimento local.
- **Proteção:** Cabeçalho `X-Powered-By` desativado no Express. Payload limitado a 1 MB para prevenção contra negação de serviço.
- **Aviso sobre Endpoints Públicos de Escrita:** Nesta versão inicial para fins de estudo, os endpoints de escrita (`POST`, `PUT`, `DELETE`) são públicos. Em um ambiente de produção real com usuários, recomenda-se adicionar autenticação (JWT / OAuth2), controle de autorização baseado em papéis (RBAC) e limitação de taxa de requisições (*rate limiting*).

---

## 4. Endpoints Disponíveis

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/health` | Verifica a integridade da aplicação e o estado da conexão MongoDB |
| `GET` | `/api/games` | Lista aparelhos com suporte a busca, filtros e ordenação |
| `GET` | `/api/games/:id` | Busca um aparelho específico pelo ID |
| `POST` | `/api/games` | Cadastra um novo aparelho gamer |
| `PUT` | `/api/games/:id` | Atualiza os dados de um aparelho existente |
| `DELETE` | `/api/games/:id` | Remove um aparelho do banco de dados |

---

## 5. Detalhamento dos Endpoints

### 5.1. GET /api/health
Verifica a disponibilidade da aplicação e o estado da conexão com o banco de dados.

- **Método:** `GET`
- **Parâmetros:** Nenhum
- **Códigos HTTP:**
  - `200 OK`: Aplicação operacional.

**Exemplo de Resposta:**
```json
{
  "success": true,
  "application": "online",
  "timestamp": "2026-10-20T18:00:00.000Z",
  "database": {
    "status": "connected",
    "connected": true
  },
  "environment": "development"
}
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:3000/api/health
```

---

### 5.2. GET /api/games
Lista todos os aparelhos cadastrados. Permite filtros combinados e ordenação flexível.

- **Método:** `GET`
- **Query Parameters (Opcionais):**
  - `busca`: Termo textual para busca abrangente em `marca`, `modelo` ou `genero` (ex: `busca=Sony`).
  - `genero`: Filtra por categoria exata (ex: `genero=Portátil`).
  - `marca`: Filtra por fabricante (ex: `marca=Nintendo`).
  - `sort`: Critério de ordenação:
    - `recente` (padrão): Mais recentes primeiro (`createdAt: -1`).
    - `antigo`: Mais antigos primeiro (`createdAt: 1`).
    - `preco-asc`: Preço crescente.
    - `preco-desc`: Preço decrescente.
    - `ano-desc`: Ano mais novo primeiro.
    - `ano-asc`: Ano clássico primeiro.

**Códigos HTTP:**
- `200 OK`: Listagem retornada com sucesso (array vazio quando não houver registros).

**Exemplo de Resposta:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "671569a71234567890abcdef",
      "genero": "Console de Mesa",
      "ano": 2020,
      "marca": "Sony",
      "modelo": "PlayStation 5",
      "preco": 3499.9,
      "foto": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
      "createdAt": "2026-10-20T18:00:00.000Z",
      "updatedAt": "2026-10-20T18:00:00.000Z"
    }
  ]
}
```

**Exemplo cURL:**
```bash
curl -X GET "http://localhost:3000/api/games?genero=Console%20de%20Mesa&sort=preco-asc"
```

---

### 5.3. GET /api/games/:id
Consulta um único aparelho a partir do seu identificador (`ObjectId`).

- **Método:** `GET`
- **Parâmetros de Rota:** `id` (Identificador hexadecimal de 24 caracteres do MongoDB).
- **Códigos HTTP:**
  - `200 OK`: Aparelho localizado.
  - `400 Bad Request`: Identificador malformado (não é um ObjectId válido).
  - `404 Not Found`: Aparelho não encontrado para o ID informado.

**Exemplo de Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": "671569a71234567890abcdef",
    "genero": "Console de Mesa",
    "ano": 2020,
    "marca": "Sony",
    "modelo": "PlayStation 5",
    "preco": 3499.9,
    "foto": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
    "createdAt": "2026-10-20T18:00:00.000Z",
    "updatedAt": "2026-10-20T18:00:00.000Z"
  }
}
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:3000/api/games/671569a71234567890abcdef
```

---

### 5.4. POST /api/games
Cadastra um novo aparelho gamer no acervo.

- **Método:** `POST`
- **Headers:** `Content-Type: application/json`
- **Corpo da Requisição (JSON):**
  - `genero` (String, obrigatório): Não vazio (ex: "Console de Mesa", "Portátil", "Retrô").
  - `ano` (Number, obrigatório): Inteiro compreendido entre 1958 e o ano corrente + 2.
  - `marca` (String, obrigatório): Não vazio (ex: "Sony", "Nintendo", "Microsoft").
  - `modelo` (String, obrigatório): Não vazio (ex: "PlayStation 5").
  - `preco` (Number, obrigatório): Finito e $\ge 0$.
  - `foto` (String, obrigatório): URL válida iniciando por `http://` ou `https://`.

**Exemplo de Payload:**
```json
{
  "genero": "Console de Mesa",
  "ano": 2020,
  "marca": "Sony",
  "modelo": "PlayStation 5",
  "preco": 3499.9,
  "foto": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
}
```

**Códigos HTTP:**
- `201 Created`: Aparelho cadastrado com sucesso.
- `400 Bad Request`: Violação de validação ou payload inválido.

**Exemplo de Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Aparelho cadastrado com sucesso.",
  "data": {
    "id": "671569a71234567890abcdef",
    "genero": "Console de Mesa",
    "ano": 2020,
    "marca": "Sony",
    "modelo": "PlayStation 5",
    "preco": 3499.9,
    "foto": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
    "createdAt": "2026-10-20T18:00:00.000Z",
    "updatedAt": "2026-10-20T18:00:00.000Z"
  }
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "genero": "Console de Mesa",
    "ano": 2020,
    "marca": "Sony",
    "modelo": "PlayStation 5",
    "preco": 3499.90,
    "foto": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
  }'
```

---

### 5.5. PUT /api/games/:id
Atualiza os dados de um aparelho existente.

- **Método:** `PUT`
- **Parâmetros de Rota:** `id` (Identificador MongoDB).
- **Headers:** `Content-Type: application/json`
- **Corpo da Requisição (JSON):** Um ou mais campos válidos do modelo.
- **Códigos HTTP:**
  - `200 OK`: Aparelho atualizado com sucesso.
  - `400 Bad Request`: Identificador inválido ou erro de validação nos campos.
  - `404 Not Found`: Aparelho não encontrado para o ID informado.

**Exemplo de Payload:**
```json
{
  "preco": 3199.00,
  "modelo": "PlayStation 5 Digital Edition"
}
```

**Exemplo cURL:**
```bash
curl -X PUT http://localhost:3000/api/games/671569a71234567890abcdef \
  -H "Content-Type: application/json" \
  -d '{
    "preco": 3199.00
  }'
```

---

### 5.6. DELETE /api/games/:id
Exclui um aparelho permanentemente do acervo.

- **Método:** `DELETE`
- **Parâmetros de Rota:** `id` (Identificador MongoDB).
- **Códigos HTTP:**
  - `200 OK`: Aparelho excluído com sucesso.
  - `400 Bad Request`: Identificador malformado.
  - `404 Not Found`: Aparelho não localizado no banco de dados.

**Exemplo de Resposta (200):**
```json
{
  "success": true,
  "message": "Aparelho excluído com sucesso.",
  "data": {
    "id": "671569a71234567890abcdef",
    "modelo": "PlayStation 5"
  }
}
```

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:3000/api/games/671569a71234567890abcdef
```

---

## 6. Tratamento de Erros e Códigos HTTP

A API utiliza códigos padrão da especificação HTTP:

- `200 OK`: Operação concluída com sucesso.
- `201 Created`: Novo recurso criado no banco.
- `400 Bad Request`: Erro de validação nos dados fornecidos, corpo JSON malformado ou ID com formato incorreto.
- `404 Not Found`: Endpoint inexistente ou recurso não localizado no banco.
- `500 Internal Server Error`: Erro inesperado capturado e tratado sem expor pilha de execução (*stack trace*).
- `503 Service Unavailable`: Falha na comunicação com o banco de dados MongoDB.
