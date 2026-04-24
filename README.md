# everwith

> *siempre contigo*

Una app para parejas a distancia. Un gesto suave. Una presencia tranquila.

---

## Estructura del proyecto

```
everwith/
├── index.html              — App completa (HTML semántico, preparado para i18n)
├── css/
│   └── style.css           — Diseño minimalista, paleta emocional, mobile-first
├── js/
│   ├── i18n.js             — Sistema de idiomas (ES/EN/IT), detección automática
│   ├── auth.js             — Autenticación Supabase, persistencia de sesión
│   ├── realtime.js         — Estado compartido + toque efímero (sin persistencia)
│   ├── avatar.js           — Cambio de avatar propio, render de pareja
│   ├── background.js       — Partículas flotantes (fondo calmado)
│   └── app.js              — Orquestador principal
└── SUPABASE_SETUP.sql      — Schema de DB + guía paso a paso
```

---

## Configuración rápida

### 1. Supabase

Sigue el archivo `SUPABASE_SETUP.sql` paso a paso. En resumen:

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar el SQL para crear la tabla `profiles`
3. Activar RLS con las políticas incluidas
4. Activar Realtime en la tabla `profiles`
5. Copiar `Project URL` y `anon key`

### 2. Configurar credenciales

En `js/auth.js`, reemplaza:

```js
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY';
```

### 3. Abrir

Abre `index.html` directamente en el navegador, o usa un servidor local:

```bash
npx serve .
# o
python3 -m http.server 3000
```

---

## Funcionalidades

### ✅ Autenticación
- Email + contraseña con Supabase Auth
- La sesión persiste aunque el usuario recargue (F5)
- No hay logout accidental

### ✅ Vinculación de pareja
- Cada usuario recibe un código único de 6 caracteres
- Se vinculan introduciendo el código del otro
- La vinculación es bidireccional automáticamente

### ✅ "Estoy bien ❤️"
- Un botón. Un gesto.
- El timestamp se guarda en Supabase
- La pareja lo ve en tiempo real sin recargar

### ✅ Estados con lenguaje suave
| Tiempo desde el último gesto | Texto mostrado |
|-------------------------------|----------------|
| < 8 horas                    | "está bien (hace un rato)" |
| 8–24 horas                   | "hoy está desconectando 🌿" |
| > 24 horas o nunca           | "sin señal reciente 🌙" |

> Sin precisión exacta. Sin "activo hace 3 min". Sin presión.

### ✅ Toque efímero
- Pulsa el avatar de tu pareja → se envía una señal via Supabase Broadcast
- Si está con la app abierta → ve una animación de ondas suaves
- Si no está conectada → la señal desaparece sin rastro
- **No se guarda nada en la base de datos**
- No requiere respuesta. No deja huella.

### ✅ Cambio de avatar
- Pulsa tu propio avatar para abrirlo
- Sube una foto, se comprime automáticamente
- Tu pareja ve tu nuevo avatar en tiempo real

### ✅ Internacionalización (i18n)
- Español, Inglés, Italiano
- Detección automática del idioma del navegador
- Cambio manual desde cualquier pantalla
- Preferencia guardada en localStorage
- Sin recargar la página

---

## Principios de diseño

Este proyecto se diseñó bajo una regla de oro:

> *Si un elemento puede generar duda, presión o interpretación negativa → no pertenece a la app.*

- No hay "última conexión"
- No hay "visto"
- No hay notificaciones intrusivas
- No hay contadores ni badges
- El silencio no es un problema

---

## Para producción

- **Avatares**: migrar de base64 a Supabase Storage (ver comentarios en `SUPABASE_SETUP.sql`)
- **HTTPS**: obligatorio para que funcione el portapapeles y otras APIs
- **Variables de entorno**: no hardcodear las claves de Supabase en el código público. Usar un servidor o variables de entorno de tu hosting.
- **Verificación de email**: activar en Supabase Auth para mayor seguridad
