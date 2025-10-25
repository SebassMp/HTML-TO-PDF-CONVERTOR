/**
 * Utilidades para validación y manejo de errores
 */

/**
 * Valida las variables de entorno requeridas para OAuth2
 * @returns {Object} - Resultado de la validación
 */
function validateEnvironmentVariables() {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'GOOGLE_DRIVE_FOLDER_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missing.length === 0,
    missing: missing,
    message: missing.length > 0 
      ? `Missing environment variables: ${missing.join(', ')}` 
      : 'All OAuth2 environment variables are configured'
  };
}

/**
 * Maneja errores de la API de forma consistente
 * @param {Error} error - Error a manejar
 * @param {Object} res - Objeto de respuesta de Next.js
 * @param {string} context - Contexto donde ocurrió el error
 */
function handleAPIError(error, res, context = 'API') {
  console.error(`${context} Error:`, error);

  // Determinar el código de estado basado en el tipo de error
  let statusCode = 500;
  let message = 'Internal server error';

  const errorMessage = error?.message || '';

  if (errorMessage.includes('HTML content cannot be empty')) {
    statusCode = 400;
    message = 'HTML content is required and cannot be empty';
  } else if (errorMessage.includes('PDF conversion failed')) {
    statusCode = 422;
    message = 'Failed to convert HTML to PDF';
  } else if (errorMessage.includes('Failed to upload to Google Drive')) {
    statusCode = 503;
    message = 'Failed to upload file to Google Drive';
  } else if (errorMessage.includes('Missing environment variables')) {
    statusCode = 500;
    message = 'Server configuration error';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      code: statusCode,
      timestamp: new Date().toISOString(),
      context: context
    }
  });
}

/**
 * Valida el contenido de la solicitud POST
 * @param {Object} body - Cuerpo de la solicitud
 * @returns {Object} - Resultado de la validación
 */
function validateRequestBody(body) {
  const errors = [];

  if (!body) {
    errors.push('Request body is required');
    return { isValid: false, errors };
  }

  if (!body.html || typeof body.html !== 'string') {
    errors.push('HTML content is required and must be a string');
  }

  if (body.html && body.html.trim().length === 0) {
    errors.push('HTML content cannot be empty');
  }

  if (body.html && body.html.length > 5 * 1024 * 1024) { // 5MB limit
    errors.push('HTML content is too large (max 5MB)');
  }

  // Validar opciones de PDF si se proporcionan
  if (body.pdfOptions && typeof body.pdfOptions !== 'object') {
    errors.push('PDF options must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Genera una respuesta exitosa estándar
 * @param {Object} data - Datos a incluir en la respuesta
 * @param {string} message - Mensaje de éxito
 * @returns {Object} - Objeto de respuesta
 */
function createSuccessResponse(data, message = 'Operation completed successfully') {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Sanitiza el contenido HTML básico (opcional)
 * @param {string} html - Contenido HTML a sanitizar
 * @returns {string} - HTML sanitizado
 */
function sanitizeHTML(html) {
  // Sanitización básica - en producción considera usar una librería como DOMPurify
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remover scripts
    .replace(/javascript:/gi, '') // Remover javascript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remover event handlers
}

/**
 * Genera logs estructurados para debugging
 * @param {string} level - Nivel del log (info, warn, error)
 * @param {string} message - Mensaje del log
 * @param {Object} metadata - Metadatos adicionales
 */
function logStructured(level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: message,
    ...metadata
  };

  console.log(JSON.stringify(logEntry));
}

/**
 * Detecta si un error está relacionado con tokens OAuth2
 * @param {Error} error - Error a analizar
 * @returns {boolean} - true si es un error de token
 */
function isTokenRelatedError(error) {
  const tokenErrorIndicators = [
    'invalid_grant',
    'token has been expired',
    'token expired',
    'invalid_token',
    'unauthorized',
    'authentication failed',
    'authentication',
    'oauth',
    'refresh_token'
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;

  return errorCode === 401 || 
         errorCode === 403 ||
         tokenErrorIndicators.some(indicator => errorMessage.includes(indicator.toLowerCase()));
}

/**
 * Formatea información de renovación de tokens para logs
 * @param {Object} tokenInfo - Información del token
 * @returns {Object} - Información formateada
 */
function formatTokenInfo(tokenInfo) {
  return {
    hasAccessToken: !!tokenInfo.access_token,
    expiryDate: tokenInfo.expiry_date ? new Date(tokenInfo.expiry_date).toISOString() : null,
    isExpired: tokenInfo.expiry_date ? Date.now() > tokenInfo.expiry_date : null,
    tokenType: tokenInfo.token_type || 'Bearer'
  };
}

/**
 * Calcula el tiempo hasta la expiración del token
 * @param {number} expiryDate - Fecha de expiración en timestamp
 * @returns {Object} - Información de tiempo restante
 */
function getTokenTimeRemaining(expiryDate) {
  if (!expiryDate) return { isValid: false, message: 'No expiry date' };
  
  const now = Date.now();
  const timeRemaining = expiryDate - now;
  
  if (timeRemaining <= 0) {
    return { isValid: false, message: 'Token expired', expiredSince: Math.abs(timeRemaining) };
  }
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    isValid: true,
    timeRemaining: timeRemaining,
    hours: hours,
    minutes: minutes,
    message: `${hours}h ${minutes}m remaining`
  };
}

/**
 * Genera un resumen del estado del sistema de renovación
 * @param {Object} renewalStats - Estadísticas de renovación
 * @returns {Object} - Resumen del estado
 */
function getRenewalSystemStatus(renewalStats) {
  return {
    isHealthy: renewalStats.renewalCount < 10, // Máximo 10 renovaciones por sesión
    lastRenewal: renewalStats.lastRenewal,
    renewalCount: renewalStats.renewalCount,
    status: renewalStats.renewalCount < 5 ? 'healthy' : 
            renewalStats.renewalCount < 10 ? 'warning' : 'critical'
  };
}

module.exports = {
  validateEnvironmentVariables,
  handleAPIError,
  validateRequestBody,
  createSuccessResponse,
  sanitizeHTML,
  logStructured,
  // Nuevas funciones para el sistema de renovación
  isTokenRelatedError,
  formatTokenInfo,
  getTokenTimeRemaining,
  getRenewalSystemStatus
};