# Política de Seguridad de la Información

**Proyecto:** Backend Template
**Creador/Responsable:** CodeIbra
**Versión:** 1.0
**Fecha de entrada en vigor:** 1 de enero de 2026

---

## 1. Introducción y Alcance

### 1.1. Propósito

La presente Política de Seguridad de la Información (en adelante, "la Política") establece el marco de referencia para la gestión de la seguridad de la información en el proyecto **Backend Template**, desarrollado por **CodeIbra**. Su objetivo es proteger la confidencialidad, integridad y disponibilidad de la información, así como cumplir con los requisitos legales, regulatorios y contractuales aplicables.

### 1.2. Alcance

Esta Polística se aplica a:

- Todo el personal con acceso a los sistemas de Backend Template (desarrolladores, administradores, operadores)
- Todos los sistemas, aplicaciones, servicios y datos del Proyecto
- Todos los entornos (desarrollo, pruebas, staging, producción)
- Todos los proveedores y terceros con acceso a los sistemas
- Todos los dispositivos y redes utilizados para acceder a los sistemas

### 1.3. Marco Normativo

Esta Política se fundamenta en:

- ISO/IEC 27001:2022 — Sistema de Gestión de Seguridad de la Información
- ISO/IEC 27002:2022 — Código de buenas prácticas
- RGPD (Reglamento UE 2016/679) — Seguridad del tratamiento (Art. 32)
- ENS (Esquema Nacional de Seguridad) — RD 311/2022
- LOPDGDD (Ley Orgánica 3/2018) — Protección de datos
- PCI DSS v4.0 — Estándar de seguridad de datos de tarjetas de pago (aplicable a módulos de pago)
- OWASP Top 10 — Guías de desarrollo seguro

---

## 2. Principios de Seguridad

La seguridad de la información en Backend Template se rige por los siguientes principios:

1. **Confidencialidad**: la información solo será accesible por personas autorizadas
2. **Integridad**: la información será exacta, completa y protegida contra modificaciones no autorizadas
3. **Disponibilidad**: la información y los sistemas estarán accesibles cuando se necesiten
4. **Trazabilidad**: todas las operaciones serán registradas y auditables
5. **Autenticidad**: se verificará la identidad de usuarios y sistemas
6. **No repudio**: las acciones quedarán registradas de forma que no puedan ser negadas
7. **Resiliencia**: el sistema mantendrá su funcionamiento ante incidentes

---

## 3. Roles y Responsabilidades

### 3.1. Responsable de Seguridad

- Define y mantiene la Política de Seguridad
- Supervisa la implementación de las medidas de seguridad
- Coordina la respuesta ante incidentes de seguridad
- Realiza evaluaciones de riesgo periódicas

### 3.2. Administradores de Sistemas

- Implementan y mantienen las medidas de seguridad técnicas
- Gestionan accesos y permisos
- Aplican parches y actualizaciones de seguridad
- Realizan copias de seguridad y verifican su integridad

### 3.3. Desarrolladores

- Siguen las guías de desarrollo seguro
- Realizan revisiones de código con enfoque de seguridad
- Reportan vulnerabilidades detectadas
- Participan en formaciones de seguridad

### 3.4. Todos los Usuarios

- Cumplen con las políticas de seguridad establecidas
- Reportan incidentes de seguridad de forma inmediata
- Protegen sus credenciales de acceso
- No comparten información confidencial

---

## 4. Control de Acceso

### 4.1. Principio de Mínimo Privilegio

Todos los accesos se concederán según el principio de mínimo privilegio: cada usuario, sistema o proceso dispondrá únicamente de los permisos estrictamente necesarios para realizar sus funciones.

### 4.2. Autenticación

| Tipo de Acceso | Método | MFA Requerido |
|---------------|--------|---------------|
| Acceso administrativo | JWT + MFA | Sí |
| Acceso a producción | JWT + MFA + VPN | Sí |
| Acceso a base de datos | Certificado + contraseña | Sí |
| API (usuarios) | JWT (RS256) | No |
| API (servicios internos) | Token de servicio + mTLS | Sí |
| Acceso SSH | Clave SSH + MFA | Sí |
| Panel de administración | JWT + MFA | Sí |
| Acceso a logs | JWT + RBAC | No (con límites) |

