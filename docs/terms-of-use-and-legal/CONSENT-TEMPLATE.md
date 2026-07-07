# Plantillas de Consentimiento (Consent Templates)

**Proyecto:** Backend Template
**Creador/Responsable:** CodeIbra
**Version:** 1.0
**Fecha de entrada en vigor:** 1 de enero de 2026

---

## 1. Introduccion

### 1.1. Proposito

El presente documento recoge las plantillas de consentimiento utilizadas en el proyecto **Backend Template**, desarrollado por **CodeIbra**, para la recogida del consentimiento de los interesados en las distintas situaciones de tratamiento de datos personales.

### 1.2. Principios del Consentimiento

De conformidad con el Art. 7 del RGPD y el Art. 6 de la LOPDGDD, el consentimiento debe ser:

- **Libre**: sin coercion ni presion indebida
- **Especifico**: para fines determinados, explicitos y legitimos
- **Informado**: basado en informacion clara y accesible
- **Inequívoco**: manifestado mediante una accion positiva clara
- **Revocable**: el interesado puede retirarlo en cualquier momento

### 1.3. Registro del Consentimiento

Todos los consentimientos recogidos seran registrados y almacenados de forma segura, incluyendo:

- Identidad del interesado
- Fecha y hora del consentimiento
- Contenido exacto de la informacion proporcionada
- Finalidad especifica para la que se presta el consentimiento
- Medio utilizado para la recogida
- Evidencia del consentimiento (log, checkbox, etc.)

---

## 2. Consentimiento para el Tratamiento de Datos Personales

### 2.1. Plantilla — Registro de Cuenta

```
CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES
=======================================================

Proyecto: Backend Template
Responsable del Tratamiento: CodeIbra

INFORMACION BASICA DEL TRATAMIENTO
-----------------------------------

Responsable: CodeIbra
Finalidad: Gestion de su cuenta de usuario, incluyendo registro,
autenticacion, prestacion de servicios, soporte tecnico y atencion
al usuario.

Base legal: Ejecucion de un contrato (Art. 6.1.b RGPD).

Datos tratados: Nombre, apellidos, correo electronico, nombre de
usuario, contrasena (hash), y cualquier otro dato que usted
proporcione voluntariamente en su perfil.

Destinatarios: No se cederan datos a terceros, salvo obligacion
legal o para la prestacion del servicio (encargados del tratamiento).

Plazo de conservacion: Sus datos se conservaran mientras su cuenta
este activa. Una vez solicitada la baja, se bloquearan durante 2 anos.

Derechos: Puede ejercer sus derechos de acceso, rectificacion,
supresion, limitacion, portabilidad y oposicion contactando al DPO
en dpo@codeibra.dev.

Informacion adicional: Puede consultar la informacion completa en
nuestra Politica de Privacidad en [PRIVACY-POLICY.md].

CONSENTIMIENTO
--------------

Al marcar la siguiente casilla, declaro que:

  [ ] He leido y comprendo la informacion sobre el tratamiento de
      mis datos personales.

  [ ] Presto mi consentimiento para el tratamiento de mis datos
      personales conforme a lo descrito.

  [ ] Acepto los Terminos del Servicio y la Politica de Privacidad.

Fecha: [DD/MM/AAAA]
Usuario: [Nombre de usuario]
```

### 2.2. Plantilla — Creacion de Perfil (Datos Adicionales)

```
CONSENTIMIENTO PARA DATOS ADICIONALES DE PERFIL
================================================

Proyecto: Backend Template
Responsable: CodeIbra

Usted ha solicitado anadir informacion adicional a su perfil
(avatar, biografia, preferencias, datos de localizacion, etc.).

Finalidad del tratamiento: Personalizacion de su experiencia de
usuario y mejora del servicio.

Base legal: Su consentimiento (Art. 6.1.a RGPD).

Datos que se anadiran: [Lista de campos adicionales]

Puede retirar este consentimiento en cualquier momento eliminando
estos datos de su perfil o contactando con nuestro DPO.

  [ ] Doy mi consentimiento para el tratamiento de los datos
      adicionales de perfil indicados.

Fecha: [DD/MM/AAAA]
```

---

## 3. Consentimiento para Cookies

### 3.1. Plantilla — Banner de Cookies

