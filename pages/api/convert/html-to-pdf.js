const PDFService = require('../../../lib/pdfService');
const GoogleDriveService = require('../../../lib/googleDriveService');
const { getOptimizer } = require('../../../lib/aggressiveOptimizer');
const { 
  validateEnvironmentVariables, 
  handleAPIError, 
  validateRequestBody, 
  createSuccessResponse,
  logStructured 
} = require('../../../lib/utils');

// Inicializar optimizador agresivo con caché multi-nivel
const optimizer = getOptimizer();

/**
 * API Route: /api/convert/html-to-pdf
 * Convierte HTML a PDF con sistema de caché multi-nivel ultra-rápido
 * 
 * NIVELES DE CACHÉ:
 * - Nivel 1: Resultado completo (~10ms) ⚡
 * - Nivel 2: PDF buffer (~1500ms) 🔥
 * - Nivel 3: HTML renderizado (~3000ms) 💨
 * - Nivel 4: Similitud fuzzy (~10ms) 🎯
 */
async function handler(req, res) {
  const requestStartTime = Date.now();
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed. Use POST.', code: 405 }
    });
  }

  try {
    logStructured('info', '🚀 Starting ultra-fast HTML to PDF conversion', {
      method: req.method,
      hasHtml: !!req.body?.html,
      timestamp: new Date().toISOString()
    });

    // 1. Validar variables de entorno
    const envValidation = validateEnvironmentVariables();
    if (!envValidation.isValid) {
      logStructured('error', 'Environment validation failed', { missing: envValidation.missing });
      return res.status(500).json({
        success: false,
        error: { message: 'Server configuration error', code: 500 }
      });
    }

    // 2. Validar el cuerpo de la solicitud
    const bodyValidation = validateRequestBody(req.body);
    if (!bodyValidation.isValid) {
      logStructured('warn', 'Request validation failed', { errors: bodyValidation.errors });
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid request data', details: bodyValidation.errors, code: 400 }
      });
    }

    const { html, fileName, pdfOptions = {} } = req.body;

    // 3. 🚀 SISTEMA DE CACHÉ MULTI-NIVEL - Verificar TODOS los niveles
    const cachedResult = optimizer.checkAllCacheLevels(html, fileName);
    
    if (cachedResult) {
      // NIVEL 1 o NIVEL 4 HIT - Resultado completo en caché
      if (cachedResult.cacheLevel === 1 || cachedResult.cacheLevel === 4) {
        const totalTime = Date.now() - requestStartTime;
        
        logStructured('info', `⚡ ULTRA-FAST CACHE HIT - Nivel ${cachedResult.cacheLevel}`, { 
          responseTime: totalTime,
          cacheAge: cachedResult.cacheAge,
          timeSaved: cachedResult.timeSaved,
          similarity: cachedResult.similarity
        });
        
        return res.status(200).json({
          ...cachedResult,
          responseTime: totalTime,
          message: `Served from Level ${cachedResult.cacheLevel} cache`
        });
      }
      
      // NIVEL 2 HIT - PDF buffer en caché, solo necesita upload
      if (cachedResult.cacheLevel === 2) {
        logStructured('info', '🔥 NIVEL 2 HIT - PDF buffer cached, uploading to Drive');
        
        const driveService = new GoogleDriveService();
        const finalFileName = fileName || `cached-document_${Date.now()}.pdf`;
        
        const uploadStart = Date.now();
        const driveResult = await driveService.uploadPDF(cachedResult.buffer, finalFileName);
        const uploadTime = Date.now() - uploadStart;
        
        const totalTime = Date.now() - requestStartTime;
        
        const responseData = {
          pdf: {
            fileName: driveResult.fileName,
            size: cachedResult.info.sizeFormatted,
            sizeBytes: cachedResult.info.size
          },
          googleDrive: {
            fileId: driveResult.fileId,
            viewLink: driveResult.viewLink,
            downloadLink: driveResult.downloadLink,
            directLink: driveResult.directLink
          },
          processing: {
            convertedAt: new Date().toISOString(),
            totalTime: `${totalTime}ms`,
            breakdown: {
              pdfConversion: '0ms (cached)',
              driveUpload: `${uploadTime}ms`,
              timeSaved: cachedResult.timeSaved
            },
            cacheLevel: 2
          }
        };
        
        const finalResponse = createSuccessResponse(
          responseData, 
          'PDF served from cache and uploaded to Google Drive successfully'
        );
        
        // Guardar resultado completo en Nivel 1 para próximas requests
        optimizer.saveLevel1Cache(html, finalResponse);
        
        logStructured('info', '✅ Level 2 cache served successfully', {
          totalTime: `${totalTime}ms`,
          uploadTime: `${uploadTime}ms`
        });
        
        return res.status(200).json({
          ...finalResponse,
          cached: true,
          cacheLevel: 2,
          responseTime: totalTime
        });
      }
      
      // NIVEL 3 HIT - HTML renderizado, necesita PDF conversion y upload
      // (Este nivel se procesa igual que cache miss pero con HTML pre-procesado)
    }

    // 4. CACHE MISS o NIVEL 3 - Procesamiento completo
    logStructured('info', '💨 Processing new request or Level 3 cache');
    
    // Optimizar HTML
    const optimizedHTML = optimizer.optimizeHTML(html);
    
    // Inicializar servicios
    const pdfService = new PDFService();
    const driveService = new GoogleDriveService();
    
    // Opciones de PDF optimizadas
    const optimizedPDFOptions = optimizer.getOptimizedPDFOptions(pdfOptions);

    // Validar HTML
    if (!pdfService.validateHTML(optimizedHTML)) {
      logStructured('warn', 'HTML validation failed');
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid HTML content', code: 400 }
      });
    }

    // Generar nombre de archivo
    const finalFileName = fileName || pdfService.generateFileName('converted-document');
    
    logStructured('info', '📄 Converting HTML to PDF (optimized)', { 
      fileName: finalFileName,
      originalSize: html.length,
      optimizedSize: optimizedHTML.length
    });

    // Marcar browser como usado
    optimizer.markBrowserUsed();

    // Convertir HTML a PDF
    const pdfConversionStart = Date.now();
    const pdfBuffer = await pdfService.convertHTMLToPDF(optimizedHTML, optimizedPDFOptions);
    const pdfConversionTime = Date.now() - pdfConversionStart;
    const pdfInfo = pdfService.getPDFInfo(pdfBuffer);

    logStructured('info', '✅ PDF conversion completed', { 
      size: pdfInfo.sizeFormatted,
      fileName: finalFileName,
      conversionTime: `${pdfConversionTime}ms`
    });

    // Limpieza automática de caches viejos en background
    setImmediate(() => optimizer.cleanupOldCaches());

    // Subir a Google Drive
    logStructured('info', '☁️ Uploading PDF to Google Drive');
    const uploadStart = Date.now();
    const driveResult = await driveService.uploadPDF(pdfBuffer, finalFileName);
    const uploadTime = Date.now() - uploadStart;

    logStructured('info', '✅ Upload completed successfully', { 
      fileId: driveResult.fileId,
      fileName: driveResult.fileName,
      uploadTime: `${uploadTime}ms`
    });

    // Preparar respuesta exitosa
    const totalTime = Date.now() - requestStartTime;
    const responseData = {
      pdf: {
        fileName: driveResult.fileName,
        size: pdfInfo.sizeFormatted,
        sizeBytes: pdfInfo.size
      },
      googleDrive: {
        fileId: driveResult.fileId,
        viewLink: driveResult.viewLink,
        downloadLink: driveResult.downloadLink,
        directLink: driveResult.directLink
      },
      processing: {
        convertedAt: new Date().toISOString(),
        totalTime: `${totalTime}ms`,
        breakdown: {
          pdfConversion: `${pdfConversionTime}ms`,
          driveUpload: `${uploadTime}ms`,
          optimization: `${Math.round((html.length - optimizedHTML.length) / html.length * 100)}% HTML reduction`
        }
      }
    };

    const finalResponse = createSuccessResponse(
      responseData, 
      'HTML converted to PDF and uploaded to Google Drive successfully'
    );

    // 🚀 Guardar en TODOS los niveles de caché para máxima velocidad futura
    optimizer.saveAllLevels(html, pdfBuffer, pdfInfo, finalResponse);

    logStructured('info', '🎉 Request completed and cached at all levels', {
      totalTime: `${totalTime}ms`,
      pdfTime: `${pdfConversionTime}ms`,
      uploadTime: `${uploadTime}ms`,
      optimizations: optimizer.getStats()
    });

    // Enviar respuesta
    res.status(200).json({
      ...finalResponse,
      cached: false,
      responseTime: totalTime
    });

  } catch (error) {
    const errorTime = Date.now() - requestStartTime;
    
    logStructured('error', '❌ Conversion error', {
      error: error.message,
      errorTime: `${errorTime}ms`,
      isTokenError: error.message?.includes('Token') || error.message?.includes('OAuth'),
      timestamp: new Date().toISOString()
    });
    
    handleAPIError(error, res, 'HTML to PDF Conversion');
  }
}

// Configuración de la API Route para Next.js
const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Permitir hasta 10MB de HTML
    },
  },
};

export default handler;
export { config };