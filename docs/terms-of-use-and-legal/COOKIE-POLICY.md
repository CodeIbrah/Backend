# Politica de Cookies (Cookie Policy)

**Proyecto:** Backend Template
**Creador/Responsable:** CodeIbra
**Version:** 1.0
**Fecha de entrada en vigor:** 1 de enero de 2026

---

## 1. Introduccion

### 1.1. Proposito

La presente Politica de Cookies tiene como objetivo informar de manera clara y completa sobre el uso de cookies y tecnologias de seguimiento en el proyecto **Backend Template**, desarrollado por **CodeIbra**, de conformidad con lo establecido en la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Informacion y de Comercio Electronico (LSSI), y el Reglamento (UE) 2016/679 (RGPD).

### 1.2. Que son las Cookies

Una cookie es un pequeno archivo de texto que un sitio web almacena en el navegador del usuario cuando lo visita. Permite recordar las acciones y preferencias del usuario durante un tiempo, para que no tenga que volver a configurarlas cada vez que visite el sitio.

### 1.3. Consentimiento

Al acceder por primera vez a los servicios de Backend Template, se mostrara al usuario un aviso informativo sobre el uso de cookies con las siguientes opciones:

- **Aceptar todas**: consentimiento para todas las cookies
- **Configurar**: seleccion personalizada de cookies
- **Solo necesarias**: aceptacion de cookies tecnicas unicamente
- **Rechazar todas**: rechazo de cookies no esenciales

El usuario puede retirar su consentimiento en cualquier momento a traves de la configuracion de cookies disponible en el pie de pagina de la aplicacion.

---

## 2. Tipos de Cookies Utilizadas

### 2.1. Segun su Finalidad

| Tipo | Descripcion | Ejemplos |
|------|-------------|----------|
| **Tecnicas (Necesarias)** | Permiten la navegacion y el funcionamiento basico del servicio | Cookies de sesion, CSRF token, balanceo de carga |
| **De preferencias** | Recuerdan las preferencias del usuario | Idioma, region, tamano de fuente |
| **De analisis o medicion** | Recogen informacion sobre el uso del servicio para mejorarlo | Paginas visitadas, tiempo de sesion, errores |
| **De marketing** | Rastrean la actividad del usuario para mostrar publicidad personalizada | Redes sociales, anuncios personalizados |

### 2.2. Segun su Duracion

| Tipo | Descripcion | Duracion Tipica |
|------|-------------|-----------------|
| **Cookies de sesion** | Se eliminan al cerrar el navegador | Duracion de la sesion |
| **Cookies persistentes** | Permanecen en el dispositivo hasta su eliminacion o caducidad | Variable (1 dia a 2 anos) |

### 2.3. Segun su Origen

| Tipo | Descripcion |
|------|-------------|
| **Cookies propias** | Gestionadas por Backend Template / CodeIbra |
| **Cookies de terceros** | Gestionadas por proveedores externos (analitica, redes sociales) |

---

## 3. Lista Detallada de Cookies

### 3.1. Cookies Tecnicas (Necesarias)

Estas cookies son esenciales para el funcionamiento del servicio y no requieren consentimiento del usuario.

| Nombre | Proposito | Duracion | Tipo | Origen |
|--------|-----------|----------|------|--------|
| `session_id` | Identificador de sesion del usuario | Sesion | Tecnica | Propia |
| `csrf_token` | Token de proteccion contra CSRF | Sesion | Tecnica | Propia |
| `XSRF-TOKEN` | Token CSRF para Angular/Next.js | Sesion | Tecnica | Propia |
| `refresh_token` | Token para renovar JWT (httpOnly) | 7 dias | Tecnica | Propia |
| `auth_token` | Token de autenticacion JWT | 15 min | Tecnica | Propia |
| `cookie_consent` | Registro del consentimiento de cookies | 12 meses | Tecnica | Propia |
| `rate_limit` | Control de limite de peticiones | 1 minuto | Tecnica | Propia |
| `locale` | Preferencia de idioma | 12 meses | Preferencia | Propia |
| `load_balancer` | Persistencia de sesion en balanceador | Sesion | Tecnica | Propia |