```
AVISO DE COOKIES
=================

Backend Template utiliza cookies propias y de terceros para:

- [NECESARIAS] Garantizar el funcionamiento basico del servicio
- [PREFERENCIAS] Recordar sus preferencias (idioma, region, etc.)
- [ANALITICA] Analizar el uso del servicio para mejorarlo
- [MARKETING] Mostrar publicidad personalizada (solo con su consentimiento expreso)

Puede configurar sus preferencias o aceptar todas las cookies.
Mas informacion en nuestra [COOKIE-POLICY.md].

[+] ACEPTAR TODAS        [>] CONFIGURAR        [X] SOLO NECESARIAS
```

### 3.2. Plantilla — Panel de Configuracion de Cookies

```
CONFIGURACION DE COOKIES
=========================

Puede seleccionar que categorias de cookies acepta:

[ ] COOKIES TECNICAS (siempre activas)
    Necesarias para el funcionamiento del servicio.
    No requieren su consentimiento.
    Incluyen: sesion, CSRF, autenticacion, balanceo de carga.

[ ] COOKIES DE PREFERENCIAS
    Permiten recordar sus preferencias (idioma, tema, etc.).
    Finalidad: mejorar su experiencia de usuario.

[ ] COOKIES DE ANALITICA
    Nos ayudan a entender como utiliza el servicio para mejorarlo.
    Proveedores: Google Analytics, Amplitude, Segment.
    Datos recogidos: paginas visitadas, tiempo de sesion, errores.
    Informacion anonimizada.

[ ] COOKIES DE MARKETING
    Permiten mostrar publicidad personalizada y medir su efectividad.
    Proveedores: Google Ads, Meta (Facebook), LinkedIn.
    Datos recogidos: intereses, visitas a sitios web, conversiones.

[GUARDAR CONFIGURACION]    [ACEPTAR TODAS]    [RECHAZAR TODAS]

Puede cambiar esta configuracion en cualquier momento.
```

### 3.3. Registro de Consentimiento de Cookies

Cada vez que el usuario configura sus preferencias de cookies, se registra:

```json
{
  "userId": "usr_abc123",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "consentGiven": true,
  "categories": {
    "technical": true,
    "preferences": true,
    "analytics": false,
    "marketing": false
  },
  "ipAddress": "192.168.1.1 (anonimizada)",
  "userAgent": "Mozilla/5.0 ...",
  "version": "1.0"
}
```

---

## 4. Consentimiento para Comunicaciones Comerciales

### 4.1. Plantilla — Suscripcion a Newsletter

```
CONSENTIMIENTO PARA COMUNICACIONES COMERCIALES
===============================================

Proyecto: Backend Template
Responsable: CodeIbra

Deseo recibir comunicaciones comerciales sobre:

[ ] Novedades y actualizaciones del proyecto Backend Template
[ ] Ofertas y promociones especiales
[ ] Contenido tecnico y tutoriales
[ ] Eventos y webinars
[ ] Encuestas de satisfaccion

Medio de contacto:
[ ] Correo electronico: [email@ejemplo.com]
[ ] Notificaciones en la aplicacion

Frecuencia estimada: [Maximo 2 comunicaciones por semana]

Base legal: Su consentimiento (Art. 6.1.a RGPD)

Puede retirar su consentimiento en cualquier momento mediante:
- Enlace de "baja" en cada comunicacion
- Configuracion de su cuenta
- Contacto con nuestro DPO en dpo@codeibra.dev

  [ ] He leido la informacion y DOY mi consentimiento para recibir
      comunicaciones comerciales segun lo indicado.

Fecha: [DD/MM/AAAA]
```

### 4.2. Plantilla — Doble Opt-In (Verificacion)

```
CONFIRMACION DE SUSCRIPCION
============================

Gracias por suscribirse a nuestras comunicaciones.

Para confirmar su suscripcion, haga clic en el siguiente enlace:

[CONFIRMAR SUSCRIPCION]

Si no ha solicitado esta suscripcion, ignore este mensaje.

Este mensaje se ha enviado porque alguien solicito la suscripcion
desde la direccion IP [IP]. Si tiene alguna duda, contacte con
nuestro DPO en dpo@codeibra.dev.
```

### 4.3. Plantilla — Baja de Comunicaciones

