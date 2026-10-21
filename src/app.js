const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDatabase, getDatabaseState } = require('./config/database');
const gameRoutes = require('./routes/gameRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Segurança: remover identificação do Express
app.disable('x-powered-by');

// Configuração de CORS flexível e segura
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem origin (como mobile apps, curl, postman ou mesma origem)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origem não permitida pela política de CORS.'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parser de JSON com limite seguro de payload
app.use(express.json({ limit: '1mb' }));

// Servir frontend estático opcionalmente para execução local unificada
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Middleware para garantir conexão com MongoDB antes de atender as requisições em ambiente Serverless
app.use(async (req, res, next) => {
  // O endpoint de healthcheck e rotas estáticas não bloqueiam se não houver banco
  if (req.path === '/api/health' || req.path === '/api' || !req.path.startsWith('/api')) {
    return next();
  }

  // Se não houver MONGODB_URI definida em produção (Vercel)
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    return res.status(503).json({
      success: false,
      message: 'Banco de dados não configurado na Vercel.',
      errors: [
        'A variável de ambiente MONGODB_URI não foi definida no painel da Vercel.',
        'Acesse as configurações do seu projeto na Vercel (Settings > Environment Variables) e cadastre a variável MONGODB_URI com a string de conexão do seu MongoDB Atlas.',
      ],
    });
  }

  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error('[Database Middleware]: Erro ao conectar ao MongoDB:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Falha na conexão com o banco de dados MongoDB.',
      errors: [
        error.message || 'Não foi possível estabelecer comunicação com o MongoDB.',
        'Verifique se a MONGODB_URI está correta e se o IP 0.0.0.0/0 está liberado no Network Access do MongoDB Atlas.',
      ],
    });
  }
});

// Endpoint de saúde do sistema e do banco
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseState();
  const hasUri = !!process.env.MONGODB_URI;

  return res.status(200).json({
    success: true,
    application: 'online',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus.status,
      connected: dbStatus.isConnected,
      configured: hasUri,
      message: dbStatus.isConnected
        ? 'Banco de dados conectado com sucesso.'
        : hasUri
        ? 'Tentando conectar ao banco de dados...'
        : 'Variável MONGODB_URI não configurada.',
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rotas da API de Games
app.use('/api/games', gameRoutes);

// Rota amigável da API de informações se acessado /api diretamente
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API do Mini Sistema de Games (GameVault) operacional.',
    endpoints: {
      games: '/api/games',
      health: '/api/health',
    },
  });
});

// Middleware 404 para rotas de API inexistentes
app.use('/api', notFoundHandler);

// Fallback para SPA no frontend se a rota não começar com /api
app.get('*', (req, res, next) => {
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

module.exports = app;
