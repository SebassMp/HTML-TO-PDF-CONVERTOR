const puppeteer = require('puppeteer-core');

/**
 * Servicio para convertir HTML a PDF
 * Utiliza Browserless para producción y Chrome local para desarrollo
 */
class PDFService {
  constructor() {
    // Opciones por defecto para la generación de PDF
    this.defaultOptions = {
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      timeout: 15000, // Reducido de 30000 a 15000ms para evitar timeout de Vercel
    };
  }

  /**
   * Obtiene la configuración del navegador para el entorno
   * @returns {Promise<Object>} - Configuración de Puppeteer
   */
  async getBrowserConfig() {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // En desarrollo local, intentar usar Chrome instalado
      const os = require('os');
      const path = require('path');
      const fs = require('fs');
      
      let executablePath = null;
      
      // Rutas comunes de Chrome en Windows
      const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
        // Edge como alternativa
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ];
      
      // Buscar Chrome instalado
      for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
          executablePath = chromePath;
          break;
        }
      }
      
      const config = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...(executablePath && { executablePath })
      };
      
      console.log('Development browser config:', {
        hasExecutablePath: !!config.executablePath,
        executablePath: config.executablePath,
        argsCount: config.args.length
      });
      
      return config;
    } else {
      // En producción (Vercel), usar Browserless
      const browserlessToken = process.env.BROWSERLESS_TOKEN;
      
      if (!browserlessToken) {
        throw new Error('BROWSERLESS_TOKEN environment variable is required for production');
      }
      
      const config = {
        browserWSEndpoint: `wss://production-sfo.browserless.io?token=${browserlessToken}&timeout=25000&launch={"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"]}`,
      };
      
      console.log('Production Browserless config:', {
        hasBrowserlessToken: !!browserlessToken,
        endpoint: 'wss://production-sfo.browserless.io'
      });
      
      return config;
    }
  }

  /**
   * Convierte contenido HTML a PDF
   * @param {string} htmlContent - Contenido HTML a convertir
   * @param {Object} customOptions - Opciones personalizadas para el PDF
   * @returns {Promise<Buffer>} - Buffer del archivo PDF generado
   */
  async convertHTMLToPDF(htmlContent, customOptions = {}) {
    let browser = null;
    
    try {
      // Validar que el contenido HTML no esté vacío
      if (!htmlContent || htmlContent.trim() === '') {
        throw new Error('HTML content cannot be empty');
      }

      // Combinar opciones por defecto con opciones personalizadas
      const options = { ...this.defaultOptions, ...customOptions };

      console.log('Starting PDF conversion...');
      
      // Obtener configuración del navegador
      const browserConfig = await this.getBrowserConfig();
      
      console.log('Browser config obtained');
      
      // Lanzar el navegador (local o conectar a Browserless)
      if (process.env.NODE_ENV === 'development') {
        browser = await puppeteer.launch(browserConfig);
      } else {
        browser = await puppeteer.connect(browserConfig);
      }
      
      console.log('Browser connected successfully');
      
      // Crear nueva página
      const page = await browser.newPage();
      
      // Configurar viewport para mejor renderizado
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Establecer el contenido HTML con timeout más agresivo
      await page.setContent(htmlContent, { 
        waitUntil: 'domcontentloaded', // Cambiado de 'networkidle0' a 'domcontentloaded' para ser más rápido
        timeout: 10000 // Timeout más corto para setContent
      });
      
      console.log('HTML content set, generating PDF...');
      
      // Generar el PDF
      const pdfBuffer = await page.pdf(options);
      
      console.log('PDF conversion completed successfully');
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      throw new Error(`PDF conversion failed: ${error.message}`);
    } finally {
      // Cerrar el navegador
      if (browser) {
        if (process.env.NODE_ENV === 'development') {
          await browser.close();
        } else {
          await browser.disconnect();
        }
      }
    }
  }

  /**
   * Valida que el contenido HTML sea válido
   * @param {string} htmlContent - Contenido HTML a validar
   * @returns {boolean} - True si el HTML es válido
   */
  validateHTML(htmlContent) {
    try {
      // Verificaciones básicas
      if (!htmlContent || typeof htmlContent !== 'string') {
        return false;
      }

      // Verificar que tenga contenido mínimo
      if (htmlContent.trim().length < 10) {
        return false;
      }

      // Verificar que no contenga scripts maliciosos (básico)
      const dangerousPatterns = [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(htmlContent)) {
          console.warn('Potentially dangerous content detected in HTML');
          // No bloqueamos, pero advertimos
        }
      }

      return true;
    } catch (error) {
      console.error('HTML validation error:', error);
      return false;
    }
  }

  /**
   * Genera un nombre de archivo único para el PDF
   * @param {string} prefix - Prefijo para el nombre del archivo
   * @returns {string} - Nombre de archivo único
   */
  generateFileName(prefix = 'document') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomSuffix}.pdf`;
  }

  /**
   * Obtiene información sobre el PDF generado
   * @param {Buffer} pdfBuffer - Buffer del PDF
   * @returns {Object} - Información del PDF
   */
  getPDFInfo(pdfBuffer) {
    return {
      size: pdfBuffer.length,
      sizeFormatted: this.formatBytes(pdfBuffer.length),
      type: 'application/pdf'
    };
  }

  /**
   * Formatea bytes a una representación legible
   * @param {number} bytes - Número de bytes
   * @returns {string} - Tamaño formateado
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Configuración optimizada para generación rápida
   */
  getOptimizedPDFOptions(customOptions = {}) {
    return {
      format: 'A4',
      margin: {
        top: '15px',    // Reducido de 20px
        right: '15px',  // Reducido de 20px
        bottom: '15px', // Reducido de 20px
        left: '15px'    // Reducido de 20px
      },
      printBackground: true,
      preferCSSPageSize: true,
      quality: 90, // Comprimir ligeramente
      ...customOptions
    };
  }

  /**
   * Conversión optimizada para facturas
   */
  async convertHTMLToPDFOptimized(htmlContent, customOptions = {}) {
    let browser = null;
    const startTime = Date.now();
    
    try {
      if (!htmlContent || htmlContent.trim() === '') {
        throw new Error('HTML content cannot be empty');
      }

      // Usar opciones optimizadas
      const options = this.getOptimizedPDFOptions(customOptions);

      console.log('Starting optimized PDF conversion...');
      
      const browserConfig = await this.getBrowserConfig();
      
      // Conectar al navegador
      if (process.env.NODE_ENV === 'development') {
        browser = await puppeteer.launch(browserConfig);
      } else {
        browser = await puppeteer.connect(browserConfig);
      }
      
      const page = await browser.newPage();
      
      // Viewport optimizado para A4
      await page.setViewport({ width: 794, height: 1123 });
      
      // Configuración más agresiva para velocidad
      await page.setContent(htmlContent, { 
        waitUntil: 'load', // Más rápido que 'domcontentloaded'
        timeout: 5000      // Reducido de 10000ms
      });
      
      // Generar PDF
      const pdfBuffer = await page.pdf(options);
      
      const endTime = Date.now();
      console.log(`PDF optimizado generado en ${endTime - startTime}ms`);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error in optimized PDF conversion:', error);
      throw new Error(`Optimized PDF conversion failed: ${error.message}`);
    } finally {
      if (browser) {
        if (process.env.NODE_ENV === 'development') {
          await browser.close();
        } else {
          await browser.disconnect();
        }
      }
    }
  }
}

module.exports = PDFService;