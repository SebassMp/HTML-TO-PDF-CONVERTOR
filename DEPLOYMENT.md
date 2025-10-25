# 🚀 Guía de Despliegue en Vercel

Esta es una guía paso a paso para desplegar el proyecto **HTML to PDF Converter API** en Vercel.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta de GitHub
- ✅ Cuenta de Vercel (puedes usar tu cuenta de GitHub)
- ✅ Credenciales de Google Drive API configuradas
- ✅ Token de Browserless

---

## 🔧 Paso 1: Preparar las Credenciales

### **1.1 Google Drive API**

1. Ve a https://console.cloud.google.com/
2. Crea un proyecto nuevo
3. Habilita la **Google Drive API**
4. Crea credenciales **OAuth 2.0 Client ID** (tipo: Desktop app)
5. Ejecuta el script para obtener el refresh token:

```bash
node scripts/gen-refresh.js
```

6. Crea una carpeta en Google Drive y copia su ID de la URL

### **1.2 Browserless**

1. Regístrate en https://www.browserless.io/
2. Copia tu API Token desde el dashboard

---

## 📦 Paso 2: Subir a GitHub

```bash
# Inicializar Git
git init

# Agregar archivos
git add .

# Hacer commit
git commit -m "Initial commit - HTML to PDF Converter"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git branch -M main
git push -u origin main
```

---

## 🌐 Paso 3: Desplegar en Vercel

### **Método A: Desde el Dashboard (Recomendado)**

1. **Ir a Vercel**
   - Ve a https://vercel.com/
   - Haz login con tu cuenta de GitHub

2. **Importar Proyecto**
   - Clic en **"Add New"** > **"Project"**
   - Selecciona tu repositorio de GitHub
   - Clic en **"Import"**

3. **Configurar Proyecto**
   - Framework Preset: `Next.js` (autodetectado)
   - Root Directory: `./`
   - Build Command: `next build`
   - Output Directory: `.next`
   - **NO agregues variables de entorno aún**
   - Clic en **"Deploy"**

4. **Agregar Variables de Entorno**
   
   Una vez desplegado (fallará, es normal):
   
   - Ve a tu proyecto en Vercel
   - **Settings** > **Environment Variables**
   - Agrega estas variables **una por una**:

   ```bash
   GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=tu_client_secret
   GOOGLE_REFRESH_TOKEN=tu_refresh_token
   GOOGLE_DRIVE_FOLDER_ID=tu_folder_id
   BROWSERLESS_TOKEN=tu_browserless_token
   ```

   - Para cada variable, selecciona: **Production**, **Preview**, y **Development**
   - Clic en **"Save"** para cada una

5. **Re-desplegar**
   - Ve a **"Deployments"**
   - Encuentra el último deployment
   - Clic en los tres puntos `⋯` > **"Redeploy"**
   - Marca **"Use existing Build Cache"**
   - Clic en **"Redeploy"**

6. **Verificar que Funciona**
   
   ```bash
   # Probar health check
   curl https://tu-dominio.vercel.app/api/health/check
   ```

---

### **Método B: Desde CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Desplegar (primera vez)
vercel

# Configurar variables de entorno
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REFRESH_TOKEN
vercel env add GOOGLE_DRIVE_FOLDER_ID
vercel env add BROWSERLESS_TOKEN

# Desplegar a producción
vercel --prod
```

---

## ✅ Paso 4: Verificar el Despliegue

1. **Abrir tu sitio**: `https://tu-dominio.vercel.app`
2. **Probar la interfaz web**: Escribe HTML y convierte a PDF
3. **Probar la API**:

```bash
curl -X POST https://tu-dominio.vercel.app/api/convert/html-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>","fileName":"test.pdf"}'
```

---

## 🔍 Solución de Problemas

### **Error: "Missing environment variables"**

**Solución:**
- Verifica que todas las variables estén configuradas en Vercel
- Ve a Settings > Environment Variables
- Asegúrate de seleccionar Production, Preview y Development

### **Error: "invalid_grant"**

**Solución:**
- Tu refresh token puede estar expirado
- Regenera el refresh token con `node scripts/gen-refresh.js`
- Actualiza la variable en Vercel

### **Error: "Browserless timeout"**

**Solución:**
- Tu cuenta gratuita puede haber excedido el límite
- Verifica tu uso en https://www.browserless.io/dashboard
- Considera actualizar a un plan pagado

### **Error 500 en producción**

**Solución:**
- Ve a tu proyecto en Vercel > **"Deployments"**
- Clic en el deployment que falló
- Clic en **"View Function Logs"**
- Revisa los logs para identificar el error

---

## 🔄 Actualizar el Proyecto

```bash
# Hacer cambios locales
git add .
git commit -m "Descripción de cambios"
git push origin main

# Vercel desplegará automáticamente
```

---

## 📊 Monitoreo

- **Dashboard de Vercel**: https://vercel.com/tu-usuario/tu-proyecto
- **Logs en tiempo real**: Deployments > View Function Logs
- **Analytics**: Analytics (requiere plan Pro)

---

## 💡 Consejos

1. **Usa el plan gratuito de Vercel** para empezar (100GB bandwidth/mes)
2. **Browserless gratuito** incluye 6 horas/mes (suficiente para pruebas)
3. **Google Drive** tiene almacenamiento ilimitado con Workspace (o 15GB gratis)
4. **Configura un dominio personalizado** en Vercel > Settings > Domains

---

## 🎉 ¡Listo!

Tu API ya está desplegada y funcionando. Comparte tu URL con otros desarrolladores:

```
https://tu-dominio.vercel.app
```

---

**¿Problemas?** Abre un issue en el repositorio de GitHub.
