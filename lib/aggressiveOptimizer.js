/**
 * Sistema de Optimizaciones Agresivas con Caché Multi-Nivel
 * VERSIÓN CORREGIDA - Fix para evitar mezclar datos de diferentes facturas
 */

const { 
  recordMetric, 
  getCachedInvoice, 
  saveCachedInvoice 
} = require('./globalMetricsStore');
const crypto = require('crypto');

class AggressiveOptimizer {
  constructor() {
    // Caché de conexiones de browser (warm pool)
    this.browserPool = {
      lastUsed: null,
      keepAlive: 30000, // 30 segundos
      isWarming: false
    };
    
    // Caché MULTI-NIVEL para máxima velocidad
    this.caches = {
      // Nivel 1: Resultado final completo (más rápido - ~10ms)
      fullResult: new Map(),
      fullResultTTL: 300000, // 5 minutos
      
      // Nivel 2: PDF generado (rápido - ~100ms, sin upload)
      pdfBuffer: new Map(),
      pdfBufferTTL: 600000, // 10 minutos
      
      // Nivel 3: HTML renderizado (medio - ~500ms, sin conversión PDF)
      renderedHTML: new Map(),
      renderedHTMLTTL: 900000, // 15 minutos
      
      // Nivel 4: Drive URLs por fileId (para reutilizar uploads)
      driveUrls: new Map(),
      driveUrlsTTL: 3600000 // 1 hora
    };
    
    // Caché de contenido similar (fuzzy matching) - DESHABILITADO por defecto
    this.similarityCache = new Map();
    this.similarityThreshold = 0.99; // AUMENTADO de 0.95 a 0.99 - Mucho más estricto
    this.enableFuzzyMatching = false; // DESHABILITADO por defecto para evitar mezclar datos
    
    // Estadísticas de rendimiento
    this.stats = {
      level1Hits: 0, // Resultado completo
      level2Hits: 0, // PDF buffer
      level3Hits: 0, // HTML renderizado
      level4Hits: 0, // Drive URL
      totalMisses: 0,
      avgSavings: 0
    };
    
    console.log('🚀 AggressiveOptimizer inicializado (Fuzzy matching: DESHABILITADO)');
    console.log('⚠️  Solo se cachearán facturas IDÉNTICAS para evitar mezclar datos');
  }

  /**
   * Genera hash único para contenido HTML (SIN normalización agresiva)
   * VERSIÓN CORREGIDA: Incluye todos los datos únicos del cliente
   */
  generateContentHash(html, options = {}) {
    // NO normalizar - usar hash directo del contenido completo
    // Esto asegura que solo facturas IDÉNTICAS usen el mismo cache
    const optionsStr = JSON.stringify(options);
    return crypto.createHash('sha256')
      .update(html + optionsStr)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Genera hash parcial para detectar contenido similar (fuzzy)
   * VERSIÓN CORREGIDA: Mucho más específico, incluye datos del cliente
   */
  generateFuzzyHash(html) {
    // Extraer datos clave que DEBEN ser iguales
    const keyData = this.extractKeyData(html);
    
    // Hash basado en datos clave + estructura
    const dataString = JSON.stringify(keyData);
    
    return crypto.createHash('md5').update(dataString).digest('hex').substring(0, 12);
  }

  /**
   * NUEVO: Extrae datos clave de la factura que deben ser únicos
   */
  extractKeyData(html) {
    const keyData = {
      // Extraer datos únicos usando regex más específicos
      cliente: this.extractBetween(html, '<h2>Cliente</h2>', '</p>'),
      placa: this.extractBetween(html, '<strong>Placa:</strong>', '</p>'),
      clave: this.extractBetween(html, 'Remisión #<span>', '</span>'),
      fecha: this.extractBetween(html, 'Fecha: <span>', '</span>'),
      total: this.extractBetween(html, 'Total a Pagar', '</td>'),
      // Estructura de la tabla (sin valores específicos)
      estructura: this.getTableStructure(html)
    };
    
    return keyData;
  }

  /**
   * NUEVO: Extrae texto entre dos delimitadores
   */
  extractBetween(text, start, end) {
    const startIndex = text.indexOf(start);
    if (startIndex === -1) return '';
    
    const searchStart = startIndex + start.length;
    const endIndex = text.indexOf(end, searchStart);
    if (endIndex === -1) return '';
    
    return text.substring(searchStart, endIndex).trim();
  }

  /**
   * NUEVO: Obtiene estructura de la tabla (número de filas, tipos)
   */
  getTableStructure(html) {
    const tableMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableMatch) return 'none';
    
    const rows = tableMatch[1].match(/<tr>/g);
    return rows ? `rows:${rows.length}` : 'empty';
  }

