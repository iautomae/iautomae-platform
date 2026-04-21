# Plan del Proyecto: Escolta

Este documento sirve como guía paso a paso para organizar el trabajo, las nuevas funcionalidades y el progreso del proyecto.

## 📝 Tareas Pendientes
- [ ] Definir los próximos objetivos y funcionalidades a desarrollar.

## 🚧 En Progreso
- [ ] (Añadir aquí lo que estemos trabajando en el momento)

## ✅ Tareas Completadas
- [x] Configuración inicial del entorno en la nueva PC.
- [x] Instalación de Git.
- [x] Clonado del repositorio (`opps-one`) usando autenticación con token.
- [x] Verificación de variables en Doppler.

---

## 🔒 Análisis de Seguridad y Plan de Rotación de Claves

He realizado un análisis profundo de la base de código y detectado "agujeros" donde se están filtrando o exponiendo claves críticas. 

### 🕵️ Detección de Agujeros de Seguridad (Etapas)

1. **Etapa de Pruebas / Scripts Utilitarios (Alta Vulnerabilidad):**
   - **Agujero:** Los scripts de prueba y validación manual como `test_webhook_manual.js` y `verify_pushover.js` contienen secretos *hardcodeados* (el secreto de webhooks de ElevenLabs y el JWT de autenticación de Supabase, respectivamente).
   - **Impacto:** Si un desarrollador empuja accidentalmente estos archivos a GitHub o alguien con acceso de lectura examina el código, obtiene acceso total a tu base de datos de Supabase y puede falsificar interacciones de llamadas de IA.
   - **Solución:** Limpiar los scripts para que consuman `process.env.ELEVENLABS_WEBHOOK_SECRET` y `process.env.SUPABASE_ANON_KEY`, forzando el uso de Doppler (`doppler run -- node ...`).

2. **Etapa Backend Edge Functions (Media Vulnerabilidad):**
   - **Agujero:** En la función de Supabase `whatsapp-webhook/index.ts`, la variable `VERIFY_TOKEN` tiene un valor de respaldo expuesto en texto plano (`|| "secury_webhook_2026"`).
   - **Impacto:** Si la variable de entorno no se inyecta correctamente al desplegar la función, el webhook acepta automáticamente `"secury_webhook_2026"` como contraseña para suscribirse a eventos de WhatsApp. Esto es muy predecible.
   - **Solución:** Eliminar el respaldo `|| "secury_webhook_2026"` y forzar que arroje error si no se pasa la configuración secreta por consola (`supabase secrets set`).

3. **Etapa Configuración General de Base de Datos y APIs (Baja Vulnerabilidad, pero riesgoso):**
   - **Observación:** Muchos scripts como `check-db.js`, `scripts/audit-leads.js`, etc., usan correctamente `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.SUPABASE_SERVICE_ROLE_KEY`. Sin embargo, dependen de `.env` locales que pueden filtrarse si no están bien en el `.gitignore`.
   - **Solución:** Reemplazar el flujo de trabajo para que ninguna configuración resida en un archivo `.env` local, sino que se gestione el 100% mediante Doppler CLI durante el desarrollo local.

4. **Etapa Base de Datos y Tipos (Correcto):**
   - **Observación:** Los tokens de usuarios (como `pushover_user_1_token`) están guardados en la base de datos (se refleja en `src/types/database.types.ts`). Esto es correcto a nivel de arquitectura, pero se recomienda asegurar las políticas RLS (Row Level Security) para que nadie no autorizado lea la tabla de agentes.

### 📝 Propuesta de Ejecución (Plan de Cierre de Filtros)

**Fase 1: Modificación de Código (Lo que yo haré)**
1. Limpiaré de inmediato `test_webhook_manual.js` para usar `process.env.ELEVENLABS_WEBHOOK_SECRET` y agregaré una capa de validación para lanzar error si falta.
2. Limpiaré `verify_pushover.js` para usar `process.env.SUPABASE_ANON_KEY` o el `SERVICE_ROLE` según corresponda.
3. Actualizaré `supabase/functions/whatsapp-webhook/index.ts` para eliminar el fallback en texto plano y hacer la función estricta con sus secretos.

