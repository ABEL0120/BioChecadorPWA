# Reloj Nomina 2026# BioChecador PWA

Sistema avanzado de control de asistencia y biometria desarrollado como una Progressive Web App (PWA). Este aplicativo permite a los colaboradores registrar entradas, salidas y horarios de comida mediante una verificacion estricta de ubicacion geografica y autenticacion biometrica por hardware (huella dactilar, FaceID, Windows Hello).

## Caracteristicas Principales

### 1. Control de Asistencia Inteligente
*   **Transiciones de Estado Automaticas:** El sistema detecta y guia al empleado por el flujo correcto de marcaje (Entrada -> Salida a Comer -> Entrada de Comer -> Salida) basado en su historial diario.
*   **Calculo de Tolerancias y Retardos:** Evaluacion en tiempo real basada en el horario asignado al empleado, alertando sobre retardos o marcajes anticipados.

### 2. Geolocalizacion y Anti-Trampas
*   **Validacion Perimetral:** Uso de la formula de Haversine para garantizar que el empleado se encuentra dentro del radio permitido de la empresa.
*   **Seguridad Anti-Spoofing:** Monitoreo activo de senal GPS durante el escaneo biometrico para detectar saltos subitos de distancia, bloqueando el uso de aplicaciones tipo "Fake GPS".
*   **Excepciones Dinamicas:** Soporte para trabajadores remotos (Home Office) y adaptacion del hardware para equipos de escritorio donde la alta precision GPS no aplica.

### 3. Autenticacion Biometrica
*   **WebAuthn Integration:** Enrolamiento y verificacion utilizando el hardware criptografico del dispositivo nativo.
*   **Sin Contrasenas:** El marcaje diario se realiza unicamente comprobando la identidad fisica del trabajador autorizado.

### 4. Funcionamiento Offline (Modo Sin Conexion)
*   **PWA Cache & Service Workers:** Interfaz accesible aun sin cobertura de red.
*   **Almacenamiento Local:** Si un trabajador marca asistencia sin conexion, el registro es guardado en el dispositivo y sincronizado de forma transparente en cuanto se restablece la conexion a Internet o la aplicacion recupera el foco.

### 5. Gestion de Solicitudes
*   **Desvinculacion y Reseteo:** Los usuarios pueden enviar solicitudes directamente al administrador para restablecer sus credenciales biometricas ante cambios de dispositivo.

## Tecnologias Utilizadas

*   **Frontend Framework:** React 18
*   **UI Components:** Ionic Framework (React)
*   **Styling:** Tailwind CSS
*   **Build Tool:** Vite
*   **PWA & Caching:** Vite PWA Plugin / Workbox
*   **API Client:** Axios
*   **Biometrics:** @simplewebauthn/browser

## Arquitectura del Proyecto

*   `/src/api` - Clientes HTTP y configuracion de Axios para comunicacion con el backend.
*   `/src/components` - Componentes reutilizables de interfaz de usuario.
*   `/src/context` - Manejo de estado global (Sesiones).
*   `/src/hooks` - Logica de negocio encapsulada (ej. validacion de marcajes, estados de pantalla).
*   `/src/pages` - Vistas principales de la aplicacion (Home, Solicitudes, etc).
*   `/src/services` - Servicios integrados (Biometria, GPS, Tiempo y Sincronizacion Offline).
*   `/src/types` - Definiciones y contratos de TypeScript para la API.
*   `/src/utils` - Herramientas y parseo de errores.

## Ejecucion Local

1.  Instalar dependencias:
    `npm install`

2.  Levantar servidor de desarrollo:
    `npm run dev`

3.  Construir para produccion (Generara la PWA en `/dist`):
    `npm run build`