  /**
   * NIVEL 1: Verifica caché de resultado completo (más rápido)
   * Retorna resultado final si existe (~10ms)
   * VERSIÓN CORREGIDA: Solo retorna si el hash es EXACTAMENTE igual
   */
  checkLevel1Cache(html, fileName) {
    const hash = this.generateContentHash(html);
    const cached = this.caches.fullResult.get(hash);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.caches.fullResultTTL) {
        console.log(`⚡ NIVEL 1 HIT - Factura IDÉNTICA (Age: ${age}ms, Hash: ${hash})`);
        this.stats.level1Hits++;
        recordMetric('cache_hit');
        return {
          ...cached.result,
          cacheLevel: 1,
          cacheAge: age,
          timeSaved: '~4000ms',
          cacheHash: hash
        };
      } else {
        this.caches.fullResult.delete(hash);
      }
    }
    
    return null;
  }

  /**
   * NIVEL 2: Verifica caché de PDF buffer
   * VERSIÓN CORREGIDA: Solo retorna si el contenido es IDÉNTICO
   */
  checkLevel2Cache(html) {
    const hash = this.generateContentHash(html);
    const cached = this.caches.pdfBuffer.get(hash);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.caches.pdfBufferTTL) {
        console.log(`🔥 NIVEL 2 HIT - PDF IDÉNTICO (Age: ${age}ms, Hash: ${hash})`);
        this.stats.level2Hits++;
        recordMetric('cache_hit');
        return {
          buffer: cached.buffer,
          info: cached.info,
          cacheLevel: 2,
          cacheAge: age,
          timeSaved: '~2500ms',
          cacheHash: hash
        };
      } else {
        this.caches.pdfBuffer.delete(hash);
      }
    }
    
    return null;
  }

  /**
   * NIVEL 3: Verifica caché de HTML renderizado
   * DESHABILITADO - Puede causar mezcla de datos
   */
  checkLevel3Cache(html) {
    // DESHABILITADO para evitar mezclar datos
    return null;
  }

  /**
   * NIVEL 4: Busca contenido SIMILAR (fuzzy matching)
   * VERSIÓN CORREGIDA: Mucho más estricto y DESHABILITADO por defecto
   */
  checkSimilarityCache(html) {
    // Si fuzzy matching está deshabilitado, retornar null
    if (!this.enableFuzzyMatching) {
      return null;
    }

    const fuzzyHash = this.generateFuzzyHash(html);
    const similar = this.similarityCache.get(fuzzyHash);
    
    if (similar) {
      const age = Date.now() - similar.timestamp;
      if (age < this.caches.fullResultTTL) {
        // VALIDACIÓN ADICIONAL: Verificar que los datos clave sean iguales
        const currentKeyData = this.extractKeyData(html);
        const cachedKeyData = this.extractKeyData(similar.originalHTML || '');
        
        const isSimilarEnough = this.validateSimilarity(currentKeyData, cachedKeyData);
        
        if (isSimilarEnough) {
          console.log(`🎯 NIVEL 4 HIT - Contenido similar (Age: ${age}ms, Hash: ${fuzzyHash})`);
          console.log(`   Cliente actual: ${currentKeyData.cliente}`);
          console.log(`   Cliente cached: ${cachedKeyData.cliente}`);
          this.stats.level4Hits++;
          recordMetric('cache_hit');
          
          return {
            ...similar.result,
            cacheLevel: 4,
            cacheAge: age,
            similarity: '~99%',
            timeSaved: '~4000ms',
            warning: 'Fuzzy match - verificar datos'
          };
        } else {
          console.log(`⚠️  NIVEL 4 RECHAZADO - Datos diferentes detectados`);
          console.log(`   Cliente actual: ${currentKeyData.cliente}`);
          console.log(`   Cliente cached: ${cachedKeyData.cliente}`);
          this.similarityCache.delete(fuzzyHash);
        }
      } else {
        this.similarityCache.delete(fuzzyHash);
      }
    }
    
    return null;
  }

  /**
   * NUEVO: Valida que los datos clave sean lo suficientemente similares
   */
  validateSimilarity(data1, data2) {
    // Los datos CRÍTICOS deben ser iguales
    if (data1.cliente !== data2.cliente) return false;
    if (data1.placa !== data2.placa) return false;
    if (data1.clave !== data2.clave) return false;
    
    // La estructura debe ser igual
    if (data1.estructura !== data2.estructura) return false;
    
    return true;
  }

  /**
   * Verifica TODOS los niveles de caché (cascada)
   * VERSIÓN CORREGIDA: Fuzzy matching deshabilitado por defecto
   */
  checkAllCacheLevels(html, fileName) {
    // Nivel 1: Resultado completo (más rápido y SEGURO)
    const level1 = this.checkLevel1Cache(html, fileName);
    if (level1) return level1;
    
    // Nivel 4: Similitud (SOLO si está habilitado y es MUY similar)
    if (this.enableFuzzyMatching) {
      const level4 = this.checkSimilarityCache(html);
      if (level4) return level4;
    }
    
    // Nivel 2: PDF buffer (SEGURO - mismo contenido)
    const level2 = this.checkLevel2Cache(html);
    if (level2) return level2;
    
    // Nivel 3: DESHABILITADO
    
    // Cache miss
    this.stats.totalMisses++;
    recordMetric('cache_miss');
    console.log('❌ CACHE MISS - Generando factura nueva');
    return null;
  }

  /**
   * Guarda en NIVEL 1: Resultado completo
   * VERSIÓN CORREGIDA: Incluye el HTML original para validación
   */
  saveLevel1Cache(html, result) {
    const hash = this.generateContentHash(html);
    
    // Limitar tamaño del cache
    if (this.caches.fullResult.size >= 100) {
      const firstKey = this.caches.fullResult.keys().next().value;
      this.caches.fullResult.delete(firstKey);
    }
    
    this.caches.fullResult.set(hash, {
      result: result,
      originalHTML: html, // Guardar HTML original para validación
      timestamp: Date.now()
    });
    
    console.log(`💾 NIVEL 1 SAVED: ${hash} (Total: ${this.caches.fullResult.size})`);
  }

  /**
   * Guarda en NIVEL 2: PDF buffer
   */
  saveLevel2Cache(html, buffer, info) {
    const hash = this.generateContentHash(html);
    
    if (this.caches.pdfBuffer.size >= 50) {
      const firstKey = this.caches.pdfBuffer.keys().next().value;
      this.caches.pdfBuffer.delete(firstKey);
    }
    
    this.caches.pdfBuffer.set(hash, {
      buffer: buffer,
      info: info,
      originalHTML: html, // Guardar HTML original
      timestamp: Date.now()
    });
    
    console.log(`💾 NIVEL 2 SAVED: ${hash} (Total: ${this.caches.pdfBuffer.size})`);
  }

  /**
   * Guarda en NIVEL 3: HTML renderizado
   * DESHABILITADO - No se usa
   */
  saveLevel3Cache(html, renderedHTML) {
    // DESHABILITADO
    return;
  }

  /**
   * Guarda en NIVEL 4: Similitud (fuzzy)
   * SOLO si está habilitado
   */
  saveSimilarityCache(html, result) {
    if (!this.enableFuzzyMatching) {
      return; // No guardar si fuzzy está deshabilitado
    }

    const fuzzyHash = this.generateFuzzyHash(html);
    
    if (this.similarityCache.size >= 50) {
      const firstKey = this.similarityCache.keys().next().value;
      this.similarityCache.delete(firstKey);
    }
    
    this.similarityCache.set(fuzzyHash, {
      result: result,
      originalHTML: html, // Importante: guardar HTML para validación posterior
      timestamp: Date.now()
    });
    
    console.log(`💾 NIVEL 4 SAVED (fuzzy): ${fuzzyHash} (Total: ${this.similarityCache.size})`);
  }

  /**
   * Guarda resultado en niveles relevantes
   * VERSIÓN CORREGIDA: Fuzzy matching opcional
   */
  saveAllLevels(html, pdfBuffer, pdfInfo, finalResult) {
    // Nivel 1: Resultado completo (SIEMPRE)
    this.saveLevel1Cache(html, finalResult);
    
    // Nivel 2: PDF buffer (SIEMPRE)
    this.saveLevel2Cache(html, pdfBuffer, pdfInfo);
    
    // Nivel 4: Similitud (SOLO si está habilitado)
    if (this.enableFuzzyMatching) {
      this.saveSimilarityCache(html, finalResult);
    }
    
    console.log('✅ Guardado en caché multi-nivel completado (Fuzzy: ' + 
                (this.enableFuzzyMatching ? 'ON' : 'OFF') + ')');
  }

  /**
   * Optimización de tamaño de HTML antes de enviar a Browserless
   */
  optimizeHTML(html) {
    const startSize = html.length;
    
    let optimized = html
      .replace(/<!--[\s\S]*?-->/g, '') // Remover comentarios
      .replace(/\s+/g, ' ') // Espacios múltiples
      .replace(/>\s+</g, '><') // Espacios entre tags
      .trim();
    
    const endSize = optimized.length;
    const reduction = ((startSize - endSize) / startSize * 100).toFixed(1);
    
    console.log(`📉 HTML optimizado: ${startSize} → ${endSize} bytes (${reduction}% reducción)`);
    
    return optimized;
  }

  /**
   * Compresión de opciones de PDF para reducir latencia
   */
  getOptimizedPDFOptions(customOptions = {}) {
    return {
      format: 'A4',
      margin: {
        top: '10px',
        right: '10px',
        bottom: '10px',
        left: '10px'
      },
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      timeout: 8000,
      ...customOptions
    };
  }

  /**
   * Marca uso del browser
   */
  markBrowserUsed() {
    this.browserPool.lastUsed = Date.now();
  }

  /**
   * Habilitar/deshabilitar fuzzy matching
   */
  setFuzzyMatching(enabled) {
    this.enableFuzzyMatching = enabled;
    console.log(`🔧 Fuzzy matching ${enabled ? 'HABILITADO' : 'DESHABILITADO'}`);
    
    if (!enabled) {
      // Limpiar cache de similitud si se deshabilita
      this.similarityCache.clear();
      console.log('🗑️ Cache de similitud limpiado');
    }
  }

  /**
   * Limpieza automática de caches viejos
   */
  cleanupOldCaches() {
    const now = Date.now();
    let cleaned = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0
    };
    
    // Limpiar Nivel 1
    for (const [hash, data] of this.caches.fullResult.entries()) {
      if (now - data.timestamp > this.caches.fullResultTTL) {
        this.caches.fullResult.delete(hash);
        cleaned.level1++;
      }
    }
    
    // Limpiar Nivel 2
    for (const [hash, data] of this.caches.pdfBuffer.entries()) {
      if (now - data.timestamp > this.caches.pdfBufferTTL) {
        this.caches.pdfBuffer.delete(hash);
        cleaned.level2++;
      }
    }
    
    // Limpiar Nivel 3
    for (const [hash, data] of this.caches.renderedHTML.entries()) {
      if (now - data.timestamp > this.caches.renderedHTMLTTL) {
        this.caches.renderedHTML.delete(hash);
        cleaned.level3++;
      }
    }
    
    // Limpiar Nivel 4
    for (const [hash, data] of this.similarityCache.entries()) {
      if (now - data.timestamp > this.caches.fullResultTTL) {
        this.similarityCache.delete(hash);
        cleaned.level4++;
      }
    }
    
    const total = Object.values(cleaned).reduce((a, b) => a + b, 0);
    if (total > 0) {
      console.log(`🗑️ Limpiados ${total} caches viejos:`, cleaned);
    }
    
    return cleaned;
  }

  /**
   * Obtiene estadísticas de optimización
   */
  getStats() {
    const totalHits = this.stats.level1Hits + this.stats.level2Hits + 
                     this.stats.level3Hits + this.stats.level4Hits;
    const totalRequests = totalHits + this.stats.totalMisses;
    const hitRate = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 0;
    
    return {
      caches: {
        level1: {
          name: 'Resultado Completo',
          size: this.caches.fullResult.size,
          hits: this.stats.level1Hits,
          timeSaved: '~4000ms'
        },
        level2: {
          name: 'PDF Buffer',
          size: this.caches.pdfBuffer.size,
          hits: this.stats.level2Hits,
          timeSaved: '~2500ms'
        },
        level3: {
          name: 'HTML Renderizado',
          size: this.caches.renderedHTML.size,
          hits: this.stats.level3Hits,
          timeSaved: '~500ms'
        },
        level4: {
          name: 'Similitud (Fuzzy)',
          size: this.similarityCache.size,
          hits: this.stats.level4Hits,
          timeSaved: '~4000ms'
        }
      },
      performance: {
        totalHits: totalHits,
        totalMisses: this.stats.totalMisses,
        hitRate: hitRate + '%',
        totalRequests: totalRequests
      },
      browserPool: {
        lastUsed: this.browserPool.lastUsed,
        isActive: this.browserPool.lastUsed && 
                  (Date.now() - this.browserPool.lastUsed) < this.browserPool.keepAlive
      }
    };
  }

  /**
   * Resetea todos los caches y estadísticas
   */
  reset() {
    this.caches.fullResult.clear();
    this.caches.pdfBuffer.clear();
    this.caches.renderedHTML.clear();
    this.similarityCache.clear();
    this.browserPool.lastUsed = null;
    this.stats = {
      level1Hits: 0,
      level2Hits: 0,
      level3Hits: 0,
      level4Hits: 0,
      totalMisses: 0,
      avgSavings: 0
    };
    console.log('🔄 AggressiveOptimizer reseteado completamente');
  }
}

// Singleton instance
let optimizerInstance = null;

function getOptimizer() {
  if (!optimizerInstance) {
    optimizerInstance = new AggressiveOptimizer();
  }
  return optimizerInstance;
}

module.exports = {
  AggressiveOptimizer,
  getOptimizer
};
