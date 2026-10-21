/**
 * Middleware centralizado de tratamento de erros.
 * Garante respostas consistentes em JSON e protege informações sensíveis em produção.
 */
function errorHandler(err, req, res, next) {
  // Log de depuração apenas em ambiente de desenvolvimento/teste
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error('[ErrorHandler]:', err);
  }

  // 1. Erro de JSON malformado no corpo da requisição (body-parser do Express)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Corpo da requisição com formato JSON inválido.',
      errors: ['O JSON fornecido não pôde ser interpretado pelo servidor.'],
    });
  }

  // 2. Erros de validação do Mongoose (ValidationError)
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Falha na validação dos dados.',
      errors,
    });
  }

  // 3. Erros de CastError do Mongoose (ex: ObjectId inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Identificador ou valor inválido para o campo "${err.path}".`,
      errors: [`O valor "${err.value}" não é compatível com o tipo esperado.`],
    });
  }

  // 4. Erros operacionais customizados com status definido
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno no servidor.'
      : err.message || 'Erro interno no servidor.';

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [message],
  });
}

/**
 * Middleware para rotas não encontradas (404)
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `A rota "${req.method} ${req.originalUrl}" não foi encontrada nesta API.`,
    errors: ['Endpoint inexistente.'],
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
