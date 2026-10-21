const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, memoryServer: null };
}

/**
 * Conecta ao banco de dados MongoDB.
 * Se MONGODB_URI estiver presente, conecta à URI indicada (ex: MongoDB Atlas).
 * Caso contrário, em ambiente local (development/test), inicializa uma instância real em memória do MongoDB
 * para permitir execução imediata sem exigir configuração prévia de servidor externo.
 */
async function connectDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  let uri = process.env.MONGODB_URI;

  // Se não houver URI definida e não for produção, sobe MongoDB em memória localmente
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('A variável de ambiente MONGODB_URI é obrigatória em ambiente de produção.');
    }

    if (!cached.memoryServer) {
      console.log('Nenhuma MONGODB_URI fornecida. Inicializando instância MongoDB local em memória...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      cached.memoryServer = await MongoMemoryServer.create();
      uri = cached.memoryServer.getUri();
      process.env.MONGODB_URI = uri;
      console.log('MongoDB local em memória inicializado e pronto.');
    } else {
      uri = cached.memoryServer.getUri();
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Retorna o estado atual da conexão Mongoose.
 */
function getDatabaseState() {
  const state = mongoose.connection.readyState;
  const statesMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    stateCode: state,
    status: statesMap[state] || 'unknown',
    isConnected: state === 1,
    isMemoryInstance: !!cached.memoryServer,
  };
}

module.exports = {
  connectDatabase,
  getDatabaseState,
};
