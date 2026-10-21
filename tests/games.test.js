const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Game = require('../src/models/Game');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  // Inicializa uma instância real em memória do MongoDB para garantir isolamento e persistência autêntica
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Limpa a coleção antes de cada teste
  await Game.deleteMany({});
});

describe('=== Suíte de Testes da API GameVault ===', () => {
  const sampleGame = {
    genero: 'Console de Mesa',
    ano: 2020,
    marca: 'Sony',
    modelo: 'PlayStation 5',
    preco: 3499.9,
    foto: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db',
  };

  describe('GET /api/health', () => {
    it('deve retornar status 200 e indicar que o servidor e o banco estão operacionais', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.application).toBe('online');
      expect(res.body.database).toBeDefined();
      expect(res.body.database.connected).toBe(true);
      expect(res.body.database.status).toBe('connected');
    });
  });

  describe('GET /api/games (Listagem)', () => {
    it('deve retornar array vazio quando não houver registros cadastrados', async () => {
      const res = await request(app).get('/api/games');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('deve listar todos os aparelhos cadastrados', async () => {
      await Game.create(sampleGame);
      await Game.create({
        genero: 'Portátil',
        ano: 2017,
        marca: 'Nintendo',
        modelo: 'Switch',
        preco: 1899.0,
        foto: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9',
      });

      const res = await request(app).get('/api/games');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBeDefined();
      expect(res.body.data[0]._id).toBeUndefined(); // Verifica serialização toJSON
    });

    it('deve filtrar aparelhos por gênero', async () => {
      await Game.create(sampleGame);
      await Game.create({
        genero: 'Portátil',
        ano: 2017,
        marca: 'Nintendo',
        modelo: 'Switch',
        preco: 1899.0,
        foto: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9',
      });

      const res = await request(app).get('/api/games?genero=Portátil');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].modelo).toBe('Switch');
    });

    it('deve filtrar aparelhos por termo de busca abrangente', async () => {
      await Game.create(sampleGame);
      await Game.create({
        genero: 'Portátil',
        ano: 2017,
        marca: 'Nintendo',
        modelo: 'Switch',
        preco: 1899.0,
        foto: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9',
      });

      const res = await request(app).get('/api/games?busca=Sony');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].marca).toBe('Sony');
    });

    it('deve ordenar aparelhos por preço ascendente', async () => {
      await Game.create({ ...sampleGame, preco: 3000 });
      await Game.create({ ...sampleGame, modelo: 'Xbox One', preco: 1500 });

      const res = await request(app).get('/api/games?sort=preco-asc');

      expect(res.status).toBe(200);
      expect(res.body.data[0].preco).toBe(1500);
      expect(res.body.data[1].preco).toBe(3000);
    });
  });

  describe('GET /api/games/:id (Consulta por ID)', () => {
    it('deve retornar 200 e o aparelho correspondente quando existir', async () => {
      const created = await Game.create(sampleGame);

      const res = await request(app).get(`/api/games/${created._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(created._id.toString());
      expect(res.body.data.modelo).toBe(sampleGame.modelo);
    });

    it('deve retornar 404 quando o identificador for válido mas não existir', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/games/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Aparelho não encontrado');
    });

    it('deve retornar 400 quando o identificador for malformado', async () => {
      const res = await request(app).get('/api/games/id-invalido-123');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Identificador inválido');
    });
  });

  describe('POST /api/games (Cadastro)', () => {
    it('deve cadastrar um novo aparelho com sucesso e retornar 201', async () => {
      const res = await request(app).post('/api/games').send(sampleGame);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.modelo).toBe(sampleGame.modelo);
      expect(res.body.data.preco).toBe(sampleGame.preco);

      // Confirmação de persistência no banco real
      const persisted = await Game.findById(res.body.data.id);
      expect(persisted).not.toBeNull();
      expect(persisted.modelo).toBe(sampleGame.modelo);
    });

    it('deve retornar 400 se o corpo da requisição estiver vazio', async () => {
      const res = await request(app).post('/api/games').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 se campos obrigatórios estiverem ausentes', async () => {
      const res = await request(app).post('/api/games').send({
        marca: 'Sony',
        // genero, ano, modelo, preco e foto ausentes
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('deve retornar 400 se o preço for negativo', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({
          ...sampleGame,
          preco: -50,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.includes('não pode ser negativo'))).toBe(true);
    });

    it('deve retornar 400 se o ano for menor que o limite histórico (1958)', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({
          ...sampleGame,
          ano: 1950,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.includes('deve estar entre'))).toBe(true);
    });

    it('deve retornar 400 se o ano for maior que o limite futuro plausível', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({
          ...sampleGame,
          ano: 2099,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.includes('deve estar entre'))).toBe(true);
    });

    it('deve retornar 400 se o ano não for um número inteiro', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({
          ...sampleGame,
          ano: 2020.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.includes('inteiro'))).toBe(true);
    });

    it('deve retornar 400 se a foto não tiver uma URL válida com http/https', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({
          ...sampleGame,
          foto: 'imagem-sem-protocolo.png',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.includes('URL válida'))).toBe(true);
    });
  });

  describe('PUT /api/games/:id (Atualização)', () => {
    it('deve atualizar um aparelho existente e retornar 200', async () => {
      const created = await Game.create(sampleGame);

      const res = await request(app)
        .put(`/api/games/${created._id}`)
        .send({
          preco: 2999.0,
          modelo: 'PlayStation 5 Slim',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preco).toBe(2999.0);
      expect(res.body.data.modelo).toBe('PlayStation 5 Slim');

      // Confirmação de persistência no banco
      const persisted = await Game.findById(created._id);
      expect(persisted.preco).toBe(2999.0);
      expect(persisted.modelo).toBe('PlayStation 5 Slim');
    });

    it('deve retornar 400 ao tentar atualizar com dados inválidos', async () => {
      const created = await Game.create(sampleGame);

      const res = await request(app)
        .put(`/api/games/${created._id}`)
        .send({
          preco: -100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 404 ao tentar atualizar um aparelho inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/games/${nonExistentId}`)
        .send({
          preco: 2999.0,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 se o identificador for malformado', async () => {
      const res = await request(app)
        .put('/api/games/id-invalido')
        .send({ preco: 2999.0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/games/:id (Exclusão)', () => {
    it('deve excluir um aparelho existente com confirmação e retornar 200', async () => {
      const created = await Game.create(sampleGame);

      const res = await request(app).delete(`/api/games/${created._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('excluído com sucesso');

      // Confirma que não existe mais no banco
      const check = await Game.findById(created._id);
      expect(check).toBeNull();
    });

    it('deve retornar 404 ao tentar excluir um aparelho inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/games/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 ao tentar excluir com identificador malformado', async () => {
      const res = await request(app).delete('/api/games/id-invalido');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Tratamento de Erros e Casos de Borda', () => {
    it('deve retornar 404 amigável em JSON para rotas inexistentes', async () => {
      const res = await request(app).get('/api/rota-desconhecida');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('não foi encontrada');
    });

    it('deve retornar 400 amigável em JSON quando o payload contiver JSON malformado', async () => {
      const res = await request(app)
        .post('/api/games')
        .set('Content-Type', 'application/json')
        .send('{"genero": "Console", "ano": }'); // JSON com sintaxe propositalmente quebrada

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('formato JSON inválido');
    });
  });
});
