const Game = require('../models/Game');

const INITIAL_GAMES = [
  {
    genero: 'Console de Mesa',
    ano: 2020,
    marca: 'Sony',
    modelo: 'PlayStation 5',
    preco: 3699.9,
    foto: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
  },
  {
    genero: 'Console de Mesa',
    ano: 2020,
    marca: 'Microsoft',
    modelo: 'Xbox Series X',
    preco: 3899.0,
    foto: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=800&q=80',
  },
  {
    genero: 'Portátil',
    ano: 2021,
    marca: 'Nintendo',
    modelo: 'Switch OLED',
    preco: 2199.0,
    foto: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80',
  },
  {
    genero: 'Portátil',
    ano: 2022,
    marca: 'Valve',
    modelo: 'Steam Deck',
    preco: 3499.0,
    foto: 'https://images.unsplash.com/photo-1612287233207-6e691238d7c2?auto=format&fit=crop&w=800&q=80',
  },
  {
    genero: 'Retrô',
    ano: 1990,
    marca: 'Nintendo',
    modelo: 'Super Nintendo (SNES)',
    preco: 850.0,
    foto: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  },
];

async function seedDatabaseIfEmpty() {
  try {
    const count = await Game.countDocuments();
    if (count === 0) {
      console.log('Populando banco de dados com acervo gamer inicial...');
      await Game.insertMany(INITIAL_GAMES);
      console.log(`Catálogo inicial carregado: ${INITIAL_GAMES.length} aparelhos cadastrados.`);
    }
  } catch (error) {
    console.warn('Aviso ao popular catálogo inicial:', error.message);
  }
}

module.exports = {
  INITIAL_GAMES,
  seedDatabaseIfEmpty,
};
