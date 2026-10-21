const mongoose = require('mongoose');

// Limite histórico dos games: 1958 (ano de 'Tennis for Two', considerado o primeiro videogame interativo)
const MIN_ANO = 1958;
// Limite futuro: ano corrente + 2 anos (para permitir cadastros de lançamentos já anunciados)
const MAX_ANO = new Date().getFullYear() + 2;

// Expressão regular para validar URLs HTTP e HTTPS seguras e bem formadas
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const gameSchema = new mongoose.Schema(
  {
    genero: {
      type: String,
      required: [true, 'O campo "genero" é obrigatório.'],
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'O campo "genero" não pode ser vazio.',
      },
    },
    ano: {
      type: Number,
      required: [true, 'O campo "ano" é obrigatório.'],
      validate: [
        {
          validator: function (v) {
            return Number.isInteger(v);
          },
          message: 'O campo "ano" deve ser um número inteiro.',
        },
        {
          validator: function (v) {
            return v >= MIN_ANO && v <= MAX_ANO;
          },
          message: `O campo "ano" deve estar entre ${MIN_ANO} e ${MAX_ANO}.`,
        },
      ],
    },
    marca: {
      type: String,
      required: [true, 'O campo "marca" é obrigatório.'],
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'O campo "marca" não pode ser vazio.',
      },
    },
    modelo: {
      type: String,
      required: [true, 'O campo "modelo" é obrigatório.'],
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'O campo "modelo" não pode ser vazio.',
      },
    },
    preco: {
      type: Number,
      required: [true, 'O campo "preco" é obrigatório.'],
      validate: [
        {
          validator: function (v) {
            return typeof v === 'number' && Number.isFinite(v);
          },
          message: 'O campo "preco" deve ser um número finito.',
        },
        {
          validator: function (v) {
            return v >= 0;
          },
          message: 'O campo "preco" não pode ser negativo.',
        },
      ],
    },
    foto: {
      type: String,
      required: [true, 'O campo "foto" é obrigatório.'],
      trim: true,
      validate: {
        validator: function (v) {
          if (typeof v !== 'string' || v.trim().length === 0) return false;
          return URL_REGEX.test(v.trim());
        },
        message: 'O campo "foto" deve conter uma URL válida iniciada por http:// ou https://.',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índices para otimizar pesquisas e filtros comuns
gameSchema.index({ genero: 1, marca: 1, modelo: 1 });
gameSchema.index({ createdAt: -1 });

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