```
CONFIRMACION DE BAJA
=====================

Ha solicitado darse de baja de nuestras comunicaciones comerciales.

Su direccion de correo [email] ha sido eliminada de nuestra lista
de distribucion.

Es posible que reciba algun mensaje adicional durante las proximas
48 horas debido a los ciclos de procesamiento.

Si desea volver a suscribirse, puede hacerlo en cualquier momento
desde su panel de usuario.

Gracias por su interes en Backend Template.
```

---

## 5. Consentimiento para Menores de Edad

### 5.1. Verificacion de Edad

```
VERIFICACION DE EDAD
=====================

Backend Template esta dirigido a mayores de 14 anos.

Para continuar con el registro, necesitamos verificar su edad:

  [ ] Soy mayor de 14 anos

Si es menor de 14 anos, no puede registrarse sin el consentimiento
de sus padres o tutores legales. Por favor, contacte con nosotros
en dpo@codeibra.dev para mas informacion.
```

### 5.2. Plantilla — Consentimiento Parental (Menores de 14 a 18 anos)

```
CONSENTIMIENTO PARENTAL / TUTOR LEGAL
======================================

Proyecto: Backend Template
Responsable: CodeIbra

Yo, [Nombre del padre/madre/tutor legal], con DNI/NIE [numero],
actuando en calidad de [padre / madre / tutor legal] del menor
[Nombre del menor], declaro:

Que he sido informado de los terminos y condiciones del proyecto
Backend Template, incluyendo la Politica de Privacidad y el
tratamiento de datos personales de mi hijo/a o tutelado/a.

Que AUTORIZO el tratamiento de los datos personales de mi hijo/a
o tutelado/a para los fines descritos en la Politica de Privacidad.

Datos del menor:
- Nombre: [Nombre del menor]
- Fecha de nacimiento: [DD/MM/AAAA]

Datos del padre/madre/tutor:
- Nombre: [Nombre del tutor]
- DNI/NIE: [Numero]
- Telefono: [Telefono de contacto]
- Correo electronico: [Email de contacto]

  [ ] Confirmo mi identidad y autoridad como padre/madre/tutor legal
  [ ] He leido y comprendo la Politica de Privacidad
  [ ] Autorizo el tratamiento de datos del menor segun lo descrito

Firma del padre/madre/tutor:
_________________________

Fecha: [DD/MM/AAAA]

IMPORTANTE: Para verificar la identidad y autoridad del firmante,
puede ser necesario adjuntar copia del DNI del tutor y del libro
de familia o documento equivalente.
```

---

## 6. Consentimiento para Categorias Especiales de Datos

### 6.1. Plantilla (si aplica en el futuro)

```
CONSENTIMIENTO PARA CATEGORIAS ESPECIALES DE DATOS
====================================================

Proyecto: Backend Template
Responsable: CodeIbra

De conformidad con el Art. 9 del RGPD, el tratamiento de categorias
especiales de datos (datos que revelen origen etnico o racial,
opiniones politicas, convicciones religiosas, afiliacion sindical,
datos geneticos, biometricos, de salud o vida sexual) requiere su
consentimiento explicito.

Categoria especial de datos a tratar: [Indicar categoria]
Finalidad: [Indicar finalidad especifica]
Periodo de conservacion: [Indicar periodo]

  [ ] DOY mi consentimiento explicito para el tratamiento de la
      categoria especial de datos indicada.

  [ ] Comprendo que puedo retirar este consentimiento en cualquier
      momento sin que ello afecte a la licitud del tratamiento basado
      en el consentimiento previo a su retirada.

Fecha: [DD/MM/AAAA]
```

---

## 7. Consentimiento para Transferencias Internacionales

### 7.1. Plantilla

```
CONSENTIMIENTO PARA TRANSFERENCIAS INTERNACIONALES DE DATOS
=============================================================

Proyecto: Backend Template
Responsable: CodeIbra

Le informamos que, para la prestacion de nuestros servicios, sus
datos personales pueden ser transferidos a paises fuera del Espacio
Economico Europeo (EEE) que no cuentan con una decision de adecuacion
de la Comision Europea.

Destinatario: [Nombre del destinatario]
Pais de destino: [Pais]
Finalidad de la transferencia: [Finalidad]
Garantias aplicables: [SCC / BCR / Otras]

  [ ] He sido informado de los riesgos potenciales de la transferencia
      internacional de mis datos a un pais sin decision de adecuacion.

  [ ] DOY mi consentimiento expreso para la transferencia internacional
      de mis datos personales segun lo descrito.

Fecha: [DD/MM/AAAA]
```

