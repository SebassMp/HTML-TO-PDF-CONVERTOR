/**
 * Script para generar un nuevo refresh token con aplicación en modo PRODUCCIÓN
 * 
 * Este script ayuda a generar un nuevo refresh token que NO EXPIRA
 * cuando la aplicación de Google Cloud está en modo "Production"
 * 
 * IMPORTANTE: ANTES DE USAR ESTE SCRIPT:
 * 1. Ve a Google Cloud Console: https://console.cloud.google.com/
 * 2. Selecciona tu proyecto "tu proyecto"
 * 3. Ve a "APIs y servicios" > "Credenciales"
 * 4. Edita tu OAuth 2.0 Client ID
 * 5. En "URIs de redirección autorizados" agrega: http://localhost:8080
 * 6. Guarda los cambios
 * 
 * Instrucciones de uso:
 * 1. Ejecutar: node gen-refresh.js
 * 2. Abrir la URL generada en el navegador
 * 3. Autorizar la aplicación
 * 4. Copiar el código de la URL de error (después de "code=")
 * 5. Ejecutar nuevamente con el código: node gen-refresh.js [CODIGO]
 */

require('dotenv').config();
const { google } = require('googleapis');

// Configuración OAuth2 - USA VARIABLES DE ENTORNO
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'TU_CLIENT_ID_AQUI';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'TU_CLIENT_SECRET_AQUI';
const REDIRECT_URI = 'http://localhost:8080'; // URI válido que debe configurarse en Google Cloud Console

// Scopes necesarios para Google Drive
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
];

async function generateAuthUrl() {
    console.log('🔧 GENERADOR DE REFRESH TOKEN - MODO PRODUCCIÓN');
    console.log('================================================');
    
    // Verificar variables de entorno
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('❌ Error: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET son requeridos');
        console.log('Verifica tu archivo .env');
        process.exit(1);
    }
    
    console.log('✅ Variables de entorno encontradas');
    console.log(`📋 Client ID: ${CLIENT_ID.substring(0, 20)}...`);
    console.log(`📋 Redirect URI: ${REDIRECT_URI}`);
    
    // Verificar configuración de Google Cloud Console
    console.log('\n⚠️  VERIFICACIÓN PREVIA REQUERIDA:');
    console.log('=====================================');
    console.log('1. Ve a Google Cloud Console: https://console.cloud.google.com/');
    console.log('2. Selecciona tu proyecto "tu proyecto"');
    console.log('3. Ve a "APIs y servicios" > "Credenciales"');
    console.log('4. Edita tu OAuth 2.0 Client ID');
    console.log(`5. En "URIs de redirección autorizados" agrega: ${REDIRECT_URI}`);
    console.log('6. Guarda los cambios');
    console.log('\n¿Has configurado el redirect URI en Google Cloud Console? (y/n)');
    
    // Crear cliente OAuth2
    const oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );
    
    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Necesario para refresh token
        scope: SCOPES,
        prompt: 'consent' // Fuerza mostrar pantalla de consentimiento
    });
    
    console.log('\n🌐 PASO 1: Abrir esta URL en tu navegador:');
    console.log('==========================================');
    console.log(authUrl);
    console.log('\n📝 PASO 2: Después de autorizar la aplicación:');
    console.log('- Serás redirigido a una página de error (esto es normal)');
    console.log('- En la URL de la página de error, busca el parámetro "code="');
    console.log('- Copia SOLO el código (la parte después de "code=" y antes de "&")');
    console.log('\n🔄 PASO 3: Ejecuta el script con el código:');
    console.log(`node gen-refresh.js [CODIGO_AQUI]`);
    console.log('\n⚠️  IMPORTANTE: La aplicación debe estar en modo PRODUCCIÓN en Google Cloud Console');
    console.log('⚠️  El código expira en 10 minutos, úsalo rápidamente');
}

async function exchangeCodeForToken(authCode) {
    console.log('🔄 Intercambiando código por refresh token...');
    
    const oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );
    
    try {
        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(authCode);
        
        console.log('\n🎉 ¡TOKENS GENERADOS EXITOSAMENTE!');
        console.log('==================================');
        
        if (tokens.refresh_token) {
            console.log('✅ Refresh Token (PERMANENTE en modo producción):');
            console.log(tokens.refresh_token);
            console.log('\n📋 INSTRUCCIONES PARA ACTUALIZAR:');
            console.log('1. Copia el refresh token de arriba');
            console.log('2. Actualiza GOOGLE_REFRESH_TOKEN en tu .env');
            console.log('3. Actualiza la variable en Vercel:');
            console.log('   vercel env add GOOGLE_REFRESH_TOKEN');
            console.log('4. Redeploy tu aplicación en Vercel');
            
            // Información adicional del token
            console.log('\n📊 INFORMACIÓN DEL TOKEN:');
            console.log(`Access Token: ${tokens.access_token ? '✅ Generado' : '❌ No generado'}`);
            console.log(`Refresh Token: ${tokens.refresh_token ? '✅ Generado' : '❌ No generado'}`);
            console.log(`Expires In: ${tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'No especificado'}`);
            console.log(`Token Type: ${tokens.token_type || 'Bearer'}`);
            console.log(`Scope: ${tokens.scope || 'Scopes solicitados'}`);
            
        } else {
            console.log('⚠️  No se generó refresh token. Posibles causas:');
            console.log('- La aplicación no está en modo PRODUCCIÓN');
            console.log('- Ya existe un refresh token válido');
            console.log('- No se usó prompt=consent');
        }
        
        // Guardar en archivo temporal para referencia
        const fs = require('fs');
        const tokenData = {
            timestamp: new Date().toISOString(),
            mode: 'PRODUCTION',
            tokens: tokens
        };
        
        fs.writeFileSync('new-production-tokens.json', JSON.stringify(tokenData, null, 2));
        console.log('\n💾 Tokens guardados en: new-production-tokens.json');
        
    } catch (error) {
        console.error('❌ Error al intercambiar código por token:');
        console.error(error.message);
        
        if (error.message.includes('invalid_grant')) {
            console.log('\n💡 Posibles soluciones:');
            console.log('- El código expiró (genera uno nuevo)');
            console.log('- El código ya fue usado');
            console.log('- Verifica que CLIENT_ID y CLIENT_SECRET sean correctos');
        }
    }
}

// Función principal
async function main() {
    const authCode = process.argv[2];
    
    if (authCode) {
        await exchangeCodeForToken(authCode);
    } else {
        await generateAuthUrl();
    }
}

// Ejecutar
main().catch(console.error);