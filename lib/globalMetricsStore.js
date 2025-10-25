/**
 * Global Metrics Store - Sistema de métricas y caché compartido
 * Funciona tanto en Express (index.js) como en Next.js serverless
 * Usa variables globales para persistencia en Vercel
 */

// Usar global para persistencia entre invocaciones en Vercel
if (!global.metricsStore) {
  global.metricsStore = {
    performance: {
      totalRequests: 0,
      totalTime: 0,
      errorCount: 0,
      recentTimes: [],
      lastRequestTime: null
    },
    cache: {
      hits: 0,
      misses: 0,
      facturaCache: new Map(),
      templateCache: new Map(),
      maxCacheSize: 100
    },
    system: {
      startTime: Date.now(),
      lastCacheCleanup: Date.now()
    },
    tokenRenewal: {
      renewalCount: 0,
      lastRenewal: null,
      totalRenewals: 0
    }
  };
}

/**
 * Registra una métrica de rendimiento
 * @param {string} type - Tipo de métrica (request, cache_hit, cache_miss, error)
 * @param {number} time - Tiempo de ejecución en ms
 * @param {Object} metadata - Metadatos adicionales
 */
function recordMetric(type, time = 0, metadata = {}) {
  const store = global.metricsStore;
  
  switch (type) {
    case 'request':
    case 'invoice_generated':
      store.performance.totalRequests++;
      store.performance.totalTime += time;
      store.performance.lastRequestTime = new Date().toISOString();
      
      // Mantener últimos 50 tiempos
      store.performance.recentTimes.push(time);
      if (store.performance.recentTimes.length > 50) {
        store.performance.recentTimes.shift();
      }
      break;
      
    case 'cache_hit':
      store.cache.hits++;
      console.log(`✅ Cache HIT - Total hits: ${store.cache.hits}`);
      break;
      
    case 'cache_miss':
      store.cache.misses++;
      console.log(`❌ Cache MISS - Total misses: ${store.cache.misses}`);
      break;
      
    case 'error':
      store.performance.errorCount++;
      console.error(`🚨 Error registrado - Total errores: ${store.performance.errorCount}`);
      break;
      
    case 'token_renewal':
      store.tokenRenewal.renewalCount++;
      store.tokenRenewal.totalRenewals++;
      store.tokenRenewal.lastRenewal = new Date().toISOString();
      break;
  }
}

/**
 * Obtiene las métricas actuales calculadas
 * @returns {Object} - Métricas formateadas
 */
