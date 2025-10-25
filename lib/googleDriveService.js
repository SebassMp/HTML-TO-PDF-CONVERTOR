const { google } = require('googleapis');

/**
 * 🔐 Google Drive Service - OAUTH2 CON AUTO-RENOVACIÓN
 * 
 * ✅ OAuth2 con refresh token de larga duración
 * ✅ Renovación automática de tokens con detección de errores
 * ✅ Sistema de reintentos inteligente con backoff exponencial
 * ✅ Logs estructurados para monitoreo completo
 * ✅ Funciona en Vercel con cuentas personales de Google
 */

// Códigos de error que indican problemas con tokens
const TOKEN_ERROR_CODES = [
  'invalid_grant',
  'invalid_token',
  'Token has been expired',
  'token_expired',
  'unauthorized',
  401,
  403
];

// Delays para reintentos con backoff exponencial (en milisegundos)
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.oauth2Client = null;
    this.initialized = false;
    this.lastTokenRenewal = null;
    this.tokenRenewalCount = 0;
  }

  /**
   * 🔧 Inicializa OAuth2 con refresh token de larga duración
   */
  async initializeOAuth2() {
    if (this.initialized) return;

    this.logTokenEvent('oauth2_init_start');
    
    try {
      console.log('🔑 Iniciando OAuth2 con refresh token...');
      
      // Verificar variables de entorno
      const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_DRIVE_FOLDER_ID'];
      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          const error = new Error(`${varName} no está configurado`);
          this.logTokenEvent('oauth2_init_error', { 
            error: error.message,
            missingVar: varName 
          });
          throw error;
        }
      }

      // Crear cliente OAuth2
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/auth/callback' // redirect_uri (no se usa en refresh)
      );

      // Configurar refresh token
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      this.logTokenEvent('oauth2_credentials_set');

      // Inicializar Google Drive API
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      
      this.initialized = true;
      console.log('✅ OAuth2 inicializado correctamente');
      console.log('🔒 Refresh Token: Configurado');
      
      this.logTokenEvent('oauth2_init_success');
      
    } catch (error) {
      console.error('❌ Error inicializando OAuth2:', error.message);
      this.logTokenEvent('oauth2_init_failed', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 🔄 Renueva el access token automáticamente con logs mejorados
   */
  async renewAccessToken() {
    try {
      this.logTokenEvent('token_renewal_start', {
        renewalCount: this.tokenRenewalCount + 1,
        lastRenewal: this.lastTokenRenewal
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      this.lastTokenRenewal = new Date().toISOString();
      this.tokenRenewalCount++;

      this.logTokenEvent('token_renewal_success', {
        renewalCount: this.tokenRenewalCount,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : null,
        tokenType: credentials.token_type
      });

      return {
        success: true,
        renewalCount: this.tokenRenewalCount,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : null,
        renewedAt: this.lastTokenRenewal
      };
    } catch (error) {
      // Detectar tipos específicos de errores de token
      const isTokenError = this.isTokenError(error);
      
      this.logTokenEvent('token_renewal_error', {
        error: error.message,
        code: error.code,
        isTokenError: isTokenError,
        renewalCount: this.tokenRenewalCount
      });
      
      if (isTokenError) {
        throw new Error(`Token de renovación inválido o expirado: ${error.message}. Verifica GOOGLE_REFRESH_TOKEN`);
      } else {
        throw new Error(`Error renovando token: ${error.message}. Verifica GOOGLE_REFRESH_TOKEN`);
      }
    }
  }

  /**
   * 🔍 Detecta si un error está relacionado con tokens
   * @param {Error} error - Error a analizar
   * @returns {boolean} - True si es un error de token
   */
  isTokenError(error) {
    if (!error) return false;

    // Verificar código de error
    if (TOKEN_ERROR_CODES.includes(error.code)) {
      return true;
    }

    // Verificar mensaje de error
    const errorMessage = error.message ? error.message.toLowerCase() : '';
    const tokenErrorMessages = [
      'invalid_grant',
      'invalid_token',
      'token has been expired',
      'token_expired',
      'unauthorized',
      'invalid credentials',
      'authentication failed'
    ];

    return tokenErrorMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * 🔄 Ejecuta una operación con reintentos automáticos y renovación de token
   * @param {Function} operation - Función a ejecutar
   * @param {number} maxRetries - Número máximo de reintentos
   * @returns {Promise<any>} - Resultado de la operación
   */
  async retryWithTokenRenewal(operation, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.logTokenEvent('operation_attempt', {
          attempt: attempt + 1,
          maxRetries: maxRetries,
          operationName: operation.name || 'anonymous'
        });

        const result = await operation();
        
        if (attempt > 0) {
          this.logTokenEvent('operation_success_after_retry', {
            attempt: attempt + 1,
            totalAttempts: attempt + 1
          });
        }

        return result;
      } catch (error) {
        lastError = error;
        
        this.logTokenEvent('operation_error', {
          attempt: attempt + 1,
          error: error.message,
          code: error.code,
          isTokenError: this.isTokenError(error)
        });

        // Si es un error de token y no es el último intento
        if (this.isTokenError(error) && attempt < maxRetries - 1) {
          this.logTokenEvent('token_error_detected', {
            attempt: attempt + 1,
            willRetryAfterRenewal: true
          });

          try {
            await this.renewAccessToken();
            
            // Esperar antes del siguiente intento (backoff exponencial)
            if (attempt < RETRY_DELAYS.length) {
              await this.delay(RETRY_DELAYS[attempt]);
            }
            
            continue;
          } catch (renewError) {
            this.logTokenEvent('token_renewal_failed', {
              attempt: attempt + 1,
              renewError: renewError.message
            });
            throw new Error(`Token renewal failed: ${renewError.message}`);
          }
        }

        // Si no es un error de token o es el último intento, lanzar el error
        if (!this.isTokenError(error) || attempt === maxRetries - 1) {
          break;
        }

        // Esperar antes del siguiente intento para errores no relacionados con tokens
        if (attempt < RETRY_DELAYS.length) {
          await this.delay(RETRY_DELAYS[attempt]);
        }
      }
    }

    this.logTokenEvent('operation_failed_all_retries', {
      totalAttempts: maxRetries,
      finalError: lastError.message,
      finalCode: lastError.code
    });

    throw lastError;
  }

  /**
   * ✅ Valida el estado actual del token
   * @returns {Promise<Object>} - Estado del token
   */
  async validateToken() {
    try {
      await this.initializeOAuth2();

      this.logTokenEvent('token_validation_start', {});

      // Intentar una operación simple para validar el token
      const response = await this.drive.about.get({ fields: 'user' });
      
      this.logTokenEvent('token_validation_success', {
        userEmail: response.data.user.emailAddress,
        lastRenewal: this.lastTokenRenewal,
        renewalCount: this.tokenRenewalCount
      });

      return {
        isValid: true,
        userEmail: response.data.user.emailAddress,
        lastRenewal: this.lastTokenRenewal,
        renewalCount: this.tokenRenewalCount,
        validatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logTokenEvent('token_validation_error', {
        error: error.message,
        code: error.code,
        isTokenError: this.isTokenError(error)
      });

      return {
        isValid: false,
        error: error.message,
        code: error.code,
        isTokenError: this.isTokenError(error),
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * 📝 Registra eventos relacionados con tokens de forma estructurada
   * @param {string} event - Tipo de evento
   * @param {Object} details - Detalles del evento
   */
  logTokenEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      component: 'GoogleDriveService',
      event: event,
      details: details
    };

    // Determinar el nivel de log basado en el evento
    if (event.includes('error') || event.includes('failed')) {
      logEntry.level = 'ERROR';
    } else if (event.includes('warning') || event.includes('retry')) {
      logEntry.level = 'WARN';
    }

    console.log(JSON.stringify(logEntry));
  }

  /**
   * ⏱️ Función auxiliar para delays
   * @param {number} ms - Milisegundos a esperar
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📤 Sube un archivo PDF a Google Drive con sistema de reintentos inteligente
   * @param {Buffer|Uint8Array} fileBuffer - Buffer del archivo PDF
   * @param {string} fileName - Nombre del archivo
   * @returns {Promise<Object>} - Información del archivo subido
   */
  async uploadPDF(fileBuffer, fileName) {
    this.logTokenEvent('upload_start', {
      fileName: fileName,
      bufferSize: fileBuffer ? fileBuffer.length : 0
    });

    // Usar el sistema de reintentos inteligente
    return await this.retryWithTokenRenewal(async () => {
      await this.initializeOAuth2();

      // Convertir Uint8Array a Buffer si es necesario
      let buffer = fileBuffer;
      if (fileBuffer instanceof Uint8Array && !(fileBuffer instanceof Buffer)) {
        buffer = Buffer.from(fileBuffer);
        this.logTokenEvent('buffer_conversion', { 
          from: 'Uint8Array', 
          to: 'Buffer',
          size: buffer.length 
        });
      }

      // Verificar que es un Buffer válido
      if (!Buffer.isBuffer(buffer)) {
        throw new Error(`fileBuffer debe ser un Buffer. Recibido: ${typeof buffer}`);
      }

      this.logTokenEvent('upload_preparation', {
        fileName: fileName,
        bufferSize: buffer.length,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
      });

      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      // Preparar metadatos del archivo
      const fileMetadata = {
        name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        parents: [folderId],
      };

      // Crear stream del buffer
      const { Readable } = require('stream');
      const bufferStream = new Readable({
        read() {}
      });
      bufferStream.push(buffer);
      bufferStream.push(null);

      const media = {
        mimeType: 'application/pdf',
        body: bufferStream,
      };

      this.logTokenEvent('upload_executing', {
        fileName: fileMetadata.name,
        folderId: folderId
      });

      // Subir archivo
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink',
      });

      this.logTokenEvent('upload_success', {
        fileId: response.data.id,
        fileName: response.data.name
      });

      // Hacer el archivo público con reintentos
      try {
        await this.retryWithTokenRenewal(async () => {
          return await this.makeFilePublic(response.data.id);
        }, 2); // Menos reintentos para hacer público
        
        this.logTokenEvent('make_public_success', {
          fileId: response.data.id
        });
      } catch (publicError) {
        this.logTokenEvent('make_public_warning', {
          fileId: response.data.id,
          error: publicError.message
        });
        // No lanzar error, el archivo se subió correctamente
      }

      const result = {
        fileId: response.data.id,
        fileName: response.data.name,
        viewLink: response.data.webViewLink,
        downloadLink: `https://drive.google.com/uc?export=download&id=${response.data.id}`,
        directLink: response.data.webContentLink
      };

      this.logTokenEvent('upload_complete', {
        fileId: result.fileId,
        fileName: result.fileName,
        hasViewLink: !!result.viewLink,
        hasDownloadLink: !!result.downloadLink
      });

      return result;
    });
  }

  /**
   * 🔓 Hace un archivo público para que pueda ser descargado sin autenticación
   * @param {string} fileId - ID del archivo en Google Drive
   */
  async makeFilePublic(fileId) {
    this.logTokenEvent('make_public_start', { fileId });
    
    try {
      console.log(`🔓 Creando permiso público para archivo: ${fileId}`);
      
      await this.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });
      
      console.log('✅ Permiso público creado exitosamente');
      this.logTokenEvent('make_public_success', { fileId });
    } catch (error) {
      console.error('❌ Error haciendo archivo público:', error.message);
      this.logTokenEvent('make_public_error', { 
        fileId, 
        error: error.message,
        code: error.code 
      });
      throw new Error(`Error haciendo archivo público: ${error.message}`);
    }
  }

  /**
   * 🔍 Verifica la conexión con Google Drive
   * @returns {Promise<boolean>} - True si la conexión es exitosa
   */
  async testConnection() {
    try {
      console.log('🔍 Probando conexión con Google Drive...');
      
      await this.initializeOAuth2();
      
      const response = await this.drive.about.get({ fields: 'user' });
      console.log(`✅ Conectado a Google Drive como: ${response.data.user.emailAddress}`);
      
      // Probar acceso a la carpeta específica
      try {
        const folderResponse = await this.drive.files.get({
          fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
          fields: 'id,name,permissions'
        });
        console.log(`✅ Acceso a carpeta confirmado: ${folderResponse.data.name}`);
      } catch (folderError) {
        console.log(`⚠️ No se pudo acceder a la carpeta: ${folderError.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Conexión a Google Drive falló:', error.message);
      
      // Intentar renovar token si es error de autenticación
      if (error.code === 401) {
        try {
          await this.renewAccessToken();
          return await this.testConnection();
        } catch (renewError) {
          console.error('❌ No se pudo renovar el token:', renewError.message);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * 📊 Obtiene información del OAuth2
   */
  getOAuth2Info() {
    try {
      return {
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Configurado ✅' : 'No configurado ❌',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Configurado ✅' : 'No configurado ❌',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN ? 'Configurado ✅' : 'No configurado ❌',
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'No configurado ❌',
        authType: 'OAuth2 (Refresh Token)',
        status: 'Configurado ✅',
        tokenExpiry: 'Auto-renovable (larga duración)'
      };
    } catch (error) {
      return {
        clientId: 'Error ❌',
        clientSecret: 'Error ❌',
        refreshToken: 'Error ❌',
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'No configurado ❌',
        authType: 'OAuth2 (Error)',
        status: 'Error ❌',
        error: error.message
      };
    }
  }
}

module.exports = GoogleDriveService;