**Fase 2: Rotación de Claves (Lo que tú harás en Doppler)**
*NOTA: Dado que las claves actuales están en el código, deben considerarse comprometidas. No basta con borrarlas, hay que rotarlas.*
1. **ElevenLabs:** Generarás un nuevo Webhook Secret en su plataforma y lo pegarás en tu proyecto Doppler como `ELEVENLABS_WEBHOOK_SECRET`.
2. **Supabase:** Si el proyecto está en producción y es crítico, regenerarás las llaves JWT (ANON y SERVICE ROLE) en el dashboard de Supabase (Settings > API) y actualizarás tu Doppler.
3. **Meta / WhatsApp:** Crearás un Verify Token completamente aleatorio y largo, actualizarás la consola de Meta Developers con él, y luego lo asignarás a la variable `WHATSAPP_VERIFY_TOKEN` en tus secretos de Supabase Functions usando el CLI.

**Fase 3: Limpieza en GitHub y Despliegue en Vercel (Paso Final)**
1. **Limpiar Historial/Código en Git:** Se deben hacer commits de los archivos `test_webhook_manual.js`, `verify_pushover.js` e `index.ts` ya limpios, y hacer un `git push` a la rama principal para que GitHub deje de tener las contraseñas en su código fuente actual.
2. **Rotación obligatoria (ElevenLabs):** Puesto que la clave de ElevenLabs quedó guardada en el historial de Git antiguo, es obligatorio generar una llave nueva en ElevenLabs y actualizar Doppler.
3. **Despliegue automático (Vercel):** Al hacer el `git push`, Vercel se actualizará automáticamente. Sin embargo, para que funcione, Doppler debe estar integrado a Vercel (Doppler > Project > Integrations > Vercel).

---

## 🛡️ Fase 4: Mejoras de Seguridad para Escalar (Pendientes)

Identificadas en auditoría del 21/04/2026. Implementar en orden de prioridad:

### 🔴 Alta Prioridad

1. **Limpiar Token de GitHub de la URL del remote**
   - **Problema:** El Personal Access Token (PAT) de GitHub está embebido directamente en la URL de `origin` (`git remote -v`), lo que lo expone a cualquier herramienta que lea la config de Git.
   - **Solución:**
     ```bash
     git remote set-url origin https://github.com/iautomae/opps-one.git
     ```
   - Luego usar autenticación por SSH o dejar que Git pida credenciales.

2. **Rotar `WHATSAPP_VERIFY_TOKEN`**
   - **Problema:** El valor actual en Doppler es `secury_webhook_2026`, predecible y con historial en el código.
   - **Solución:** Generar un token aleatorio (mín. 32 caracteres), actualizar en Doppler Y en la consola de Meta Developers simultáneamente.

### 🟡 Media Prioridad

3. **Proteger rutas del frontend en el Middleware**
   - **Problema:** `middleware.ts` maneja subdominios pero no valida sesión en rutas privadas del frontend. Un usuario sin sesión podría acceder a URLs internas si las conoce.
   - **Solución:** Agregar validación de cookie de sesión de Supabase en el middleware para redirigir al login si no hay sesión activa.

4. **Restringir CORS en el webhook de WhatsApp**
   - **Problema:** La función `whatsapp-webhook` tiene `Access-Control-Allow-Origin: *` (acepta cualquier origen).
   - **Solución:** Limitar a los IPs/dominios oficiales de Meta (`graph.facebook.com`).

5. **Rate Limiting en el webhook de ElevenLabs**
   - **Problema:** No hay límite de peticiones en `/api/webhooks/elevenlabs`. Un atacante podría bombardearlo y llenar la BD, aunque la firma HMAC evita contenido falso.
   - **Solución:** Activar Vercel Edge Rate Limiting o agregar un contador por IP con Redis/Upstash.

### 🟢 Mejoras Recomendadas (Nice to Have)

6. **Login con Google (OAuth)**
   - Supabase ya lo soporta nativamente. Solo activar en `Authentication > Providers > Google` y agregar credenciales de Google Cloud Console.
   - No requiere cambios en el código de autenticación actual.

7. **Autenticación en 2 pasos (2FA/TOTP)**
   - Supabase Auth soporta TOTP (Google Authenticator).
   - Habilitarlo opcionalmente para roles `admin` y `tenant_owner`.

8. **Auditoría de RLS (Row Level Security) en Supabase**
   - Verificar que las tablas `agentes`, `leads`, `profiles` y `conversaciones` tienen políticas RLS activas y bien configuradas para que cada `tenant_id` solo vea sus propios datos.
   - Usar el inspector de Supabase: `Database > Policies`.