---

## 8. Retirada del Consentimiento

### 8.1. Procedimiento de Retirada

El interesado puede retirar su consentimiento en cualquier momento mediante:

| Canal | Datos | Instrucciones |
|-------|-------|---------------|
| Enlace en comunicaciones | Enlace de "baja" en cada email | Automatico |
| Panel de usuario | Configuracion > Privacidad | Desactivar casillas |
| Correo electronico | dpo@codeibra.dev | Indicar "Retirada de consentimiento" |
| Formulario web | https://codeibra.dev/privacy/withdraw | Cumplimentar formulario |

### 8.2. Efectos de la Retirada

- La retirada del consentimiento **no afectara a la licitud** del tratamiento basado en el consentimiento previo a su retirada (Art. 7.3 RGPD)
- La retirada del consentimiento **no afectara** al tratamiento basado en otras bases legales (contrato, obligacion legal, interes legitimo)
- Una vez retirado el consentimiento, cesaremos el tratamiento para la finalidad especifica para la que se presto

### 8.3. Plantilla — Confirmacion de Retirada

```
CONFIRMACION DE RETIRADA DE CONSENTIMIENTO
===========================================

Proyecto: Backend Template

Hemos recibido su solicitud de retirada de consentimiento para la
siguiente finalidad:

[Finalidad para la que se retira el consentimiento]

Su solicitud ha sido procesada con fecha [DD/MM/AAAA a las HH:MM].

A partir de esta fecha, sus datos personales ya no seran tratados
para la finalidad indicada. Los tratamientos basados en otras bases
legales (como la ejecucion del contrato o el cumplimiento de
obligaciones legales) no se ven afectados por esta retirada.

Si tiene alguna duda, puede contactar con nuestro DPO en
dpo@codeibra.dev.

Atentamente,
CodeIbra
```

---

## 9. Registro y Almacenamiento de Consentimientos

### 9.1. Informacion Registrada

Por cada consentimiento recogido, se registrara:

| Campo | Descripcion | Ejemplo |
|-------|-------------|---------|
| userId | Identificador del usuario | usr_abc123 |
| timestamp | Fecha y hora del consentimiento | 2026-01-15T10:30:00Z |
| type | Tipo de consentimiento | "marketing" |
| version | Version de la plantilla | "1.0" |
| content | Contenido mostrado al usuario | "Deseo recibir..." |
| ip | Direccion IP anonimizada | 192.168.x.x |
| userAgent | Navegador del usuario | Mozilla/5.0... |
| granted | Consentimiento concedido | true |

### 9.2. Almacenamiento Seguro

- Los registros de consentimiento se almacenan en base de datos cifrada
- Los registros son inmutables (write-once, append-only)
- El acceso a los registros esta restringido al DPO y personal autorizado
- Se realiza copia de seguridad diaria de los registros

### 9.3. Periodo de Conservacion

- Los registros de consentimiento se conservan mientras el consentimiento este vigente + 1 ano
- Una vez retirado el consentimiento, se conserva la prueba de la retirada durante 1 ano
- Transcurrido el plazo, se eliminan de forma segura

---

## 10. Actualizacion de las Plantillas

| Version | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 01/01/2026 | Version inicial |

Las plantillas seran revisadas y actualizadas:

- Anualmente, como parte de la auditoria de cumplimiento
- Ante cambios normativos significativos
- Ante cambios en los servicios que requieran nuevos tratamientos

---

## 11. Documentos Relacionados

- [PRIVACY-POLICY.md](PRIVACY-POLICY.md) — Politica de privacidad
- [COOKIE-POLICY.md](COOKIE-POLICY.md) — Politica de cookies
- [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md) — Acuerdo de tratamiento de datos
- [GDPR-CHECKLIST.md](GDPR-CHECKLIST.md) — Lista de verificacion RGPD
- [DPO-CONTACT.md](DPO-CONTACT.md) — Contacto del DPO
- [TERMS-OF-SERVICE.md](TERMS-OF-SERVICE.md) — Terminos del servicio

---

*Documento generado y mantenido por CodeIbra para el proyecto Backend Template.*
*Ultima actualizacion: 1 de enero de 2026*

---

**Backend Template** — Creado por CodeIbra
Copyright (c) [2026] CodeIbra. Todos los derechos reservados.
