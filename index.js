const express = require('express');
const cors = require('cors');
const { supabase } = require('./database.js'); 
const axios = require('axios');
const OptimizedInvoiceService = require('./lib/optimizedInvoiceService');
const { recordMetric, getMetrics, clearAllCache, getCacheStats } = require('./lib/globalMetricsStore');
const { getTemplateService } = require('./lib/templateService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Inicializar servicios optimizados
const optimizedService = new OptimizedInvoiceService();
const templateService = getTemplateService();

// Pre-cargar CSS al inicio del servidor
console.log('🚀 Iniciando servidor con optimizaciones...');
templateService.preloadCSS().then(() => {
  console.log('✅ CSS pre-cargado - Listo para generar facturas rápidas');
}).catch(err => {
  console.error('⚠️ Error pre-cargando CSS:', err.message);
});

app.post('/api/generate-invoice', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📥 Datos recibidos para generar factura');

    const { formato, repuestos, servicios, costos } = req.body;

    // Validar que los datos necesarios existen
    if (!formato || !costos) {
      recordMetric('error', Date.now() - startTime);
      return res.status(400).json({ error: 'Faltan datos para generar la factura.' });
    }

    // Generar clave de cache
    const cacheKey = optimizedService.generateCacheKey(req.body);
    
    // Verificar cache primero
    const cachedInvoice = optimizedService.getCachedInvoice(cacheKey);
    if (cachedInvoice) {
      const totalTime = Date.now() - startTime;
      console.log(`✅ Factura servida desde cache en ${totalTime}ms`);
      recordMetric('invoice_generated', totalTime);
      return res.status(200).json({ 
        invoiceUrl: cachedInvoice.url,
        cached: true,
        generationTime: totalTime
      });
    }

    // Generar HTML optimizado con CSS INLINE (sin request externo)
    console.log('🎨 Generando HTML optimizado con CSS inline...');
    const finalHtml = await optimizedService.generateOptimizedHTML({
      formato,
      repuestos,
      servicios,
      costos
    });

    console.log('📊 Estadísticas del HTML generado:');
    console.log(`   - Tamaño: ${finalHtml.length} caracteres`);
    console.log(`   - CSS: Embebido (sin requests externos)`);

    // Usar la API de conversión (cambiar por tu URL de Vercel)
    console.log('📄 Generando PDF con la API de conversión...');
    
    const apiUrl = process.env.PDF_API_URL || 'http://localhost:3000/api/convert/html-to-pdf';

    const response = await axios.post(apiUrl, {
      html: finalHtml,
      fileName: `${formato.clave_key}.pdf`,
      pdfOptions: {
        format: "A4",
        margin: {
          top: "15px",
          right: "15px", 
          bottom: "15px",
          left: "15px"
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const driveUrl = response.data?.data?.googleDrive?.viewLink || 
                     response.data?.data?.googleDrive?.downloadLink ||
                     response.data?.url || 
                     response.data?.driveUrl;

    if (!driveUrl) {
      throw new Error('No se pudo obtener la URL del PDF generado');
    }

    console.log('✅ PDF generado y subido a Google Drive');

    // Guardar en base de datos si está configurado
    if (supabase) {
      await saveToDatabase(formato, costos, driveUrl);
    }

    // Guardar en cache
    optimizedService.saveCachedInvoice(cacheKey, {
      url: driveUrl,
      timestamp: Date.now(),
      invoiceId: formato.clave_key
    });

    const totalTime = Date.now() - startTime;
    recordMetric('invoice_generated', totalTime);
    
    console.log(`✅ Factura generada exitosamente en ${totalTime}ms`);

    res.status(200).json({ 
      invoiceUrl: driveUrl,
      cached: false,
      generationTime: totalTime,
      optimization: 'CSS inline - Sin requests externos'
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    recordMetric('error', totalTime);
    console.error('❌ Error al generar la factura:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Ocurrió un error en el servidor al generar el PDF.',
      details: error.message
    });
  }
});

// Función para guardar en base de datos (opcional)
async function saveToDatabase(formato, costos, driveUrl) {
  try {
    const { data: existingInvoice } = await supabase
      .from('facturas')
      .select('id_formato')
      .eq('id_formato', formato.clave_key)
      .maybeSingle();

    if (existingInvoice) {
      await supabase
        .from('facturas')
        .update({ 
          precio_factura: costos.total,
          factura_pdf: driveUrl
        })
        .eq('id_formato', formato.clave_key);
    } else {
      await supabase
        .from('facturas')
        .insert({
          id_formato: formato.clave_key,
          precio_factura: costos.total,
          debe: costos.total,
          factura_pdf: driveUrl,
          estado: 'PENDIENTE',
          cliente: formato.nombre_cliente
        });
    }

    await supabase
      .from('formatos')
      .update({ url_documento: driveUrl })
      .eq('clave_key', formato.clave_key);
  } catch (error) {
    console.error('Error guardando en base de datos:', error.message);
  }
}

// Endpoint para métricas de rendimiento
app.get('/api/metrics', (req, res) => {
  try {
    const metrics = getMetrics();
    const cacheStats = getCacheStats();
    
    res.json({
      ...metrics,
      cache: {
        ...metrics.cache,
        stats: cacheStats
      },
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: 'Error obteniendo métricas' });
  }
});

// Endpoint para limpiar cache
app.post('/api/clear-cache', (req, res) => {
  try {
    const result = clearAllCache();
    res.json({ 
      message: 'Cache limpiado exitosamente',
      ...result
    });
  } catch (error) {
    console.error('Error limpiando cache:', error);
    res.status(500).json({ error: 'Error limpiando cache' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ Optimized Invoice Service initialized');
});
