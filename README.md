# 🚀 HTML to PDF Converter API

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Convierte HTML a PDF con un API REST simple y poderoso**

*Conversión ultra-optimizada con Puppeteer + Browserless, almacenamiento automático en Google Drive y sistema de caché inteligente*

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

### ☁️ Almacenamiento Automático
- 📦 **Google Drive** integrado
- 🔗 **Enlaces públicos** automáticos
- 📁 **Organización** por carpetas
- 🔒 **Seguridad** OAuth2

</td>
<td width="50%">

### ⚡ Sistema de Caché Inteligente
- 🚀 **Nivel 1**: Resultado completo (~10-50ms)
- 🔥 **Nivel 2**: PDF pre-generado (~1500ms)
- 💾 **Solo documentos idénticos**
- 📊 **70-85% hit rate promedio**

### 🌐 Interfaz Completa
- 🖥️ **Editor web** incluido
- 📝 **Templates predefinidos**
- 🔌 **API REST** simple
- 📚 **Documentación** completa

</td>
</tr>
</table>

---

## 🚀 Demo en Vivo

<div align="center">

### 🌐 [**Prueba la Interfaz Web →**](https://tu-dominio.vercel.app)

### 📡 **API Endpoint**
```
POST https://tu-dominio.vercel.app/api/convert/html-to-pdf
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
git clone https://github.com/tu-usuario/html-to-pdf-api.git
cd html-to-pdf-api
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

# Browserless (Obligatorio)
BROWSERLESS_TOKEN=tu_browserless_token
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
   - Application type: Desktop app
   - Guarda Client ID y Client Secret

3. **Obtener Refresh Token:**
   ```bash
   node scripts/gen-refresh.js
   ```
   - Sigue las instrucciones del script
   - Autoriza la aplicación en tu navegador
   - Copia el código de autorización
   - Guarda el Refresh Token generado

4. **Crear carpeta en Google Drive:**
   - Crea carpeta en [Google Drive](https://drive.google.com)
   - Copia ID de la URL: `drive.google.com/drive/folders/[ID_AQUÍ]`

### Browserless Token

1. Regístrate en [Browserless.io](https://www.browserless.io/)
2. Plan gratuito incluye 6 horas/mes
3. Copia tu API Token del dashboard

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
   - Environment: Production + Preview + Development
   - Save cada una

4. **Re-desplegar:**
   - Deployments → último deployment → ⋯ → Redeploy
   - ✅ Use existing Build Cache → Redeploy

### Verificar Funcionamiento

```bash
# Health check
curl https://tu-dominio.vercel.app/api/health/check

# Debería retornar: {"status":"healthy",...}
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
| `fileName` | string | ❌ | Nombre del PDF (default: auto) |
| `pdfOptions` | object | ❌ | Opciones de formato |
| `pdfOptions.format` | string | ❌ | `A4`, `Letter`, `Legal` (default: A4) |
| `pdfOptions.margin` | object | ❌ | Márgenes `{top,right,bottom,left}` |

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
        print(f"✅ PDF generado: {result['data']['googleDrive']['viewLink']}")
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
    "html": "<html><body style=\"font-family: Arial;\"><h1>Documento Avanzado</h1></body></html>",
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

### Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    "pdf": {
      "fileName": "documento.pdf",
      "size": 25678,
      "sizeFormatted": "25.07 KB"
    },
    "googleDrive": {
      "fileId": "1a2b3c4d5e6f7g8h9i0j",
      "viewLink": "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view",
      "downloadLink": "https://drive.google.com/uc?export=download&id=1a2b3c4d5e6f7g8h9i0j"
    },
    "cached": false,
    "performance": {
      "totalTime": 2456,
      "conversionTime": 2100,
      "uploadTime": 356
    }
  }
}
```

---

## 📁 Estructura del Proyecto

```
📦 html-to-pdf-api
├── 📂 lib/                     # 🔧 Servicios Core
│   ├── pdfService.js           # 🎯 Conversión HTML → PDF
│   ├── googleDriveService.js   # ☁️ Almacenamiento automático
│   ├── aggressiveOptimizer.js  # ⚡ Sistema de caché
│   └── utils.js                # 🛠️ Utilidades
├── 📂 pages/
│   ├── index.js                # 🌐 Interfaz web
│   └── 📂 api/
│       ├── convert/
│       │   └── html-to-pdf.js  # ⭐ Endpoint principal
│       └── health/
│           └── check.js        # 💚 Health check
├── 📂 scripts/
│   └── gen-refresh.js          # 🔑 Generar tokens
├── 📄 next.config.js           # ⚙️ Config Next.js
├── 📄 vercel.json              # 🚀 Config Vercel
└── 📄 package.json             # 📦 Dependencias
```

---

## 🛠️ Stack Tecnológico

<div align="center">

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Framework** | Next.js | 14+ | Frontend + API Routes |
| **Runtime** | Node.js | 18+ | Servidor JavaScript |
| **PDF Engine** | Puppeteer | Latest | Control de Chrome headless |
| **Cloud Browser** | Browserless | - | Chrome en la nube |
| **Storage** | Google Drive API | v3 | Almacenamiento automático |
| **Auth** | OAuth 2.0 | - | Autenticación Google |
| **Deploy** | Vercel | - | Hosting serverless |

</div>

---

## 🐛 Solución de Problemas

<details>
<summary><strong>❌ Error: "invalid_grant" con Google OAuth</strong></summary>

**Causas comunes:**
- Client ID/Secret incorrectos
- Refresh token expirado
- App en modo "Testing"

**Solución:**
1. Verifica credenciales en Google Cloud Console
2. Regenera refresh token: `node scripts/gen-refresh.js`
3. Publica la app OAuth (salir de modo Testing)

</details>

<details>
<summary><strong>❌ Error: "File not found" en Google Drive</strong></summary>

**Causas:**
- Folder ID incorrecto
- Permisos insuficientes

**Solución:**
1. Verifica `GOOGLE_DRIVE_FOLDER_ID` en la URL de Drive
2. Asegúrate que la cuenta OAuth tenga acceso a la carpeta

</details>

<details>
<summary><strong>⏱️ Timeouts en Browserless</strong></summary>

**Causas:**
- HTML muy pesado
- Recursos externos lentos
- Límites del plan gratuito

**Solución:**
1. Optimiza HTML (reduce imágenes)
2. Usa URLs absolutas para recursos
3. Considera plan premium de Browserless

</details>

<details>
<summary><strong>🎨 PDF no se ve bien</strong></summary>

**Mejores prácticas:**
- ✅ Usa estilos inline o `<style>` en `<head>`
- ✅ URLs absolutas para imágenes
- ✅ Fuentes web-safe o Google Fonts
- ❌ Evita `@import` en CSS
- ❌ No uses recursos relativos

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
| [Discussions](https://github.com/tu-usuario/html-to-pdf-api/discussions) | [Issues](https://github.com/tu-usuario/html-to-pdf-api/issues) | [Feature Requests](https://github.com/tu-usuario/html-to-pdf-api/issues/new?template=feature_request.md) | [Wiki](https://github.com/tu-usuario/html-to-pdf-api/wiki) |

</div>

---

<div align="center">

### ⭐ ¿Te resultó útil? ¡Dale una estrella!

**Hecho con ❤️ por desarrolladores, para desarrolladores**

*Última actualización: Octubre 2025*

</div>