### 3.2. Cookies de Analisis y Rendimiento

Estas cookies requieren consentimiento del usuario.

| Nombre | Proposito | Duracion | Tipo | Origen |
|--------|-----------|----------|------|--------|
| `_ga` | Identificador unico de usuario de Google Analytics | 2 anos | Analitica | Tercero (Google) |
| `_ga_*` | Identificador de sesion de Google Analytics | 2 anos | Analitica | Tercero (Google) |
| `_gid` | Identificador de sesion de Google Analytics | 24 horas | Analitica | Tercero (Google) |
| `_gat` | Limitador de tasa de peticiones de Google Analytics | 1 minuto | Analitica | Tercero (Google) |
| `_fbp` | Identificador de Facebook para seguimiento de conversiones | 3 meses | Analitica | Tercero (Meta) |
| `ajs_anonymous_id` | Identificador anonimo de Segment | 12 meses | Analitica | Tercero (Segment) |
| `ajs_user_id` | Identificador de usuario de Segment | 12 meses | Analitica | Tercero (Segment) |
| `amplitude_id` | Identificador de usuario de Amplitude | 12 meses | Analitica | Tercero (Amplitude) |

### 3.3. Cookies de Marketing y Publicidad

Estas cookies requieren consentimiento expreso del usuario.

| Nombre | Proposito | Duracion | Tipo | Origen |
|--------|-----------|----------|------|--------|
| `_gcl_au` | Conversion de anuncios de Google Ads | 3 meses | Marketing | Tercero (Google) |
| `_gac_*` | Conversion de anuncios de Google Analytics | 90 dias | Marketing | Tercero (Google) |
| `fr` | Entrega de anuncios de Facebook | 3 meses | Marketing | Tercero (Meta) |
| `tr` | Seguimiento de píxel de Facebook | Sesion | Marketing | Tercero (Meta) |
| `personalization_id` | Personalizacion de Twitter | 12 meses | Marketing | Tercero (Twitter) |
| `lang` | Preferencia de idioma de LinkedIn | Sesion | Marketing | Tercero (LinkedIn) |
| `UserMatchHistory` | Seguimiento de conversiones de LinkedIn | 30 dias | Marketing | Tercero (LinkedIn) |
| `bcookie` | Cookie de identificacion de LinkedIn | 12 meses | Marketing | Tercero (LinkedIn) |
| `lidc` | Enrutamiento de LinkedIn | 24 horas | Marketing | Tercero (LinkedIn) |

### 3.4. Cookies de Preferencias

| Nombre | Proposito | Duracion | Tipo | Origen |
|--------|-----------|----------|------|--------|
| `theme` | Preferencia de tema (claro/oscuro) | 12 meses | Preferencia | Propia |
| `sidebar_collapsed` | Estado de la barra lateral | 12 meses | Preferencia | Propia |
| `items_per_page` | Preferencia de elementos por pagina | 12 meses | Preferencia | Propia |
| `notifications_enabled` | Preferencia de notificaciones | 12 meses | Preferencia | Propia |

---

## 4. Cookies de Terceros

### 4.1. Google Analytics

Backend Template utiliza Google Analytics para analizar el uso del servicio y mejorar la experiencia del usuario. Google Analytics utiliza cookies propias para recopilar informacion anonima sobre las visitas.

**Informacion recogida:** paginas visitadas, tiempo de navegacion, origen geografico, navegador, dispositivo.
**Politica de privacidad:** https://policies.google.com/privacy
**Opt-out:** https://tools.google.com/dlpage/gaoptout

### 4.2. Stripe

Backend Template utiliza Stripe para el procesamiento de pagos. Stripe puede establecer cookies necesarias para el funcionamiento del modulo de pagos.

**Politica de privacidad:** https://stripe.com/privacy
**Opt-out:** Contactar con privacy@stripe.com

### 4.3. Redis (Cache de Sesion)

Backend Template utiliza Redis para almacenar sesiones de usuario y cache. Redis no establece cookies en el navegador del usuario, sino que utiliza almacenamiento en servidor.

### 4.4. Proveedores de Autenticacion Social

