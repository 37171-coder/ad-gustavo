const mongoose = require('mongoose');
const Game = require('../models/Game');

/**
 * Valida se a string fornecida é um ObjectId válido do MongoDB.
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

/**
 * Sanitiza e remove campos proibidos ou não permitidos no corpo da requisição.
 */
function sanitizeGameInput(body) {
  const { genero, ano, marca, modelo, preco, foto } = body || {};
  return {
    genero: typeof genero === 'string' ? genero.trim() : genero,
    ano: typeof ano === 'string' && ano.trim() !== '' ? Number(ano) : ano,
    marca: typeof marca === 'string' ? marca.trim() : marca,
    modelo: typeof modelo === 'string' ? modelo.trim() : modelo,
    preco: typeof preco === 'string' && preco.trim() !== '' ? Number(preco) : preco,
    foto: typeof foto === 'string' ? foto.trim() : foto,
  };
}

/**
 * GET /api/games
 * Lista todos os aparelhos cadastrados com suporte a busca, filtros e ordenação.
 */
async function listGames(req, res, next) {
  try {
    const { genero, marca, busca, sort } = req.query;
    const filter = {};

    if (genero && typeof genero === 'string' && genero.trim() !== '') {
      filter.genero = new RegExp(`^${genero.trim()}$`, 'i');
    }

    if (marca && typeof marca === 'string' && marca.trim() !== '') {
      filter.marca = new RegExp(`^${marca.trim()}$`, 'i');
    }

    if (busca && typeof busca === 'string' && busca.trim() !== '') {
      const term = busca.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [{ modelo: regex }, { marca: regex }, { genero: regex }];
    }

    // Configuração de ordenação segura
    let sortOptions = { createdAt: -1 }; // Padrão: mais recentes primeiro
    if (sort) {
      const allowedSorts = {
        'preco-asc': { preco: 1 },
        'preco-desc': { preco: -1 },
        'ano-asc': { ano: 1 },
        'ano-desc': { ano: -1 },
        'recente': { createdAt: -1 },
        'antigo': { createdAt: 1 },
      };
      if (allowedSorts[sort]) {
        sortOptions = allowedSorts[sort];
      }
    }

    const games = await Game.find(filter).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/games/:id
 * Busca um aparelho pelo ID do MongoDB.
 */
async function getGameById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador inválido.',
        errors: [`O ID "${id}" fornecido não possui o formato de um ObjectId válido do MongoDB.`],
      });
    }

    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Aparelho não encontrado.',
        errors: [`Nenhum aparelho foi encontrado com o ID "${id}".`],
      });
    }

    return res.status(200).json({
      success: true,
      data: game,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/games
 * Cadastra um novo aparelho gamer.
 */
async function createGame(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Corpo da requisição vazio.',
        errors: ['É necessário enviar os dados do aparelho no corpo da requisição.'],
      });
    }

    const sanitizedData = sanitizeGameInput(req.body);
    const newGame = new Game(sanitizedData);
    const savedGame = await newGame.save();

    return res.status(201).json({
      success: true,
      message: 'Aparelho cadastrado com sucesso.',
      data: savedGame,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/games/:id
 * Atualiza um aparelho existente.
 */
async function updateGame(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador inválido.',
        errors: [`O ID "${id}" fornecido não possui o formato de um ObjectId válido do MongoDB.`],
      });
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Corpo da requisição vazio.',
        errors: ['É necessário enviar ao menos um campo para atualização.'],
      });
    }

    const sanitizedData = sanitizeGameInput(req.body);

    const updatedGame = await Game.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedGame) {
      return res.status(404).json({
        success: false,
        message: 'Aparelho não encontrado para atualização.',
        errors: [`Nenhum aparelho foi encontrado com o ID "${id}".`],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Aparelho atualizado com sucesso.',
      data: updatedGame,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/games/:id
 * Remove um aparelho do banco de dados.
 */
async function deleteGame(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador inválido.',
        errors: [`O ID "${id}" fornecido não possui o formato de um ObjectId válido do MongoDB.`],
      });
    }

    const deletedGame = await Game.findByIdAndDelete(id);

    if (!deletedGame) {
      return res.status(404).json({
        success: false,
        message: 'Aparelho não encontrado para exclusão.',
        errors: [`Nenhum aparelho foi encontrado com o ID "${id}".`],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Aparelho excluído com sucesso.',
      data: {
        id: deletedGame._id,
        modelo: deletedGame.modelo,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
};