function getMetrics() {
  const store = global.metricsStore;
  const { performance, cache, system, tokenRenewal } = store;
  
  // Calcular tiempo promedio en segundos
  const averageTime = performance.totalRequests > 0 
    ? (performance.totalTime / performance.totalRequests) / 1000 
    : 0;
  
  // Calcular tasa de errores
  const errorRate = performance.totalRequests > 0 
    ? Math.round((performance.errorCount / performance.totalRequests) * 100)
    : 0;
  
  // Calcular tasa de acierto de caché
  const totalCacheRequests = cache.hits + cache.misses;
  const hitRate = totalCacheRequests > 0 
    ? Math.round((cache.hits / totalCacheRequests) * 100)
    : 0;
  
  // Información del sistema
  const uptime = Math.floor((Date.now() - system.startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  
  // Últimos 10 tiempos en segundos
  const recentTimes = performance.recentTimes
    .slice(-10)
    .map(t => Number((t / 1000).toFixed(3)));
  
  return {
    performance: {
      averageTime: Number(averageTime.toFixed(2)),
      totalRequests: performance.totalRequests,
      errorRate: errorRate,
      errorCount: performance.errorCount,
      recentTimes: recentTimes,
      lastRequestTime: performance.lastRequestTime
    },
    cache: {
      hitRate: hitRate,
      hits: cache.hits,
      misses: cache.misses,
      totalItems: cache.facturaCache.size,
      templateItems: cache.templateCache.size,
      maxSize: cache.maxCacheSize
    },
    system: {
      uptime: uptime,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    },
    tokenRenewal: {
      renewalCount: tokenRenewal.renewalCount,
      totalRenewals: tokenRenewal.totalRenewals,
      lastRenewal: tokenRenewal.lastRenewal,
      status: tokenRenewal.renewalCount < 5 ? 'healthy' : 
              tokenRenewal.renewalCount < 10 ? 'warning' : 'critical'
    }
  };
}

/**
 * Guarda una factura en el caché
 * @param {string} cacheKey - Clave del caché
 * @param {Object} data - Datos a cachear
 */
function saveCachedInvoice(cacheKey, data) {
  const store = global.metricsStore;
  
  // Limpiar caché si está lleno
  if (store.cache.facturaCache.size >= store.cache.maxCacheSize) {
    const firstKey = store.cache.facturaCache.keys().next().value;
    store.cache.facturaCache.delete(firstKey);
    console.log(`🗑️ Cache lleno - Eliminando: ${firstKey.substring(0, 8)}...`);
  }
  
  store.cache.facturaCache.set(cacheKey, {
    ...data,
    cachedAt: new Date().toISOString()
  });
  
  console.log(`💾 Factura cacheada: ${cacheKey.substring(0, 8)}... (Total: ${store.cache.facturaCache.size})`);
}

/**
 * Obtiene una factura del caché
 * @param {string} cacheKey - Clave del caché
 * @returns {Object|null} - Datos cacheados o null
 */
function getCachedInvoice(cacheKey) {
  const store = global.metricsStore;
  return store.cache.facturaCache.get(cacheKey) || null;
}

/**
 * Verifica si una factura existe en caché
 * @param {string} cacheKey - Clave del caché
 * @returns {boolean}
 */
function hasCachedInvoice(cacheKey) {
  return global.metricsStore.cache.facturaCache.has(cacheKey);
}

/**
 * Limpia todo el caché
 * @returns {Object} - Estadísticas de limpieza
 */
function clearAllCache() {
  const store = global.metricsStore;
  
  const facturaCount = store.cache.facturaCache.size;
  const templateCount = store.cache.templateCache.size;
  
  store.cache.facturaCache.clear();
  store.cache.templateCache.clear();
  store.system.lastCacheCleanup = Date.now();
  
  // Forzar garbage collection si está disponible
  if (global.gc) {
    try {
      global.gc();
      console.log('🗑️ Garbage collection ejecutado');
    } catch (e) {
      console.log('⚠️ Garbage collection no disponible');
    }
  }
  
  console.log(`🗑️ Cache limpiado: ${facturaCount} facturas, ${templateCount} templates`);
  
  return {
    facturasCleaned: facturaCount,
    templatesCleaned: templateCount,
    totalCleaned: facturaCount + templateCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Obtiene estadísticas del caché
 * @returns {Object} - Estadísticas del caché
 */
function getCacheStats() {
  const store = global.metricsStore;
  return {
    totalItems: store.cache.facturaCache.size,
    templateItems: store.cache.templateCache.size,
    maxSize: store.cache.maxCacheSize,
    hits: store.cache.hits,
    misses: store.cache.misses,
    hitRate: store.cache.hits + store.cache.misses > 0 
      ? Math.round((store.cache.hits / (store.cache.hits + store.cache.misses)) * 100)
      : 0,
    lastCleanup: store.system.lastCacheCleanup,
    memoryUsage: process.memoryUsage()
  };
}

/**
 * Resetea las métricas (solo para testing)
 */
function resetMetrics() {
  if (process.env.NODE_ENV === 'development') {
    const store = global.metricsStore;
    store.performance.totalRequests = 0;
    store.performance.totalTime = 0;
    store.performance.errorCount = 0;
    store.performance.recentTimes = [];
    store.cache.hits = 0;
    store.cache.misses = 0;
    console.log('🔄 Métricas reseteadas');
  }
}

/**
 * Guarda template compilado en caché
 * @param {string} templateHash - Hash del template
 * @param {Function} compiledTemplate - Template compilado
 */
function saveCompiledTemplate(templateHash, compiledTemplate) {
  const store = global.metricsStore;
  store.cache.templateCache.set(templateHash, {
    template: compiledTemplate,
    compiledAt: new Date().toISOString()
  });
  console.log(`📝 Template compilado cacheado: ${templateHash.substring(0, 8)}...`);
}

/**
 * Obtiene template compilado del caché
 * @param {string} templateHash - Hash del template
 * @returns {Function|null} - Template compilado o null
 */
function getCompiledTemplate(templateHash) {
  const store = global.metricsStore;
  const cached = store.cache.templateCache.get(templateHash);
  return cached ? cached.template : null;
}

module.exports = {
  recordMetric,
  getMetrics,
  saveCachedInvoice,
  getCachedInvoice,
  hasCachedInvoice,
  clearAllCache,
  getCacheStats,
  resetMetrics,
  saveCompiledTemplate,
  getCompiledTemplate
};
