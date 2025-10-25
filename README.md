# 🚀 HTML to PDF Converter API

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Convierte HTML a PDF con un API REST simple y poderoso**

*Conversión ultra-optimizada con Puppeteer + Browserless, almacenamiento automático en Google Drive y sistema de caché multi-nivel inteligente*

[🚀 Demo en Vivo](#-demo-en-vivo) • [📖 Documentación](#-guía-de-inicio-rápido) • [🛠️ Instalación](#️-instalación-local) • [🔧 API](#-uso-del-api)

</div>

---

## ✨ Características Principales

<table>
<tr>
<td width="50%">

### 🎯 Conversión Profesional
- ✅ **Alta calidad** con Puppeteer + Browserless
- ✅ **CSS completo** (inline, externos, fuentes)
- ✅ **Múltiples formatos** A4, Letter, Legal
- ✅ **Orientación** portrait/landscape
- ✅ **Márgenes personalizables**
- ✅ **Timeout optimizado** 15 segundos

### ☁️ Almacenamiento Automático
- 📦 **Google Drive** integrado con OAuth2
- 🔗 **Enlaces públicos** automáticos
- 📁 **Organización** por carpetas
- 🔒 **Seguridad** OAuth2
- 💾 **Persistencia** permanente

</td>
<td width="50%">

### ⚡ Sistema de Caché Multi-Nivel
- 🚀 **Nivel 1**: Resultado completo (10-50ms) - **99% más rápido**
- 🔥 **Nivel 2**: PDF pre-generado (1500ms) - **65% más rápido**  
- 💨 **Nivel 3**: HTML renderizado (3000ms) - **30% más rápido**
- 🎯 **Nivel 4**: Similitud fuzzy (10-50ms) - **99% más rápido**
- 🧹 **Limpieza automática** de caché obsoleto

### 🌐 Interfaz Completa
- 🖥️ **Editor web interactivo** incluido
- 📝 **Templates predefinidos** (simple, factura, reporte)
- 🔌 **API REST** fácil de integrar
- 📚 **Documentación** completa con ejemplos
- 📊 **Métricas** de rendimiento en tiempo real

</td>
</tr>
</table>

---

## 🚀 Demo en Vivo

<div align="center">

### 🌐 **Interfaz Web Interactiva**
```
https://tu-dominio.vercel.app
```

### 📡 **API Endpoint**
```
POST https://tu-dominio.vercel.app/api/convert/html-to-pdf
```

### 🏥 **Health Check**
```
GET https://tu-dominio.vercel.app/api/health/check
```

</div>

---

## 📖 Guía de Inicio Rápido

### 🔥 Prueba Inmediata (sin instalación)

```bash
# Prueba el API directamente
curl -X POST https://tu-dominio.vercel.app/api/convert/html-to-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>¡Hola Mundo!</h1><p>Mi primer PDF generado.</p></body></html>",
    "fileName": "mi-primer-pdf.pdf"
  }'
```

**¿Quieres tu propia instancia?** 👇 Sigue la [Instalación Local](#️-instalación-local)

---

## 🛠️ Instalación Local

### Prerrequisitos

```bash
node --version  # ✅ v18.0.0+
npm --version   # ✅ v9.0.0+
```

### 1️⃣ Clonar e Instalar

```bash
git clone https://github.com/SebassMp/HTML-TO-PDF-CONVERTOR.git
cd HTML-TO-PDF-CONVERTOR
npm install
```

### 2️⃣ Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Google Drive API (Obligatorio)
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REFRESH_TOKEN=tu_refresh_token
GOOGLE_DRIVE_FOLDER_ID=tu_folder_id

# Browserless (Obligatorio para producción)
BROWSERLESS_TOKEN=tu_browserless_token

# Entorno
NODE_ENV=development
```

### 3️⃣ Ejecutar

```bash
npm run dev
# ➜ http://localhost:3000
```

<details>
<summary><strong>📋 ¿Cómo obtener las credenciales?</strong></summary>

### Google Drive API

1. **Crear proyecto en Google Cloud:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea nuevo proyecto → APIs & Services → Library
   - Busca "Google Drive API" → Enable

2. **Crear credenciales OAuth2:**
   - APIs & Services → Credentials → + CREATE CREDENTIALS → OAuth 2.0 Client IDs
   - Configura pantalla de consentimiento (User Type: External)
   - Application type: **Desktop app**
   - Guarda Client ID y Client Secret

3. **Obtener Refresh Token:**
   ```bash
   # Asegúrate de tener tus credenciales en .env.local primero
   node scripts/gen-refresh.js
   ```
   - Sigue las instrucciones del script
   - Autoriza la aplicación en tu navegador
   - Copia el código de autorización
   - Ejecuta: `node scripts/gen-refresh.js [CODIGO]`
   - Guarda el Refresh Token generado

4. **Crear carpeta en Google Drive:**
   - Crea carpeta en [Google Drive](https://drive.google.com)
   - Copia ID de la URL: `drive.google.com/drive/folders/[ID_AQUÍ]`

### Browserless Token

1. Regístrate en [Browserless.io](https://www.browserless.io/)
2. Plan gratuito incluye **6 horas/mes**
3. Copia tu API Token del dashboard

**Nota:** En desarrollo local, el proyecto intentará usar Chrome/Edge instalado en tu sistema si no configuras Browserless.

</details>

---

## 🚀 Despliegue en Vercel

### Método Rápido (GitHub + Vercel)

1. **Subir a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

2. **Desplegar en Vercel:**
   - Ve a [vercel.com](https://vercel.com) → Add New → Project
   - Importa tu repositorio de GitHub
   - Framework: Next.js (auto-detectado)
   - Deploy (funcionará parcialmente sin variables)

3. **Configurar Variables de Entorno:**
   - Project → Settings → Environment Variables
   - Agrega todas las variables de `.env.local`
   - Environment: **Production + Preview + Development**
   - Save cada una

4. **Re-desplegar:**
   - Deployments → último deployment → ⋯ → Redeploy
   - ✅ Use existing Build Cache → Redeploy

### Verificar Funcionamiento

```bash
# Health check
curl https://tu-dominio.vercel.app/api/health/check

# Debería retornar:
# {
#   "status": "healthy",
#   "timestamp": "...",
#   "services": {
#     "googleDrive": "configured",
#     "browserless": "configured"
#   }
# }
```

---

## 🔧 Uso del API

### Endpoint Principal

```http
POST /api/convert/html-to-pdf
Content-Type: application/json
```

### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|:---------:|-------------|
| `html` | string | ✅ | Contenido HTML a convertir |
| `fileName` | string | ❌ | Nombre del PDF (default: auto-generado) |
| `pdfOptions` | object | ❌ | Opciones de formato |
| `pdfOptions.format` | string | ❌ | `A4`, `Letter`, `Legal` (default: A4) |
| `pdfOptions.margin` | object | ❌ | Márgenes `{top,right,bottom,left}` (default: 20px) |

### Ejemplos Prácticos

<details>
<summary><strong>JavaScript (Fetch API)</strong></summary>

```javascript
const convertToPDF = async (htmlContent, fileName = 'documento.pdf') => {
  try {
    const response = await fetch('/api/convert/html-to-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlContent,
        fileName: fileName,
        pdfOptions: {
          format: 'A4',
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Abrir PDF en nueva pestaña
      window.open(result.data.googleDrive.viewLink, '_blank');
      
      // O descargar directamente
      // window.open(result.data.googleDrive.downloadLink, '_blank');
      
      // Verificar si vino del caché
      if (result.cached) {
        console.log(`⚡ Servido desde caché nivel ${result.cacheLevel}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Uso
convertToPDF('<h1>Hola Mundo</h1>', 'mi-documento.pdf');
```

</details>

<details>
<summary><strong>Python (Requests)</strong></summary>

```python
import requests
import json

def convert_html_to_pdf(html_content, file_name="documento.pdf"):
    url = "https://tu-dominio.vercel.app/api/convert/html-to-pdf"
    
    payload = {
        "html": html_content,
        "fileName": file_name,
        "pdfOptions": {
            "format": "A4",
            "margin": {
                "top": "20px",
                "right": "20px", 
                "bottom": "20px",
                "left": "20px"
            }
        }
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result["success"]:
        print(f"✅ PDF generado: {result['data']['pdf']['fileName']}")
        print(f"📦 Tamaño: {result['data']['pdf']['size']}")
        print(f"🔗 Ver: {result['data']['googleDrive']['viewLink']}")
        
        if result.get('cached'):
            print(f"⚡ Desde caché nivel {result['cacheLevel']}")
        
        return result["data"]["googleDrive"]["downloadLink"]
    else:
        print(f"❌ Error: {result['error']['message']}")
        return None

# Uso
html = "<html><body><h1>Documento desde Python</h1></body></html>"
pdf_url = convert_html_to_pdf(html, "python-document.pdf")
```

</details>

<details>
<summary><strong>cURL</strong></summary>

```bash
# Ejemplo básico
curl -X POST https://tu-dominio.vercel.app/api/convert/html-to-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Documento cURL</h1><p>Generado desde terminal.</p></body></html>",
    "fileName": "curl-document.pdf"
  }'

# Con opciones avanzadas
curl -X POST https://tu-dominio.vercel.app/api/convert/html-to-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><head><style>body{font-family:Arial;padding:40px;}h1{color:#333;}</style></head><body><h1>Documento Avanzado</h1></body></html>",
    "fileName": "documento-avanzado.pdf",
    "pdfOptions": {
      "format": "Letter",
      "margin": {
        "top": "30px",
        "right": "30px",
        "bottom": "30px", 
        "left": "30px"
      }
    }
  }'
```

</details>

<details>
<summary><strong>Node.js (Axios)</strong></summary>

```javascript
const axios = require('axios');

async function convertToPDF() {
  try {
    const response = await axios.post(
      'https://tu-dominio.vercel.app/api/convert/html-to-pdf',
      {
        html: '<html><body><h1>Hola desde Node.js</h1></body></html>',
        fileName: 'nodejs-document.pdf',
        pdfOptions: {
          format: 'A4',
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        }
      }
    );

    console.log('✅ PDF generado:', response.data.data.pdf.fileName);
    console.log('📥 Descargar:', response.data.data.googleDrive.downloadLink);
    
    if (response.data.cached) {
      console.log(`⚡ Desde caché nivel ${response.data.cacheLevel}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

convertToPDF();
```

</details>

### Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    "pdf": {
      "fileName": "documento.pdf",
      "size": "25.07 KB",
      "sizeBytes": 25678
    },
    "googleDrive": {
      "fileId": "1a2b3c4d5e6f7g8h9i0j",
      "viewLink": "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view",
      "downloadLink": "https://drive.google.com/uc?export=download&id=1a2b3c4d5e6f7g8h9i0j",
      "directLink": "https://drive.google.com/uc?id=1a2b3c4d5e6f7g8h9i0j"
    },
    "processing": {
      "convertedAt": "2025-10-25T18:30:00.000Z",
      "totalTime": "2456ms",
      "breakdown": {
        "pdfConversion": "2100ms",
        "driveUpload": "356ms",
        "optimization": "15% HTML reduction"
      }
    }
  },
  "cached": false,
  "responseTime": 2456
}
```

### Respuesta desde Caché (Ultra-Rápida)

```json
{
  "success": true,
  "data": {
    // ... mismos datos ...
  },
  "cached": true,
  "cacheLevel": 1,
  "cacheAge": 45000,
  "timeSaved": "~4000ms",
  "responseTime": 35,
  "message": "Served from Level 1 cache"
}
```

---

## 📁 Estructura del Proyecto

```
📦 HTML-TO-PDF-CONVERTOR
├── 📂 lib/                          # 🔧 Servicios Core
│   ├── pdfService.js                # 🎯 Conversión HTML → PDF (Puppeteer + Browserless)
│   ├── googleDriveService.js        # ☁️ Subida y gestión en Google Drive
│   ├── aggressiveOptimizer.js       # ⚡ Sistema de caché multi-nivel (4 niveles)
│   ├── globalMetricsStore.js        # 📊 Métricas y estadísticas
│   ├── templateService.js           # 📝 Plantillas HTML predefinidas
│   └── utils.js                     # 🛠️ Utilidades y validaciones
│
├── 📂 pages/                        # Next.js Pages y API Routes
│   ├── index.js                     # 🌐 Interfaz web interactiva
│   └── 📂 api/
│       ├── convert/
│       │   └── html-to-pdf.js       # ⭐ Endpoint principal de conversión
│       ├── health/
│       │   └── check.js             # 💚 Health check y diagnóstico
│       └── clear-cache.js           # 🗑️ Limpiar caché manualmente
│
├── 📂 scripts/
│   └── gen-refresh.js               # 🔑 Generar refresh token de Google OAuth
│
├── 📄 next.config.js                # ⚙️ Configuración Next.js
├── 📄 vercel.json                   # 🚀 Configuración Vercel (timeouts, regiones)
├── 📄 package.json                  # 📦 Dependencias del proyecto
├── 📄 .env.example                  # 🔒 Template de variables de entorno
├── 📄 README.md                     # 📖 Este archivo
├── 📄 DEPLOYMENT.md                 # 🚀 Guía de despliegue detallada
├── 📄 CONTRIBUTING.md               # 🤝 Guía de contribución
├── 📄 RESUMEN-PROYECTO.md           # 📋 Resumen técnico del proyecto
└── 📄 LICENSE                       # 📜 Licencia MIT
```

---

## 🛠️ Stack Tecnológico

<div align="center">

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Framework** | Next.js | 14+ | Frontend + API Routes |
| **Runtime** | Node.js | 18+ | Servidor JavaScript |
| **PDF Engine** | Puppeteer Core | 24+ | Control de Chrome headless |
| **Cloud Browser** | Browserless | Production-SFO | Chrome en la nube (producción) |
| **Storage** | Google Drive API | v3 | Almacenamiento persistente |
| **Auth** | OAuth 2.0 | - | Autenticación Google |
| **Caché** | In-Memory Maps | - | Sistema multi-nivel personalizado |
| **Deploy** | Vercel | - | Hosting serverless |

</div>

---

## ⚡ Sistema de Caché Explicado

El proyecto implementa un sistema de caché multi-nivel ultra-inteligente:

### Nivel 1: Resultado Completo (10-50ms) ⚡
- Cachea la respuesta JSON completa incluyendo enlaces de Drive
- **Hit rate:** ~40% en uso típico
- **Ahorro:** ~4000ms por request

### Nivel 2: PDF Buffer (1500ms) 🔥  
- Cachea el PDF generado, solo requiere upload a Drive
- **Hit rate:** ~30% en uso típico
- **Ahorro:** ~2500ms por request

### Nivel 3: HTML Renderizado (3000ms) 💨
- Cachea el HTML pre-procesado por Puppeteer
- **Hit rate:** ~15% en uso típico
- **Ahorro:** ~1500ms por request

### Nivel 4: Similitud Fuzzy (10-50ms) 🎯
- Detecta documentos similares usando hashing inteligente
- **Configurable:** Deshabilitado por defecto para seguridad
- **Ahorro:** ~4000ms por request

### Limpieza Automática
- **TTL Nivel 1:** 5 minutos
- **TTL Nivel 2:** 10 minutos
- **TTL Nivel 3:** 15 minutos
- **TTL Nivel 4:** 5 minutos

---

## 🐛 Solución de Problemas

<details>
<summary><strong>❌ Error: "invalid_grant" con Google OAuth</strong></summary>

**Causas comunes:**
- Client ID/Secret incorrectos
- Refresh token expirado
- App en modo "Testing" (solo funciona 7 días)

**Solución:**
1. Verifica credenciales en Google Cloud Console
2. Regenera refresh token: `node scripts/gen-refresh.js`
3. **Publica la app OAuth** (salir de modo Testing):
   - Google Cloud Console → APIs & Services → OAuth consent screen
   - Click en **"PUBLISH APP"**

</details>

<details>
<summary><strong>❌ Error: "File not found" en Google Drive</strong></summary>

**Causas:**
- Folder ID incorrecto
- Permisos insuficientes

**Solución:**
1. Verifica `GOOGLE_DRIVE_FOLDER_ID` en la URL de Drive
2. Asegúrate que la cuenta OAuth tenga acceso a la carpeta
3. Verifica que la carpeta no esté en la papelera

</details>

<details>
<summary><strong>⏱️ Timeouts en Browserless</strong></summary>

**Causas:**
- HTML muy pesado (>10MB)
- Recursos externos lentos
- Límites del plan gratuito agotados

**Solución:**
1. Optimiza HTML (reduce imágenes, usa CDNs rápidos)
2. Usa URLs absolutas para todos los recursos
3. Verifica tu uso en [Browserless Dashboard](https://www.browserless.io/)
4. Considera upgradar al plan premium

</details>

<details>
<summary><strong>🎨 PDF no se ve bien</strong></summary>

**Mejores prácticas:**
- ✅ Usa estilos inline o `<style>` dentro de `<head>`
- ✅ URLs absolutas para imágenes (`https://...`)
- ✅ Fuentes web-safe (Arial, Times, Courier) o Google Fonts
- ✅ Define dimensiones explícitas (width, height)
- ❌ Evita `@import` en CSS
- ❌ No uses rutas relativas (`./imagen.png`)
- ❌ Evita JavaScript (no se ejecuta)

**Ejemplo de HTML bien formado:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <h1>Mi Documento</h1>
    <img src="https://ejemplo.com/imagen.jpg" alt="Imagen">
</body>
</html>
```

</details>

<details>
<summary><strong>🚀 Error al desplegar en Vercel</strong></summary>

**Causas comunes:**
- Variables de entorno no configuradas
- Límite de tamaño de función excedido
- Timeout de Vercel (10s en plan free)

**Solución:**
1. Verifica TODAS las variables en Vercel Settings
2. Asegúrate de tener Browserless configurado (no Puppeteer local)
3. El timeout ya está optimizado a 15s (dentro del límite de Vercel)
4. Verifica logs en Vercel Dashboard

</details>

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 🎉

1. **Fork** el proyecto
2. **Rama feature**: `git checkout -b feature/nueva-funcionalidad`
3. **Commit**: `git commit -m "feat: agregar nueva funcionalidad"`
4. **Push**: `git push origin feature/nueva-funcionalidad`
5. **Pull Request** con descripción detallada

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías detalladas.

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver [LICENSE](LICENSE) para detalles completos.

---

## 🆘 Soporte y Comunidad

<div align="center">

| 💬 Soporte | 🐛 Bugs | 💡 Features | 📖 Docs |
|------------|----------|-------------|----------|
| [Discussions](https://github.com/SebassMp/HTML-TO-PDF-CONVERTOR/discussions) | [Issues](https://github.com/SebassMp/HTML-TO-PDF-CONVERTOR/issues) | [Feature Requests](https://github.com/SebassMp/HTML-TO-PDF-CONVERTOR/issues/new) | [Wiki](https://github.com/SebassMp/HTML-TO-PDF-CONVERTOR/wiki) |

</div>

---

<div align="center">

### ⭐ ¿Te resultó útil? ¡Dale una estrella!

**Hecho con ❤️ por [@SebassMp](https://github.com/SebassMp)**

*Última actualización: Octubre 2025*

---

### 📊 Características del Proyecto

**22 archivos** • **5,000+ líneas de código** • **4 niveles de caché** • **99% más rápido con caché**

</div>