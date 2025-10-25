/**
 * Template Service - Optimización de plantillas HTML
 * Pre-carga y cachea CSS para eliminar requests externos
 */

const axios = require('axios');
const crypto = require('crypto');

class TemplateService {
  constructor() {
    // Cache de CSS descargado
    this.cssCache = new Map();
    this.cssCacheTTL = 3600000; // 1 hora
    
    // Cache de templates compilados con CSS inline
    this.templateCache = new Map();
    this.templateCacheTTL = 3600000; // 1 hora
    
    // URL del CSS externo (puedes cambiarlo por tu propio CSS)
    this.cssUrl = process.env.CSS_URL || 'https://jowlin12.github.io/invoice/style-new.css';
    
    console.log('📄 TemplateService inicializado - CSS inline habilitado');
  }

  /**
   * Descarga y cachea el CSS externo
   */
  async fetchAndCacheCSS() {
    const cached = this.cssCache.get(this.cssUrl);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cssCacheTTL) {
        console.log(`✅ CSS cargado desde caché (Age: ${age}ms)`);
        return cached.css;
      } else {
        this.cssCache.delete(this.cssUrl);
      }
    }

    console.log('📥 Descargando CSS desde GitHub...');
    const startTime = Date.now();
    
    try {
      const response = await axios.get(this.cssUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      const css = response.data;
      const downloadTime = Date.now() - startTime;
      
      console.log(`✅ CSS descargado en ${downloadTime}ms (${css.length} bytes)`);
      
      // Cachear CSS
      this.cssCache.set(this.cssUrl, {
        css: css,
        timestamp: Date.now()
      });
      
      return css;
    } catch (error) {
      console.error('❌ Error descargando CSS:', error.message);
      
      // Retornar CSS básico de fallback
      return this.getFallbackCSS();
    }
  }

  /**
   * CSS de fallback en caso de que falle la descarga
   */
  getFallbackCSS() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
      .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
      .company-info { flex: 1; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .company-address { font-style: normal; }
      .invoice-title { text-align: right; }
      .invoice-number, .invoice-date { margin: 5px 0; font-size: 14px; }
      .customer-vehicle-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
      .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      .items-table th { background: #f5f5f5; font-weight: bold; }
      .totals-table { width: 40%; margin-left: auto; border-collapse: collapse; }
      .totals-table th, .totals-table td { border: 1px solid #ddd; padding: 10px; }
      .total-row { background: #f5f5f5; font-weight: bold; font-size: 1.2em; }
      .observations { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #333; }
      .notes-section { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; }
      .bank-details { margin: 15px 0; padding: 10px; background: #f5f5f5; }
      .thank-you { text-align: center; margin-top: 20px; font-weight: bold; }
    `;
  }

  /**
   * Genera template optimizado con CSS inline
   */
  async generateOptimizedTemplate(data) {
    const startTime = Date.now();
    
    // Obtener CSS (desde caché o descargando)
    const css = await this.fetchAndCacheCSS();
    
    // Generar clave de template basada en estructura
    const templateKey = this.generateTemplateKey(data);
    
    // Generar filas de repuestos
    const repuestos_html = this.generateRepuestosHTML(data.repuestos || []);
    
    // Generar filas de servicios
    const servicios_html = this.generateServiciosHTML(data.servicios || []);
    
    // Obtener información de la empresa desde variables de entorno o usar valores por defecto
    const companyName = process.env.COMPANY_NAME || 'MI EMPRESA';
    const companyAddress = process.env.COMPANY_ADDRESS || 'Dirección de la empresa';
    const companyCity = process.env.COMPANY_CITY || 'Ciudad, Departamento';
    const companyPhone = process.env.COMPANY_PHONE || 'Teléfono';
    const companyLogo = process.env.COMPANY_LOGO_URL || 'https://via.placeholder.com/150';
    
    // Template con CSS inline
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>COTIZACIÓN - ${data.formato?.clave_key || 'N/A'}</title>
    <style>
${css}
    </style>
</head>
<body>
    <header class="invoice-header">
        <div class="company-info">
            <img class="logo" alt="Logo Empresa" src="${companyLogo}">
            <address class="company-address">
                <strong>${companyName}</strong><br>
                ${companyAddress}<br>
                ${companyCity}<br>
                Tel: ${companyPhone}
            </address>
        </div>
        <div class="invoice-title">
            <h1>Cotización</h1>
            <div class="invoice-number">Remisión #<span>${data.formato?.clave_key || 'N/A'}</span></div>
            <div class="invoice-date">Fecha: <span>${data.formato?.fecha_entrada || new Date().toLocaleDateString('es-CO')}</span></div>
        </div>
    </header>

    <main>
        <section class="customer-vehicle-info">
            <div class="customer-details">
                <h2>Cliente</h2>
                <p>${data.formato?.nombre_cliente || 'N/A'}</p>
            </div>
            <div class="vehicle-details">
                <h2>Vehículo</h2>
                <p><strong>Marca:</strong> ${data.formato?.marca || 'N/A'}</p>
                <p><strong>Tipo:</strong> ${data.formato?.tipo_vehiculo || 'N/A'}</p>
                <p><strong>Placa:</strong> ${data.formato?.placa || 'N/A'}</p>
                <p><strong>Kilometraje:</strong> ${data.formato?.kilometraje || 'N/A'}</p>
            </div>
        </section>

        <section class="invoice-items">
            <h2>Detalle de Repuestos y Servicios</h2>
            <div class="table-wrapper">
                <table class="items-table">
                <thead>
                    <tr>
                        <th class="col-qty">Cant.</th>
                        <th class="col-desc">Descripción</th>
                        <th class="col-price">Vlr. Unit.</th>
                        <th class="col-price">Vlr. Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${repuestos_html}
                    ${servicios_html}
                </tbody>
                </table>
            </div>
        </section>

        <section class="invoice-summary">
            <table class="totals-table">
                <tbody>
                    <tr>
                        <th>Mano de Obra</th>
                        <td>${this.formatCurrency(data.costos?.mano_obra || 0)}</td>
                    </tr>
                    <tr>
                        <th>Otros Conceptos</th>
                        <td>$0.00</td>
                    </tr>
                    <tr class="total-row">
                        <th>Total a Pagar</th>
                        <td>${this.formatCurrency(data.costos?.total || 0)}</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="observations">
             <h2>Observaciones del Vehículo</h2>
             <p>${data.formato?.observaciones || 'Sin observaciones'}</p>
        </section>

    </main>

    <footer class="notes-section">
        <h2>Notas Adicionales</h2>
        <p>Si prefiere realizar el pago mediante transferencia bancaria, ponemos a su disposición las siguientes cuentas:</p>
        <div class="bank-details">
            <p><strong>Banco:</strong> Tu Banco</p>
            <p>Número de Cuenta: XXXX XXXX XXXX</p>
            <p>Tipo de Cuenta: Cuenta de Ahorros</p>
        </div>
         <p class="thank-you">¡Gracias por su confianza!</p>
    </footer>

</body>
</html>
    `.trim();
    
    const endTime = Date.now();
    console.log(`✅ Template generado con CSS inline en ${endTime - startTime}ms`);
    
    return html;
  }

  /**
   * Genera HTML de repuestos
   */
  generateRepuestosHTML(repuestos) {
    if (!repuestos || repuestos.length === 0) return '';
    
    return repuestos.map(r => `
                    <tr>
                        <td class="col-qty">${r.cantidad || 0}</td>
                        <td class="col-desc">${r.descripcion || 'Sin descripción'}</td>
                        <td class="col-price">${this.formatCurrency(r.costo_unitario || 0)}</td>
                        <td class="col-price">${this.formatCurrency((r.cantidad || 0) * (r.costo_unitario || 0))}</td>
                    </tr>`).join('');
  }

  /**
   * Genera HTML de servicios
   */
  generateServiciosHTML(servicios) {
    if (!servicios || servicios.length === 0) return '';
    
    return servicios.map(s => `
                    <tr>
                        <td class="col-qty">${s.cantidad || 1}</td>
                        <td class="col-desc">${s.descripcion || 'Sin descripción'}</td>
                        <td class="col-price">${this.formatCurrency(s.costo_unitario || 0)}</td>
                        <td class="col-price">${this.formatCurrency((s.cantidad || 1) * (s.costo_unitario || 0))}</td>
                    </tr>`).join('');
  }

  /**
   * Formatea moneda
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  /**
   * Genera clave de template basada en estructura
   */
  generateTemplateKey(data) {
    const structure = {
      hasRepuestos: (data.repuestos || []).length > 0,
      hasServicios: (data.servicios || []).length > 0,
      repuestosCount: (data.repuestos || []).length,
      serviciosCount: (data.servicios || []).length
    };
    
    return crypto.createHash('md5').update(JSON.stringify(structure)).digest('hex').substring(0, 8);
  }

  /**
   * Pre-carga el CSS al inicio
   */
  async preloadCSS() {
    console.log('🚀 Pre-cargando CSS...');
    await this.fetchAndCacheCSS();
    console.log('✅ CSS pre-cargado exitosamente');
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      cssCache: {
        size: this.cssCache.size,
        url: this.cssUrl,
        isCached: this.cssCache.has(this.cssUrl)
      },
      templateCache: {
        size: this.templateCache.size
      }
    };
  }

  /**
   * Limpia caches
   */
  clearCaches() {
    const cssCount = this.cssCache.size;
    const templateCount = this.templateCache.size;
    
    this.cssCache.clear();
    this.templateCache.clear();
    
    console.log(`🗑️ Caches limpiados: ${cssCount} CSS, ${templateCount} templates`);
    
    return { cssCount, templateCount };
  }
}

// Singleton
let templateServiceInstance = null;

function getTemplateService() {
  if (!templateServiceInstance) {
    templateServiceInstance = new TemplateService();
    
    // Pre-cargar CSS al inicio
    templateServiceInstance.preloadCSS().catch(err => {
      console.error('Error pre-cargando CSS:', err.message);
    });
  }
  return templateServiceInstance;
}

module.exports = {
  TemplateService,
  getTemplateService
};