Si el usuario opta por registrarse mediante proveedores de identidad de terceros (Google, GitHub, Apple), dichos proveedores pueden establecer cookies segun sus propias politicas de privacidad.

---

## 5. Gestion de Cookies

### 5.1. Configuracion en la Aplicacion

El usuario puede configurar sus preferencias de cookies en cualquier momento a traves de:

- El banner de cookies inicial
- El panel de configuracion de cookies en el pie de pagina
- La seccion de "Privacidad" en la configuracion de la cuenta

### 5.2. Configuracion en el Navegador

El usuario puede permitir, bloquear o eliminar las cookies instaladas en su dispositivo mediante la configuracion del navegador:

| Navegador | Instrucciones |
|-----------|--------------|
| Google Chrome | Configuracion > Privacidad y seguridad > Cookies y otros datos de sitios |
| Mozilla Firefox | Opciones > Privacidad y seguridad > Cookies y datos del sitio |
| Microsoft Edge | Configuracion > Cookies y permisos del sitio > Administrar y eliminar cookies |
| Safari | Preferencias > Privacidad > Cookies y datos de sitios web |
| Opera | Configuracion > Privacidad y seguridad > Cookies |

### 5.3. Consecuencias de Deshabilitar Cookies

Si el usuario bloquea las cookies tecnicas (necesarias), el servicio puede no funcionar correctamente. En particular:

- La autenticacion puede no funcionar
- Las preferencias de idioma pueden no persistir
- La proteccion CSRF puede verse afectada
- Algunas funcionalidades de la API pueden dejar de estar disponibles

El bloqueo de cookies de analitica y marketing no afecta al funcionamiento basico del servicio.

---

## 6. Base Legal del Uso de Cookies

| Tipo de Cookie | Base Legal | Consentimiento Requerido |
|---------------|------------|-------------------------|
| Tecnicas (necesarias) | LSSI 34/2002 — Art. 22.2 | No (exentas) |
| De preferencias | LSSI 34/2002 + RGPD Art. 6.1.a | Si |
| De analitica | RGPD Art. 6.1.a — Consentimiento | Si |
| De marketing | RGPD Art. 6.1.a — Consentimiento expreso | Si (inequívoco) |

---

## 7. Transferencias Internacionales

Algunas cookies de terceros pueden implicar la transferencia de datos a paises fuera del Espacio Economico Europeo (EEUU principalmente). Estas transferencias se realizan con las siguientes garantias:

- **Google**: Adherido al Privacy Shield / Clausulas Contractuales Tipo
- **Meta (Facebook)**: Adherido al Privacy Shield / Clausulas Contractuales Tipo
- **LinkedIn**: Adherido al Privacy Shield / Clausulas Contractuales Tipo
- **Amplitude**: Data Processing Agreement con SCC
- **Segment**: Data Processing Agreement con SCC

---

## 8. Actualizaciones de la Politica de Cookies

CodeIbra se reserva el derecho de modificar la presente Politica de Cookies para adaptarla a cambios normativos, jurisprudenciales o del servicio. Las modificaciones sustanciales seran notificadas al usuario con antelacion suficiente.

Se recomienda al usuario revisar periodicamente esta Politica para estar informado de como se utilizan las cookies en Backend Template.

---

## 9. Contacto

Para cualquier consulta relacionada con la presente Politica de Cookies o el ejercicio de sus derechos:

**CodeIbra**
Correo electronico: dpo@codeibra.dev
Asunto: "Politica de Cookies"

---

## 10. Documentos Relacionados

- [PRIVACY-POLICY.md](PRIVACY-POLICY.md) — Politica de privacidad
- [CONSENT-TEMPLATE.md](CONSENT-TEMPLATE.md) — Plantillas de consentimiento
- [TERMS-OF-SERVICE.md](TERMS-OF-SERVICE.md) — Terminos del servicio
- [GDPR-CHECKLIST.md](GDPR-CHECKLIST.md) — Lista de verificacion RGPD

---

*Documento generado y mantenido por CodeIbra para el proyecto Backend Template.*
*Ultima actualizacion: 1 de enero de 2026*

---

**Backend Template** — Creado por CodeIbra
Copyright (c) [2026] CodeIbra. Todos los derechos reservados.
