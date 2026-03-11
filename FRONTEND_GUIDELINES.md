# OPPS.ONE - Frontend Design & Development Guidelines

Este documento sirve como la única fuente de verdad (Single Source of Truth) para el diseño, los componentes y la experiencia de usuario (UI/UX) del proyecto OPPS.ONE. 
**Todos los asistentes de IA o desarrolladores deben revisar y seguir estas reglas antes de implementar cualquier nueva interfaz o modificar una existente.**

## 1. Identidad de Marca y Colores

El diseño debe transmitir un aspecto "premium", tecnológico y limpio (estilo Minimalista / Glassmorphism sutil).

*   **Primary (Turquoise):** `#2CDB9B` (usado para botones principales, acentos, links activos, destellos).
*   **Dark Green:** `#003327` (usado para fondos oscuros de contraste, cabeceras de tablas o secciones VIP).
*   **Mint (Claro):** Variantes suaves del turquesa para fondos de badges o contornos.
*   **Dark Theme (Brand Dark):** El dashboard principal utiliza grises muy oscuros (`bg-gray-900`, `bg-[#0a0a0a]`) o blancos limpios (`bg-white`) con sombras suaves (`shadow-sm`, `shadow-xl`) y bordes muy tenues (`border-gray-100`).

## 2. Iconografía y Carga (Loading)

*   **Librería Principal:** `lucide-react`. No se deben usar otras librerías de iconos a menos que se especifique.
*   **Estado de Carga (Loading):** 
    *   **Prohibido:** Usar iconos de flechas dando vueltas (ej. `RefreshCw`, `RefreshCcw`, `Loader2`, `RotateCw`, `RotateCcw`).
    *   **Obligatorio:** Utilizar SIEMPRE el icono **`LoaderCircle`** de `lucide-react`.
    *   **Componente Global:** Se debe usar el componente global `<LoadingSpinner />` (`src/components/ui/LoadingSpinner.tsx`) para mantener consistencia. Si se usa suelto, debe llevar la clase `animate-spin`.

## 3. Disposición y Tablas (Data Display)

*   **Estructura Base:** El layout de paneles internos utiliza `PanelPageLayout.tsx`. Las pantallas deben tener un espaciado generoso (padding `p-6` o `p-8`).
*   **Tablas de Datos (ej. Trámites):**
    *   Están basadas en diseños como `TramitesTableBase.tsx`.
    *   **Filtros en línea (Inline Filters):** Los filtros (ej. Modalidad, Fase) deben mostrarse en botones redondeados ("pill-shape") tipo chips contextuales (`FilterTabs.tsx`).
    *   **Badges de Estado:** Los estados (Completado, En Proceso, etc.) deben tener un "Badge" con fondo muy claro (ej. `bg-green-50`), texto de color fuerte (`text-green-700`) y bordes finos (`border-green-200`). **Los componentes en progreso llevan un `<LoadingSpinner size={12} />` al lado del texto.**
    *   **Visual Tracker:** Las tablas multi-etapa utilizan indicadores visuales de progreso estilo "Stepper" en lugar de simple texto (circulitos con checks verde para listos, gris para pendientes).

## 4. Modalidad y Formularios

*   **Campos de Texto (Inputs/Selects):** Redondeados (`rounded-2xl` o `rounded-xl`), fondos ligeros (`bg-gray-50`), fuentes semi-bold/mono cuando sea técnico (`font-mono`, `font-bold`), y anillos de focus amigables (`focus:ring-2 focus:ring-brand-primary/20`).
*   **Contraseñas:** Todos los campos de contraseñas deben tener un toggle de visibilidad utilizando `<Eye />` y `<EyeOff />` de `lucide-react`. (Visibilidad OFF = `EyeOff`, Visibilidad ON = `Eye`).
*   **Modales:** Deben tener un fondo con blur (`backdrop-blur-sm`, `bg-slate-900/40`), entrada con animación (`animate-in fade-in zoom-in-95 duration-300`), y esquinas muy redondeadas (`rounded-3xl` o `rounded-[2rem]`).

## 5. Reglas Técnicas (Next.js 15 & Tailwind)

*   **Directiva:** Asegurarse de usar `"use client"` al inicio de componentes que manejen estado (`useState`, `useEffect`, onClick).
*   **Rutas:** Utilizar la estructura de App Router (`src/app`).
*   **Tailwind:** Evitar utilidades CSS personalizadas en archivos CSS si Tailwind ya lo soporta. Usar la utilidad `cn()` de `clsx` y `tailwind-merge` para combinar clases de Tailwind condicionalmente (ej. `className={cn("base-classes", condition && "conditional-classes")}`).

## 6. Integraciones (Backend & APIs)

*   **Supabase:** Base de datos y Auth principal. Todos los accesos a BD desde el cliente deben usar el cliente configurado en `@/lib/supabase`. 
*   **Protección de Rutas (AuthGuard.tsx):** Ninguna ruta en `/(app)` es pública a menos que se trate del proceso de login. Todos pasan por la validación de `profile.has_leads_access` o `features.tramites`.
*   **Multi-tenant (SaaS):** Estructura multi-tenant, separar lógicamente los datos asegurándose siempre validar permisos (RLS policies) vía el `tenant_id` corporativo o `company` URL param. Independencia absoluta de datos entre inquilinos.

---
_Nota para agentes IA: Siempre lee este archivo antes de sugerir cambios grandes de UI/UX._
