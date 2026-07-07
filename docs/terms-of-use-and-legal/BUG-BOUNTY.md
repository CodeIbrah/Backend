# Programa de Bug Bounty y Divulgación Responsable de Vulnerabilidades

**Proyecto:** Backend Template
**Creador:** CodeIbra
**Versión:** 1.0
**Fecha de entrada en vigor:** 1 de enero de 2026

---

## 1. Introducción

### 1.1. Propósito

En **CodeIbra** y el proyecto **Backend Template** estamos comprometidos con la seguridad de nuestros sistemas y la protección de los datos de nuestros usuarios. Para fomentar la investigación en seguridad y la divulgación responsable de vulnerabilidades, hemos establecido el presente programa de Bug Bounty, basado en las guías de **OWASP Coordinated Vulnerability Disclosure (CVD)** y las mejores prácticas del sector.

### 1.2. Filosofía

Creemos que la colaboración con la comunidad de investigadores de seguridad es fundamental para mantener un ecosistema digital seguro. Valoramos el trabajo de los investigadores que nos ayudan a identificar y corregir vulnerabilidades de manera responsable, y nos comprometemos a responder con prontitud y transparencia.

---

## 2. Alcance del Programa

### 2.1. Sistemas Dentro del Alcance

El programa cubre los siguientes sistemas y aplicaciones del proyecto Backend Template:

- **API Gateway** — puntos de entrada de la API REST
- **Main Monolith** — servicios principales del backend
- **Microservicios**: auth-service, users-service, payment-service, notifications-service, invoice-service, mail-service, sms-service
- **Sistema de autenticación** — JWT, OAuth2, gestión de sesiones
- **Sistema de autorización** — RBAC, RolesGuard
- **Sistema de gestión de colas** — BullMQ / Redis
- **Sistema de logs** — Winston / Loki
- **Sistema de métricas** — Prometheus / Grafana
- **Sistema de trazabilidad** — OpenTelemetry / Jaeger
- **Sistema de alertas** — Slack / PagerDuty
- **Sistema de diagnóstico** — AI Error Doctor
- **API de administración** — endpoints de gestión
- **Documentación pública** — Documentación técnica y API docs
- **Repositorios oficiales** — Repositorios GitHub del proyecto
- **Infraestructura cloud** — configuración de infraestructura desplegada

### 2.2. Sistemas Fuera del Alcance

Los siguientes sistemas quedan **EXPRESAMENTE EXCLUIDOS** del programa:

- Aplicaciones de terceros no controladas por CodeIbra
- Dispositivos físicos o infraestructura no gestionada por CodeIbra
- Servicios de terceros integrados (Stripe, etc.) — reportar directamente al proveedor
- Ataques de denegación de servicio (DoS/DDoS)
- Ataques de ingeniería social contra empleados o usuarios
- Ataques físicos a instalaciones o personal
- Spam, phishing o ataques de fuerza bruta
- Vulnerabilidades en dependencias de terceros ya reportadas públicamente (CVE conocido)
- Problemas de configuración que requieran acceso físico
- Versiones anteriores del software que ya no reciben soporte de seguridad

---

## 3. Tipos de Vulnerabilidades Buscadas

### 3.1. Vulnerabilidades de Alto Impacto (Prioridad Máxima)

- Inyección de código (SQLi, NoSQLi, Command Injection, LDAP Injection)
- Autenticación rota o bypass de autenticación
- Violación de control de acceso (IDOR, escalada de privilegios)
- Acceso no autorizado a datos de otros usuarios
- Ejecución remota de código (RCE)
- SSRF (Server-Side Request Forgery)
- Deserialización insegura
- Fuga de información sensible (tokens, claves, datos personales)
- Bypass de rate limiting que permita ataques de fuerza bruta masivos

### 3.2. Vulnerabilidades de Impacto Medio

- Cross-Site Scripting (XSS) reflejado o almacenado
- Cross-Site Request Forgery (CSRF)
- Path traversal
- HTTP Request Smuggling
- Open redirect
- Subdomain takeover
- Information disclosure menor
- Error handling inadecuado que revele información interna