### 4.3. Gestión de Identidades

- Cada persona dispondrá de un identificador único e intransferible
- Las cuentas compartidas o genéricas están prohibidas
- Las cuentas de servicio se auditarán trimestralmente
- Las cuentas inactivas durante más de 90 días se desactivarán automáticamente
- Las cuentas de personal que cause baja se desactivarán en un plazo máximo de 24 horas

### 4.4. Control de Acceso Basado en Roles (RBAC)

| Rol | Acceso a Datos | Acceso a Sistemas | Acceso a Configuración |
|-----|---------------|-------------------|----------------------|
| Invitado | Solo datos públicos | API pública | No |
| Usuario registrado | Datos propios | API autenticada | No |
| Desarrollador | Datos de prueba | Staging, Desarrollo | Parcial |
| Administrador | Todos los datos | Todos los entornos | Total |
| Auditor | Solo lectura logs | Solo logs | No |

### 4.5. Revisión de Accesos

- Revisión mensual de accesos privilegiados
- Revisión trimestral de todos los accesos
- Revisión inmediata ante cambios de rol o baja
- Registro de todas las revisiones realizadas

---

## 5. Cifrado y Protección de Datos

### 5.1. Cifrado en Tránsito

Todo el tráfico de red que transporte datos sensibles deberá ir cifrado mediante TLS 1.2 o superior:

| Canal | Protocolo | Versión Mínima |
|-------|-----------|---------------|
| HTTP/HTTPS | TLS | 1.2 (recomendado 1.3) |
| API Gateway | TLS | 1.3 |
| Base de datos | TLS | 1.2 |
| Redis | TLS | 1.2 |
| Servicio a servicio | mTLS | 1.3 |
| VPN | WireGuard/IPsec | N/A |

### 5.2. Cifrado en Reposo

Los datos almacenados se cifrarán según la siguiente clasificación:

| Tipo de Dato | Algoritmo | Clave | Rotación |
|-------------|-----------|-------|----------|
| Contraseñas | bcrypt (cost 12) | N/A (hash) | No aplica |
| Tokens de autenticación | SHA-256 (hash) | N/A (hash) | Por usuario |
| Datos de pago | AES-256-GCM | 256 bits | 90 días |
| Datos personales | AES-256-CBC | 256 bits | 180 días |
| Logs de auditoría | AES-256-CBC | 256 bits | 180 días |
| Copias de seguridad | AES-256-GCM | 256 bits | 90 días |
| Variables de entorno | AES-256-GCM | 256 bits | 30 días |

### 5.3. Gestión de Claves

- Las claves de cifrado se almacenan en un gestor de claves dedicado (vault/HashiCorp Vault)
- Las claves se rotan periódicamente según la política establecida
- El acceso a las claves se audita y restringe al mínimo personal necesario
- Las claves comprometidas se rotan inmediatamente

---

## 6. Seguridad en el Desarrollo

### 6.1. Ciclo de Vida de Desarrollo Seguro (SDLC)

El desarrollo de Backend Template sigue un ciclo de vida seguro que incluye:

1. **Planificación**: análisis de requisitos de seguridad y modelado de amenazas
2. **Diseño**: revisión de arquitectura con criterios de seguridad (OWASP ASVS)
3. **Desarrollo**: codificación segura siguiendo OWASP Top 10 y guías internas
4. **Pruebas**: tests de seguridad automatizados (SAST, DAST, SCA)
5. **Despliegue**: revisión de seguridad pre-producción
6. **Operación**: monitorización continua y respuesta a incidentes
7. **Mantenimiento**: gestión de parches y actualizaciones

### 6.2. Pruebas de Seguridad

| Tipo de Prueba | Frecuencia | Herramienta |
|---------------|------------|-------------|
| SAST (Static Analysis) | Cada commit | ESLint seguridad, SonarQube |
| SCA (Dependency scanning) | Cada commit | npm audit, Snyk, Dependabot |
| DAST (Dynamic Analysis) | Semanal | OWASP ZAP, Burp Suite |
| Análisis de secretos | Cada commit | GitLeaks, TruffleHog |
| Revisión manual de código | Cada PR crítico | Revisión por pares |
| Pruebas de penetración | Trimestral | Equipo externo |
| Escaneo de contenedores | Semanal | Trivy, Clair |

