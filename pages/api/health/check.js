const GoogleDriveService = require('../../../lib/googleDriveService');
const { validateEnvironmentVariables, handleAPIError, createSuccessResponse } = require('../../../lib/utils');

/**
 * API Route: /api/health/check
 * Verifica el estado de la API y las conexiones con servicios externos
 * 
 * Método: GET
 */
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed. Use GET.',
        code: 405
      }
    });
  }

  try {
    const healthCheck = {
      api: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      },
      services: {}
    };

    // Verificar variables de entorno
    const envValidation = validateEnvironmentVariables();
    healthCheck.environment.configStatus = envValidation.isValid ? 'configured' : 'missing_variables';
    
    if (!envValidation.isValid) {
      healthCheck.environment.missingVars = envValidation.missing;
    }

    // Verificar conexión con Google Drive (solo si las variables están configuradas)
    if (envValidation.isValid) {
      try {
        const driveService = new GoogleDriveService();
        const driveConnected = await driveService.testConnection();
        healthCheck.services.googleDrive = {
          status: driveConnected ? 'connected' : 'disconnected',
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        healthCheck.services.googleDrive = {
          status: 'error',
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    } else {
      healthCheck.services.googleDrive = {
        status: 'not_configured',
        message: 'Environment variables not configured'
      };
    }

    // Determinar el estado general
    const overallHealthy = healthCheck.environment.configStatus === 'configured' && 
                          healthCheck.services.googleDrive.status === 'connected';

    const statusCode = overallHealthy ? 200 : 503;
    healthCheck.api.status = overallHealthy ? 'healthy' : 'degraded';

    res.status(statusCode).json(createSuccessResponse(healthCheck, 'Health check completed'));

  } catch (error) {
    handleAPIError(error, res, 'Health Check');
  }
}