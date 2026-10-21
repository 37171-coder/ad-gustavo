require('dotenv').config();
const app = require('./app');
const { connectDatabase, getDatabaseState } = require('./config/database');
const { seedDatabaseIfEmpty } = require('./config/seedData');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    console.log('Inicializando GameVault Backend...');
    await connectDatabase();
    
    const dbState = getDatabaseState();
    console.log(`MongoDB status: ${dbState.status} (instância: ${dbState.isMemoryInstance ? 'memória local' : 'externa/Atlas'})`);

    // Popula com catálogo inicial se o banco estiver vazio
    await seedDatabaseIfEmpty();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🎮 GameVault Backend rodando em http://localhost:${PORT}`);
      console.log(`👉 Interface Web (Frontend): http://localhost:${PORT}`);
      console.log(`👉 Healthcheck:             http://localhost:${PORT}/api/health`);
      console.log(`👉 API REST:                http://localhost:${PORT}/api/games`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Falha crítica ao iniciar o servidor:', error);
    process.exit(1);
  }
}

bootstrap();