### 6.3. Gestión de Dependencias

- Todas las dependencias se verifican mediante SCA antes de su incorporación
- Las dependencias con vulnerabilidades conocidas se actualizan o reemplazan
- Se mantiene un registro de dependencias (SBOM)
- Las versiones mínimas de las dependencias se actualizan al menos mensualmente
- Las dependencias no mantenidas (abandonware) se evitan o reemplazan

### 6.4. Entornos de Desarrollo

- Los entornos de desarrollo y producción están estrictamente separados
- No se utilizan datos reales de producción en entornos de desarrollo
- Las credenciales de producción nunca se almacenan en repositorios
- Los secretos se gestionan mediante variables de entorno o vault

---

## 7. Seguridad de la Red

### 7.1. Segmentación de Red

- La red de producción está segmentada por zonas de seguridad
- Los microservicios se comunican a través de redes aisladas (Docker networks)
- El acceso a la base de datos está restringido a servicios autorizados
- El acceso externo se realiza únicamente a través del API Gateway

### 7.2. Firewall y Protección Perimetral

- Firewall de aplicación web (WAF) en el API Gateway
- Reglas de firewall restrictivas (whitelist por defecto)
- Bloqueo de tráfico malicioso (IP reputation, GeoIP blocking)
- Rate limiting por IP y por usuario

### 7.3. Monitorización de Red

- Captura y análisis de tráfico sospechoso
- Alertas de detección de intrusiones (IDS/IPS)
- Registro de conexiones entrantes y salientes
- Análisis semanal de logs de red

---

## 8. Respuesta a Incidentes de Seguridad

### 8.1. Clasificación de Incidentes

| Nivel | Descripción | Ejemplos | Tiempo de Respuesta |
|-------|------------|----------|---------------------|
| **CRÍTICO** | Impacto grave en seguridad, datos o disponibilidad | Brecha de datos, acceso no autorizado, ransomware | Inmediato (< 15 min) |
| **ALTO** | Impacto significativo en la seguridad | Fuga limitada de datos, vulnerabilidad explotable | 1 hora |
| **MEDIO** | Impacto moderado | Escaneo de puertos, intentos de acceso fallidos | 4 horas |
| **BAJO** | Impacto mínimo | Spam, falsos positivos | 24 horas |

### 8.2. Procedimiento de Respuesta

El procedimiento completo de respuesta a incidentes se detalla en [DATA-BREACH-POLICY.md](DATA-BREACH-POLICY.md). De forma resumida:

1. **Detección**: identificación del incidente por monitorización automática o reporte manual
2. **Contención**: aislamiento de sistemas afectados, bloqueo de accesos
3. **Erradicación**: eliminación de la causa raíz
4. **Recuperación**: restauración de sistemas y datos
5. **Análisis post-mortem**: documentación de lecciones aprendidas

### 8.3. Notificación de Incidentes

- **Interna**: notificación inmediata al Responsable de Seguridad
- **Autoridades**: notificación a la AEPD en un plazo máximo de 72 horas (si aplica RGPD)
- **Afectados**: comunicación a los interesados sin dilación indebida
- **Clientes**: notificación a los clientes afectados en un plazo máximo de 24 horas

---

## 9. Registro y Auditoría

### 9.1. Registro de Eventos (Logging)

Todos los sistemas registran eventos de seguridad según la siguiente matriz:

| Tipo de Evento | Sistema | Contenido | Retención |
|---------------|---------|-----------|-----------|
| Autenticación | Winston/Loki | Usuario, IP, tipo, resultado, timestamp | 12 meses |
| Autorización | Winston/Loki | Usuario, recurso, acción, resultado | 12 meses |
| Cambios de configuración | Winston/Loki | Usuario, recurso, antes/después | 24 meses |
| Acceso a datos | Winston/Loki | Usuario, datos, operación | 12 meses |
| Errores del sistema | Winston/Loki | Tipo, stack, contexto, timestamp | 12 meses |
| Tráfico de red | Prometheus | IPs, puertos, protocolos | 6 meses |
| Rendimiento | Prometheus/Grafana | Métricas, percentiles | 24 meses |

