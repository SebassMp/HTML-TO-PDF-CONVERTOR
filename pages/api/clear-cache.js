const { 
  validateEnvironmentVariables, 
  handleAPIError, 
  createSuccessResponse,
  logStructured 
} = require('../../lib/utils');
const { clearAllCache, getCacheStats } = require('../../lib/globalMetricsStore');

/**
 * API Route: /api/clear-cache
 * Limpia el caché del sistema usando store global
 * 
 * Método: POST
 */
async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed. Use POST.',
        code: 405
      }
    });
  }

  try {
    logStructured('info', 'Cache clear request received', {
      method: req.method,
      userAgent: req.headers['user-agent'],
      clientIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    });

    // Validar variables de entorno (opcional para clear-cache)
    const envValidation = validateEnvironmentVariables();
    
    // Obtener estadísticas antes de limpiar
    const statsBefore = getCacheStats();
    
    logStructured('info', 'Cache stats before clearing', {
      itemsBeforeClear: statsBefore.totalItems,
      templatesBeforeClear: statsBefore.templateItems,
      memoryBefore: statsBefore.memoryUsage.heapUsed,
      timestamp: new Date().toISOString()
    });

    // Limpiar el caché usando el store global
    const cleanupResult = clearAllCache();
    
    // Obtener estadísticas después de limpiar
    const statsAfter = getCacheStats();
    
    logStructured('info', 'Cache cleared successfully', {
      clearedItems: cleanupResult.totalCleaned,
      facturasCleaned: cleanupResult.facturasCleaned,
      templatesCleaned: cleanupResult.templatesCleaned,
      memoryAfter: statsAfter.memoryUsage.heapUsed,
      memoryFreed: statsBefore.memoryUsage.heapUsed - statsAfter.memoryUsage.heapUsed,
      timestamp: new Date().toISOString()
    });

    const responseData = {
      clearedItems: cleanupResult.totalCleaned,
      facturasCleaned: cleanupResult.facturasCleaned,
      templatesCleaned: cleanupResult.templatesCleaned,
      memoryFreed: statsBefore.memoryUsage.heapUsed - statsAfter.memoryUsage.heapUsed,
      timestamp: cleanupResult.timestamp,
      environment: {
        configValid: envValidation.isValid,
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    return res.status(200).json(createSuccessResponse(
      responseData,
      `Cache cleared successfully. ${cleanupResult.totalCleaned} items removed.`
    ));

  } catch (error) {
    logStructured('error', 'Error clearing cache', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return handleAPIError(error, res, 'Clear Cache');
  }
}

export default handler;