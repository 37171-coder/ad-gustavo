const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Rotas da coleção de aparelhos
router.get('/', gameController.listGames);
router.post('/', gameController.createGame);

// Rotas de aparelho específico por ID
router.get('/:id', gameController.getGameById);
router.put('/:id', gameController.updateGame);
router.delete('/:id', gameController.deleteGame);

module.exports = router;