### 9.2. Protección de Logs

- Los logs son inmutables (write-once, append-only)
- El acceso a logs está restringido y auditado
- Los logs se almacenan cifrados en reposo y en tránsito
- Las marcas de tiempo se sincronizan mediante NTP

### 9.3. Auditoría de Seguridad

Se realizan las siguientes auditorías:

| Tipo de Auditoría | Frecuencia | Realizada por |
|------------------|------------|--------------|
| Interna de seguridad | Mensual | Equipo interno |
| Externa de seguridad | Anual | Empresa externa certificada |
| Cumplimiento RGPD | Anual | DPO / asesor externo |
| Cumplimiento PCI DSS | Anual | QSA certificado |
| Penetration testing | Trimestral | Equipo especializado |

---

## 10. Copias de Seguridad y Recuperación

### 10.1. Política de Copias de Seguridad

| Tipo de Dato | Método | Frecuencia | Retención |
|-------------|--------|------------|-----------|
| Base de datos (PostgreSQL) | pg_dump cifrado | Diaria (full) + continua (WAL) | 30 días rotativos |
| Configuración | Git + backup cifrado | Cada cambio | Indefinida (git) |
| Logs (Loki) | Export S3/GCS | Diaria | 12 meses |
| Métricas (Prometheus) | Snapshot | Diaria | 3 meses |
| Datos de usuario | Backup cifrado | Diaria (incremental) + semanal (full) | 60 días |

### 10.2. Verificación de Copias

- Prueba de restauración mensual (aleatoria)
- Verificación de integridad semanal (checksums)
- Prueba de recuperación ante desastre anual
- Documentación de resultados

### 10.3. Almacenamiento de Copias

- Las copias se almacenan cifradas (AES-256-GCM)
- Las copias se almacenan en ubicaciones geográficamente separadas
- Las copias locales y en la nube se mantienen simultáneamente
- El acceso a las copias está restringido al personal autorizado

### 10.4. Recuperación ante Desastres (DRP)

| Objetivo | Objetivo | Tiempo |
|----------|----------|--------|
| RTO (Recovery Time Objective) | 4 horas | Reanudación del servicio |
| RPO (Recovery Point Objective) | 15 minutos | Pérdida máxima de datos |
| RTO crítico | 1 hora | Servicios esenciales |
| RPO crítico | 1 minuto | Datos transaccionales |

---

## 11. Gestión de Riesgos

### 11.1. Metodología de Evaluación de Riesgos

| Elemento | Descripción |
|----------|-------------|
| Metodología | ISO 31000 / MAGERIT v4 |
| Identificación | Activos, amenazas, vulnerabilidades |
| Análisis | Probabilidad vs Impacto |
| Evaluación | Riesgo inherente vs residual |
| Tratamiento | Evitar, reducir, transferir, aceptar |

### 11.2. Niveles de Riesgo

| Nivel | Probabilidad | Impacto | Acción |
|-------|-------------|---------|--------|
| Crítico | Muy probable | Muy alto | Mitigación inmediata |
| Alto | Probable | Alto | Mitigación prioritaria |
| Medio | Posible | Medio | Mitigación planificada |
| Bajo | Improbable | Bajo | Aceptación o monitorización |

### 11.3. Evaluaciones de Riesgo

- Evaluación completa anual
- Evaluación específica ante cambios significativos
- Evaluación de impacto en protección de datos (EIPD) para nuevos tratamientos
- Reevaluación tras incidentes de seguridad

---

## 12. Seguridad Física

### 12.1. Entornos Cloud

La infraestructura de Backend Template se aloja en proveedores cloud certificados (ISO 27001, SOC 2):

- Centros de datos con control de acceso biométrico
- Vigilancia 24/7 mediante CCTV
- Control de temperatura y humedad
- Alimentación ininterrumpida (UPS) y generadores
- Certificaciones: ISO 27001, SOC 2, PCI DSS

### 12.2. Dispositivos del Personal

- Todos los dispositivos con acceso a sistemas de producción deben estar cifrados
- Las pantallas deben bloquearse al ausentarse del puesto
- El software no autorizado está prohibido
- Los dispositivos perdidos o robados deben reportarse inmediatamente

---