### 3.3. Vulnerabilidades de Bajo Impacto

- Falta de cabeceras de seguridad (HSTS, X-Frame-Options, CSP)
- Versiones de software con vulnerabilidades conocidas (bajo riesgo)
- Falta de validación de entrada en campos no críticos
- Logging excesivo de información sensible
- Configuración insegura por defecto
- Clickjacking (sin explotabilidad demostrada)

---

## 4. Fuera del Alcance (Out of Scope)

Las siguientes actividades y tipos de reporte NO son elegibles para reconocimiento:

- Ataques de denegación de servicio (DoS/DDoS) de cualquier tipo
- Ataques de ingeniería social contra empleados (phishing, vishing, pretexting)
- Ataques físicos a instalaciones, oficinas o personal
- Spam, SMTP relay o problemas de configuración de correo
- Captcha bypass (sin demostración de impacto significativo)
- Vulnerabilidades en navegadores o plugins
- Vulnerabilidades que requieran acceso físico
- Keylogging, malware o técnicas que requieran compromiso del dispositivo del usuario
- Teoría sin demostración práctica de explotabilidad
- Reportes automatizados sin verificación manual
- Vulnerabilidades ya reportadas por otro investigador
- Vulnerabilidades en aplicaciones de terceros (reportar al proveedor correspondiente)
- Ausencia de HSTS, CSP u otras cabeceras de seguridad sin explotabilidad demostrada
- Enumeración de usuarios mediante diferencias en mensajes de error
- Falta de bloqueo de cuentas por intentos fallidos (sin bypass demostrado)

---

## 5. Cómo Reportar una Vulnerabilidad

### 5.1. Canal de Reporte

Las vulnerabilidades deben reportarse exclusivamente a través de:

**Correo electrónico cifrado:** security@codeibra.dev

**Clave PGP:**
```
Fingerprint: A1B2 C3D4 E5F6 7890 ABCD EF12 3456 789A BC0D E1F2
Clave disponible en: https://codeibra.dev/security/pgp-key.asc
```

