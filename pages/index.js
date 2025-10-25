import { useState } from 'react';
import Head from 'next/head';

/**
 * Conversor HTML a PDF - Interfaz Web
 * Permite convertir HTML a PDF desde la web o usar la API
 */
export default function Home() {
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mi Documento PDF</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px;
            line-height: 1.6;
        }
        h1 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        .highlight { 
            background-color: #fff3cd; 
            padding: 15px; 
            border-radius: 8px;
            border-left: 4px solid #ffc107;
        }
        .info-box {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #666;
            border-top: 2px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <h1>🚀 HTML to PDF Converter</h1>
    
    <div class="info-box">
        <h2>Bienvenido al Conversor HTML a PDF</h2>
        <p>Este documento fue generado automáticamente desde HTML.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
    </div>
    
    <div class="highlight">
        <h3>✨ Características:</h3>
        <ul>
            <li>✅ Conversión rápida de HTML a PDF</li>
            <li>✅ Subida automática a Google Drive</li>
            <li>✅ Enlaces públicos de descarga</li>
            <li>✅ API REST fácil de usar</li>
            <li>✅ Soporte para estilos CSS</li>
        </ul>
    </div>
    
    <h2>📋 Ejemplo de Contenido</h2>
    <p>Puedes incluir cualquier contenido HTML válido:</p>
    <ul>
        <li>Texto con formato</li>
        <li>Imágenes</li>
        <li>Tablas</li>
        <li>Estilos CSS personalizados</li>
    </ul>
    
    <div class="footer">
        <p>Generado por <strong>HTML to PDF API</strong></p>
        <p>Powered by Puppeteer + Google Drive</p>
    </div>
</body>
</html>`);

  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/convert/html-to-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          fileName: fileName || undefined,
          pdfOptions: {
            format: 'A4',
            margin: {
              top: '20px',
              right: '20px',
              bottom: '20px',
              left: '20px'
            }
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error.message || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (exampleType) => {
    const examples = {
      simple: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Documento Simple</title>
    <style>
        body { font-family: Arial; padding: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Hola Mundo</h1>
    <p>Este es un documento PDF simple.</p>
</body>
</html>`,
      
      invoice: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Factura</title>
    <style>
        body { font-family: Arial; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .total { font-weight: bold; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FACTURA #001</h1>
        <p>Fecha: ${new Date().toLocaleDateString()}</p>
    </div>
    <table>
        <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio</th>
        </tr>
        <tr>
            <td>Producto 1</td>
            <td>2</td>
            <td>$50.00</td>
        </tr>
        <tr>
            <td>Producto 2</td>
            <td>1</td>
            <td>$30.00</td>
        </tr>
        <tr>
            <td colspan="2" class="total">Total:</td>
            <td>$130.00</td>
        </tr>
    </table>
</body>
</html>`,
      
      report: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte</title>
    <style>
        body { font-family: Arial; padding: 40px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
        .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>📊 Reporte Mensual</h1>
    <div class="section">
        <h2>Resumen Ejecutivo</h2>
        <p>Este es un reporte generado automáticamente con datos del mes actual.</p>
    </div>
    <div class="section">
        <h2>Estadísticas</h2>
        <ul>
            <li>Total de ventas: $10,000</li>
            <li>Clientes atendidos: 50</li>
            <li>Tasa de satisfacción: 95%</li>
        </ul>
    </div>
</body>
</html>`
    };
    
    setHtmlContent(examples[exampleType]);
  };

  return (
    <>
      <Head>
        <title>HTML to PDF Converter - Online</title>
        <meta name="description" content="Convierte HTML a PDF en línea y guarda en Google Drive" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <header style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '36px',
              color: '#2c3e50', 
              margin: '0 0 10px 0'
            }}>
              🚀 HTML to PDF Converter
            </h1>
            <p style={{ color: '#666', fontSize: '18px', margin: 0 }}>
              Convierte HTML a PDF y guárdalo automáticamente en Google Drive
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Editor */}
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ marginBottom: '15px' }}>📝 Editor HTML</h2>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Nombre del archivo:
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="mi-documento.pdf"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Ejemplos rápidos:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => loadExample('simple')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Simple
                    </button>
                    <button
                      onClick={() => loadExample('invoice')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#9b59b6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Factura
                    </button>
                    <button
                      onClick={() => loadExample('report')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Reporte
                    </button>
                  </div>
                </div>

                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={20}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontFamily: 'Monaco, Consolas, monospace',
                    resize: 'vertical'
                  }}
                />

                <button
                  onClick={handleSubmit}
                  disabled={loading || !htmlContent.trim()}
                  style={{
                    width: '100%',
                    padding: '15px',
                    marginTop: '15px',
                    backgroundColor: loading ? '#95a5a6' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  {loading ? '⏳ Convirtiendo...' : '📄 Convertir a PDF'}
                </button>
              </div>
            </div>

            {/* Resultado */}
            <div>
              <h2 style={{ marginBottom: '15px' }}>📥 Resultado</h2>
              
              {!loading && !error && !result && (
                <div style={{ 
                  padding: '40px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px dashed #dee2e6'
                }}>
                  <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>📄</p>
                  <p style={{ color: '#666', margin: 0 }}>
                    Escribe tu HTML y presiona "Convertir a PDF"
                  </p>
                </div>
              )}

              {loading && (
                <div style={{ 
                  padding: '40px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
                  <h3 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>Procesando...</h3>
                  <p style={{ color: '#666', margin: 0 }}>
                    Convirtiendo HTML a PDF y subiendo a Google Drive
                  </p>
                </div>
              )}

              {error && (
                <div style={{ 
                  padding: '30px', 
                  backgroundColor: '#ffebee', 
                  borderRadius: '8px',
                  border: '2px solid #f44336'
                }}>
                  <h3 style={{ color: '#d32f2f', margin: '0 0 15px 0' }}>❌ Error</h3>
                  <p style={{ margin: 0, color: '#c62828' }}>{error}</p>
                </div>
              )}

              {result && (
                <div style={{ 
                  padding: '30px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '8px',
                  border: '2px solid #4caf50'
                }}>
                  <h3 style={{ color: '#2e7d32', margin: '0 0 20px 0' }}>✅ ¡PDF Generado!</h3>
                  
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '5px'
                  }}>
                    <p style={{ margin: '5px 0' }}>
                      <strong>📄 Archivo:</strong> {result.pdf.fileName}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>📦 Tamaño:</strong> {result.pdf.sizeFormatted}
                    </p>
                    {result.cached && (
                      <p style={{ margin: '5px 0', color: '#ff9800' }}>
                        <strong>⚡ Caché:</strong> Resultado desde caché
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <a
                      href={result.googleDrive.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      📥 Descargar PDF
                    </a>
                    
                    <a
                      href={result.googleDrive.viewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      👁️ Ver en Google Drive
                    </a>
                  </div>

                  <details style={{ marginTop: '20px' }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '5px'
                    }}>
                      📋 Ver respuesta completa (JSON)
                    </summary>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '15px', 
                      borderRadius: '5px',
                      fontSize: '12px',
                      overflow: 'auto',
                      marginTop: '10px'
                    }}>
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>

          <footer style={{ 
            marginTop: '50px', 
            padding: '30px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>🔌 Uso de la API</h3>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <p><strong>Endpoint:</strong> <code style={{ 
                backgroundColor: '#e9ecef', 
                padding: '3px 8px', 
                borderRadius: '3px' 
              }}>POST /api/convert/html-to-pdf</code></p>
              
              <p><strong>Content-Type:</strong> <code style={{ 
                backgroundColor: '#e9ecef', 
                padding: '3px 8px', 
                borderRadius: '3px' 
              }}>application/json</code></p>
              
              <p style={{ marginTop: '15px' }}><strong>Ejemplo de petición:</strong></p>
              <pre style={{ 
                backgroundColor: '#2c3e50', 
                color: '#ecf0f1',
                padding: '20px', 
                borderRadius: '5px',
                overflow: 'auto'
              }}>
{`{
  "html": "<html><body><h1>Hola Mundo</h1></body></html>",
  "fileName": "mi-documento.pdf",
  "pdfOptions": {
    "format": "A4",
    "margin": {
      "top": "20px",
      "right": "20px",
      "bottom": "20px",
      "left": "20px"
    }
  }
}`}
              </pre>

              <p style={{ marginTop: '15px' }}><strong>Ejemplo con cURL:</strong></p>
              <pre style={{ 
                backgroundColor: '#2c3e50', 
                color: '#ecf0f1',
                padding: '20px', 
                borderRadius: '5px',
                overflow: 'auto'
              }}>
{`curl -X POST https://tu-dominio.vercel.app/api/convert/html-to-pdf \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<h1>Hola Mundo</h1>",
    "fileName": "documento.pdf"
  }'`}
              </pre>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}