## 13. Gestión de Vulnerabilidades

### 13.1. Programa de Bug Bounty

Backend Template cuenta con un programa de divulgación responsable de vulnerabilidades. Consulte [BUG-BOUNTY.md](BUG-BOUNTY.md) para más detalles.

### 13.2. Parcheado y Actualizaciones

| Tipo de Actualización | Plazo | Procedimiento |
|----------------------|-------|--------------|
| Crítica de seguridad (CVE crítico) | 24 horas | Parche de emergencia + despliegue urgente |
| Alta de seguridad | 7 días | Parche planificado + pruebas |
| Media de seguridad | 30 días | Incluida en ciclo regular de actualización |
| Baja de seguridad | 90 días | Incluida en siguiente versión |
| Dependencias con vulnerabilidades | Según severidad | Actualización inmediata o mitigación |

### 13.3. Escaneo de Vulnerabilidades

- Escaneo automatizado semanal (Trivy, Snyk)
- Escaneo manual trimestral
- Pruebas de penetración anuales
- Análisis de código estático en cada commit

---

## 14. Formación y Concienciación

### 14.1. Programa de Formación

| Rol | Frecuencia | Contenido |
|-----|------------|-----------|
| Todos los implicados | Anual | Seguridad básica, phishing, contraseñas seguras |
| Desarrolladores | Semestral | Codificación segura, OWASP Top 10, SAST |
| Administradores | Semestral | Hardening, monitorización, respuesta a incidentes |
| Nuevas incorporaciones | Primer mes | Políticas de seguridad, procedimientos |
| Personal crítico | Trimestral | Seguridad avanzada, threat modeling |

### 14.2. Simulacros de Seguridad

- Simulacro de phishing trimestral
- Simulacro de respuesta a incidentes semestral
- Simulacro de recuperación ante desastre anual

---

## 15. Cumplimiento Normativo

### 15.1. Normativas Aplicables

| Normativa | Ámbito | Estado |
|-----------|--------|--------|
| RGPD (UE 2016/679) | Protección de datos | Implementado |
| LOPDGDD (3/2018) | Protección de datos España | Implementado |
| LSSI (34/2002) | Servicios de la sociedad de la información | Implementado |
| PCI DSS v4.0 (si aplica) | Datos de tarjetas de pago | Implementado |
| ENS (RD 311/2022) | Esquema Nacional de Seguridad | En implantación |

### 15.2. Evaluación de Cumplimiento

- Auditoría interna anual de cumplimiento
- Revisión legal semestral de políticas
- Actualización de políticas ante cambios normativos

---

## 16. Contacto de Seguridad

Para reportar incidentes de seguridad, vulnerabilidades o realizar consultas:

**Responsable de Seguridad:**
Correo electrónico: security@codeibra.dev
Respuesta garantizada: 24 horas

**Para reportar vulnerabilidades de forma responsable:**
Véase [BUG-BOUNTY.md](BUG-BOUNTY.md) para el procedimiento detallado.
Correo electrónico: security@codeibra.dev
Clave PGP disponible en: https://codeibra.dev/security/pgp-key.asc

**Respuesta a Incidentes 24/7:**
Correo electrónico: incident@codeibra.dev
Teléfono: +34 912 345 678 (emergencias de seguridad)

---

## 17. Documentos Relacionados

- [DATA-BREACH-POLICY.md](DATA-BREACH-POLICY.md) — Procedimiento de respuesta a violaciones de seguridad
- [BUG-BOUNTY.md](BUG-BOUNTY.md) — Programa de divulgación responsable de vulnerabilidades
- [PRIVACY-POLICY.md](PRIVACY-POLICY.md) — Política de privacidad y protección de datos
- [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md) — Acuerdo de tratamiento de datos
- [DATA-RETENTION-POLICY.md](DATA-RETENTION-POLICY.md) — Política de retención de datos
- [GDPR-CHECKLIST.md](GDPR-CHECKLIST.md) — Lista de verificación RGPD

---

*Documento generado y mantenido por CodeIbra para el proyecto Backend Template.*
*Última actualización: 1 de enero de 2026*

---

**Backend Template** — Creado por CodeIbra
Copyright (c) [2026] CodeIbra. Todos los derechos reservados.