**Alternativa (sin cifrar, no recomendado para datos sensibles):**
[Formulario web de reporte de seguridad](https://codeibra.dev/security/report)

### 5.2. Formato del Reporte

Para que un reporte sea procesado eficientemente, debe incluir:

```
===========================================
REPORTE DE VULNERABILIDAD DE SEGURIDAD
===========================================

1. INFORMACIÓN DEL INVESTIGADOR
   - Nombre o alias (para reconocimiento público)
   - Correo electrónico de contacto
   - Clave PGP (opcional)
   - ¿Desea aparecer en el Hall of Fame? (Sí/No)

2. RESUMEN
   - Tipo de vulnerabilidad:
   - Componente afectado:
   - Versión/sha del software:
   - URL/endpoint afectado:
   - Severidad estimada (Crítica/Alta/Media/Baja):

3. DESCRIPCIÓN DETALLADA
   - Descripción técnica de la vulnerabilidad
   - Categoría OWASP correspondiente
   - CVE asignado (si aplica)

4. PASOS PARA REPRODUCIR
   - Paso 1:
   - Paso 2:
   - Paso 3:
   - ...

5. IMPACTO
   - ¿Qué puede lograr un atacante?
   - ¿Qué datos pueden verse comprometidos?
   - ¿Se requiere autenticación?

6. EVIDENCIA (PoC)
   - Capturas de pantalla (sin datos sensibles)
   - Código de prueba (PoC simplificado)
   - Solicitudes/respuestas HTTP relevantes

7. MITIGACIÓN SUGERIDA
   - Sugerencia de corrección (si aplica)
   - Referencias a documentación relevante

8. DECLARACIONES
   - He actuado de buena fe y conforme a la política de Safe Harbor
   - No he accedido, modificado ni eliminado datos de otros usuarios
   - No he realizado ataques de denegación de servicio
   - No he divulgado esta vulnerabilidad a terceros
   - Este reporte se realiza conforme a los términos del programa
```

### 5.3. Información que NO debe incluirse en el Reporte

- Datos personales de usuarios reales (anonimizar cualquier PoC)
- Contraseñas o credenciales reales
- Tokens de acceso válidos
- Información de tarjetas de pago
- Cualquier dato que pueda identificar a otros usuarios

---

## 6. Proceso de Respuesta

### 6.1. Timeline de Respuesta

| Etapa | Tiempo | Descripción |
|-------|--------|-------------|
| **1. Acuse de recibo** | < 24 horas | Confirmación de recepción del reporte |
| **2. Clasificación** | < 72 horas | Evaluación inicial y clasificación de severidad |
| **3. Investigación** | < 7 días | Reproducción y análisis detallado |
| **4. Plan de mitigación** | < 14 días | Desarrollo de la corrección |
| **5. Parche** | < 30 días (dependiendo de severidad) | Implementación de la corrección |
| **6. Divulgación coordinada** | Acordada mutuamente | Publicación del advisory y reconocimiento |

### 6.2. Código de Conducta

Esperamos que todos los investigadores:

- Actúen de buena fe y dentro de los límites del programa
- No accedan, modifiquen ni destruyan datos que no les pertenezcan
- No realicen ataques que degraden el rendimiento del sistema
- No utilicen la vulnerabilidad para beneficio propio
- No divulguen la vulnerabilidad a terceros hasta su resolución
- Proporcionen suficiente información para reproducir el problema
- Mantengan la confidencialidad de los datos a los que accedan
- Eliminen cualquier dato de usuarios al que hayan accedido durante la investigación

---

## 7. Safe Harbor (Puerto Seguro)

### 7.1. Protección Legal

CodeIbra se compromete a:

- No emprender acciones legales contra investigadores que actúen de buena fe
- No solicitar la persecución penal de investigadores que cumplan con estas políticas
- Considerar las investigaciones como actividad autorizada bajo la ley aplicable
- Abogar por la exención de responsabilidad del investigador ante terceros

### 7.2. Condiciones de Aplicación

La protección Safe Harbor se aplica cuando el investigador:

1. Reporta la vulnerabilidad a través de los canales oficiales
2. No ha explotado la vulnerabilidad para acceder a datos de terceros
3. No ha destruido, modificado ni dañado datos o sistemas
4. No ha realizado ataques de denegación de servicio
5. Ha actuado sin ánimo de lucro o beneficio personal
6. Ha mantenido la confidencialidad hasta la resolución
7. No ha violado otras leyes aplicables en su investigación

### 7.3. Exclusiones de la Protección

La protección Safe Harbor NO se aplica a:

- Investigadores que actúen con fines maliciosos o ilícitos
- Actividades que causen daños a sistemas, datos o usuarios
- Divulgación pública de la vulnerabilidad sin coordinación previa
- Extorsión o intento de obtener beneficio económico mediante la vulnerabilidad

---

## 8. Reconocimiento y Recompensas

### 8.1. Programa de Reconocimiento

Backend Template opera un programa de reconocimiento **no monetario** basado en:

| Tipo de Reporte | Reconocimiento |
|----------------|---------------|
| Vulnerabilidad Crítica | Mención en Hall of Fame + Certificado de Reconocimiento |
| Vulnerabilidad Alta | Mención en Hall of Fame |
| Vulnerabilidad Media | Mención en página de agradecimientos |
| Vulnerabilidad Baja | Agradecimiento personal |
| Reportes duplicados | Agradecimiento (sin Hall of Fame) |

### 8.2. Hall of Fame

Los investigadores cuyos reportes sean aceptados aparecerán en el **Hall of Fame** de Backend Template, publicado en:
https://codeibra.dev/security/hall-of-fame

El investigador puede optar por:

- Aparecer con su nombre real o alias
- Incluir un enlace a su sitio web o perfil profesional
- Permanecer en el anonimato

### 8.3. Reconocimiento Especial

Para contribuciones excepcionales (vulnerabilidades críticas con PoC completo y sugerencias de mitigación), ofrecemos:

- Certificado de Reconocimiento firmado digitalmente por CodeIbra
- Menciones en redes sociales oficiales
- Invitación a programa beta de nuevas funcionalidades
- Posibilidad de colaboración continuada con el equipo de seguridad

---

## 9. Divulgación Coordinada

### 9.1. Proceso de Divulgación

Seguimos un proceso de divulgación coordinada basado en las guías OWASP CVD:

1. **Recepción**: el investigador reporta la vulnerabilidad
2. **Investigación**: nuestro equipo analiza y reproduce el problema
3. **Resolución**: desarrollamos e implementamos la corrección
4. **Confirmación**: solicitamos al investigador que confirme la corrección
5. **Divulgación**: publicamos un advisory de seguridad y reconocemos al investigador

### 9.2. Plazos de Divulgación

- En general, acordamos un plazo de divulgación de **90 días** desde la notificación
- Para vulnerabilidades críticas, el plazo puede reducirse a **30 días**
- Para vulnerabilidades de baja complejidad, el plazo puede ser de **14 días**
- Si no es posible corregir la vulnerabilidad en el plazo acordado, se informará al investigador de los motivos y se acordará un nuevo plazo

### 9.3. Publicación Coordinada

Tanto el investigador como CodeIbra se comprometen a:

- Coordinar la publicación de cualquier información relacionada con la vulnerabilidad
- No publicar detalles antes de la fecha acordada
- Reconocer mutuamente la contribución en las publicaciones
- Incluir referencias CVE en el advisory (si se asigna)

---

## 10. Preguntas Frecuentes (FAQ)

### 10.1. Generales

**P: ¿Ofrecen recompensas económicas?**
R: Actualmente no ofrecemos recompensas monetarias. Nuestro programa se basa en reconocimiento público y certificados.

**P: ¿Qué hago si encuentro una vulnerabilidad crítica?**
R: Reporte inmediatamente a security@codeibra.dev cifrado con PGP. No intente explotarla más allá de lo necesario para la verificación.

**P: ¿Puedo hacer público el hallazgo antes de que se corrija?**
R: No. La divulgación prematura pone en riesgo a los usuarios y puede resultar en la exclusión del programa.

**P: ¿Qué pasa si el reporte es duplicado?**
R: El primer reporte completo recibe el reconocimiento. Los duplicados reciben un agradecimiento.

### 10.2. Técnicas

**P: ¿Qué debo hacer con los datos a los que accidentalmente acceda?**
R: No los almacene, modifique ni comparta. Elimínelos inmediatamente e inclúyalo en su reporte.

**P: ¿Puedo probar vulnerabilidades en producción?**
R: Sí, pero debe minimizar el impacto. No realice pruebas destructivas, de denegación de servicio o que puedan afectar a otros usuarios.

**P: ¿Puedo usar herramientas automatizadas?**
R: Sí, pero evite generar tráfico excesivo que pueda degradar el servicio. Recomendamos usar entornos de prueba siempre que sea posible.

---

## 11. Contacto

**Equipo de Seguridad de Backend Template / CodeIbra**

Correo electrónico: security@codeibra.dev
Clave PGP: https://codeibra.dev/security/pgp-key.asc
Hall of Fame: https://codeibra.dev/security/hall-of-fame
Avisos de seguridad: https://codeibra.dev/security/advisories

**Alternativas:**
- Reporte anónimo: https://codeibra.dev/security/report
- Reporte de incidentes: incident@codeibra.dev

---

## 12. Documentos Relacionados

- [SECURITY-POLICY.md](SECURITY-POLICY.md) — Política de seguridad de la información
- [DATA-BREACH-POLICY.md](DATA-BREACH-POLICY.md) — Procedimiento de violaciones de datos
- [TERMS-OF-SERVICE.md](TERMS-OF-SERVICE.md) — Términos del servicio

---

## 13. Actualizaciones al Programa

CodeIbra se reserva el derecho de modificar los términos de este programa en cualquier momento. Los cambios serán publicados en este documento con la versión actualizada.

---

*Documento generado y mantenido por CodeIbra para el proyecto Backend Template.*
*Basado en las guías OWASP Coordinated Vulnerability Disclosure (CVD).*
*Última actualización: 1 de enero de 2026*

---

**Backend Template** — Creado por CodeIbra
Copyright (c) [2026] CodeIbra. Todos los derechos reservados.
