# Politica de Retencion de Datos (Data Retention Policy)

**Proyecto:** Backend Template
**Creador/Responsable:** CodeIbra
**Version:** 1.0
**Fecha de entrada en vigor:** 1 de enero de 2026

---

## 1. Introduccion y Alcance

### 1.1. Proposito

La presente Politica de Retencion de Datos (en adelante, "la Politica") establece los periodos de conservacion, los procedimientos de eliminacion y anonimizacion, y las responsabilidades asociadas a la gestion del ciclo de vida de los datos en el proyecto **Backend Template**, desarrollado por **CodeIbra**.

Esta Politica garantiza el cumplimiento del principio de "limitacion del plazo de conservacion" establecido en el Art. 5.1.e del RGPD, asi como de la normativa sectorial aplicable.

### 1.2. Alcance

Esta Politica se aplica a:

- Todos los datos personales tratados en los sistemas de Backend Template
- Todos los entornos (desarrollo, pruebas, staging, produccion)
- Todas las copias de seguridad y archivos
- Todos los soportes (bases de datos, logs, archivos, backups)
- Todos los datos generados por el sistema (logs, metricas, trazas)

### 1.3. Principios Fundamentales

1. **Minimizacion**: solo se conservaran los datos estrictamente necesarios
2. **Limitacion temporal**: los datos se conservaran durante el tiempo minimo necesario
3. **Seguridad**: los datos conservados estaran protegidos mediante medidas adecuadas
4. **Transparencia**: los interesados seran informados de los periodos de conservacion
5. **Responsabilidad**: el cumplimiento de la politica sera auditado periodicamente

---

## 2. Definiciones

A los efectos de la presente Politica, se entendera por:

- **Dato personal**: cualquier informacion sobre una persona fisica identificada o identificable.
- **Conservacion activa**: periodo durante el cual los datos estan disponibles para su tratamiento.
- **Bloqueo**: suspension del tratamiento de los datos, conservandolos unicamente a disposicion de autoridades.
- **Supresion**: eliminacion definitiva de los datos sin posibilidad de recuperacion.
- **Anonimizacion**: tratamiento que impide la identificacion del interesado de forma irreversible.
- **Retencion legal**: periodo minimo de conservacion exigido por una norma legal.
- **Periodo de retencion**: intervalo de tiempo durante el cual los datos deben ser conservados.
- **Ciclo de vida del dato**: desde su recogida hasta su eliminacion o anonimizacion definitiva.

---

## 3. Categorias de Datos y Periodos de Retencion

### 3.1. Datos de Usuario

| Categoria de Datos | Ejemplos | Periodo de Retencion Activo | Bloqueo | Fundamento Legal |
|-------------------|----------|----------------------------|---------|------------------|
| Datos de cuenta | Nombre, email, usuario, hash de password | Mientras la cuenta este activa | 2 anos tras baja | RGPD Art. 5.1.e |
| Datos de perfil | Avatar, biografia, preferencias | Mientras la cuenta este activa | 2 anos tras baja | RGPD Art. 5.1.e |
| Datos de autenticacion | Tokens JWT, refresh tokens, sesiones | Duracion de la sesion + 90 dias (logs) | 1 ano | Seguridad |
| Datos de verificacion | Fecha de nacimiento, documento identidad | Mientras la cuenta este activa | 2 anos tras baja | Obligacion legal |
| Datos de contacto | Email, telefono, direccion postal | Mientras la cuenta este activa | 2 anos tras baja | RGPD Art. 5.1.e |
| Historial de inicio de sesion | IP, timestamp, dispositivo | 12 meses | — | Seguridad, auditoria |
| Historial de actividad | Acciones realizadas, endpoints | 12 meses | — | Auditoria, mejora |

### 3.2. Datos Fiscales y Contables

| Categoria de Datos | Periodo de Retencion | Fundamento Legal |
|-------------------|---------------------|------------------|
| Facturas emitidas y recibidas | 6 anos | Codigo de Comercio (Art. 30) |
| Libros contables | 6 anos | Codigo de Comercio (Art. 30) |
| Datos de pago tokenizados | Hasta finalizar la transaccion + 30 dias | PCI DSS |
| Contratos y acuerdos | 6 anos desde la finalizacion | Codigo Civil |
| Justificantes de pago | 6 anos | Ley General Tributaria |
| Declaraciones fiscales | 10 anos | Ley General Tributaria |
| Datos de facturacion recurrente | Mientras dure la relacion contractual + 6 anos | Obligacion fiscal |

### 3.3. Logs y Datos de Sistema

| Categoria de Datos | Periodo de Retencion Activo | Archivado | Fundamento |
|-------------------|----------------------------|-----------|------------|
| Logs de aplicacion (Winston) | 90 dias | 2 anos | Depuracion, auditoria |
| Logs de acceso (API) | 12 meses | — | Seguridad |
| Logs de autenticacion | 12 meses | — | Seguridad |
| Logs de errores | 90 dias | 2 anos | Diagnostico |
| Logs de auditoria (cambios) | 24 meses | — | Cumplimiento |
| Logs de rendimiento | 30 dias (alta res.) | 12 meses (agregado) | Optimizacion |
| Metricas (Prometheus) | 30 dias (detalle) | 12 meses (agregado) | Monitorizacion |
| Trazas (OpenTelemetry/Jaeger) | 7 dias | 30 dias | Depuracion distribuida |
| Eventos de seguridad | 24 meses | — | Forense, cumplimiento |
| Alertas del sistema | 12 meses | — | Auditoria |

### 3.4. Datos de Marketing y Comunicaciones

| Categoria de Datos | Periodo de Retencion | Fundamento |
|-------------------|---------------------|------------|
| Consentimientos de marketing | Mientras el consentimiento este vigente + 1 ano | RGPD Art. 7 |
| Historial de comunicaciones comerciales | 2 anos desde el envio | LSSI |
| Preferencias de marketing | Mientras la cuenta este activa | RGPD Art. 5.1.e |
| Datos de campanas de email | 2 anos | Analitica |
| Encuestas de satisfaccion | 12 meses | Mejora continua |
| Datos de redes sociales | Mientras dure la interaccion | Interes legitimo |

### 3.5. Datos de Soporte y Atencion al Cliente

| Categoria de Datos | Periodo de Retencion | Fundamento |
|-------------------|---------------------|------------|
| Tickets de soporte | 3 anos desde el cierre | Gestion de incidencias |
| Chat en vivo | 12 meses | Mejora del servicio |
| Grabaciones de llamadas (si aplica) | 6 meses | Control de calidad |
| Correspondencia email | 3 anos | Derechos del usuario |
| Documentacion adjunta | 3 anos | Gestion de incidencias |

### 3.6. Datos de Recursos Humanos (si aplica)

| Categoria de Datos | Periodo de Retencion | Fundamento |
|-------------------|---------------------|------------|
| Curriculums (no contratados) | 12 meses | Consentimiento |
| Datos de empleados | Durante la relacion laboral + 6 anos | Estatuto Trabajadores |
| Datos de nominas | 6 anos | Obligacion fiscal |
| Datos de seguridad social | 6 anos | Seguridad Social |

---

## 4. Procedimientos de Eliminacion y Anonimizacion

### 4.1. Eliminacion de Datos

| Tipo de Soporte | Metodo de Eliminacion | Verificacion |
|----------------|----------------------|--------------|
| Base de datos (PostgreSQL) | DELETE + VACUUM FULL + TRUNCATE | Verificar registros restantes = 0 |
| Archivos | Borrado seguro (herramienta de shredding) | Verificar inaccesibilidad |
| Logs (Loki) | Eliminacion por retention policy automatica | Verificar politica aplicada |
| Metricas (Prometheus) | Eliminacion por retention policy automatica | Verificar politica aplicada |
| Caches (Redis) | FLUSHALL + expiration TTL | Verificar keys |
| Backups | Sobrescritura multiple (DoD 5220.22-M) | Verificar checksum |
| Discos/Snapshots | Eliminacion segura + desmontaje | Verificar eliminacion |

### 4.2. Anonimizacion de Datos

Cuando la eliminacion no sea posible (obligacion legal de conservacion), se procedera a la anonimizacion:

| Tecnica | Descripcion | Aplicacion |
|---------|-------------|------------|
| Ofuscacion | Sustitucion de identificadores por valores aleatorios | Datos de prueba |
| Agregacion | Agrupacion de datos en categorias no identificables | Metricas, analitica |
| Generalizacion | Reduccion de precision (ej. edad exacta a rango) | Datos demographicos |
| Perturbacion | Adicion de ruido estadistico | Reportes, dashboards |
| Pseudonimizacion | Separacion de identificadores del resto de datos | Datos de investigacion |

### 4.3. Criterios para Eliminacion vs. Anonimizacion

- Se eliminaran los datos cuando:
  - Haya finalizado el periodo de retencion activo y no exista obligacion legal de bloqueo
  - El interesado haya ejercido su derecho de supresion y no exista causa legal de oposicion
  - Los datos ya no sean necesarios para la finalidad para la que fueron recogidos

- Se anonimizaran los datos cuando:
  - Exista una obligacion legal de conservacion que impida la eliminacion
  - Los datos sean necesarios para fines estadisticos o de investigacion
  - Los datos deban conservarse por motivos de interes publico

---

## 5. Copias de Seguridad (Backups)

### 5.1. Periodos de Retencion de Backups

| Tipo de Backup | Frecuencia | Retencion Local | Retencion Remota |
|---------------|------------|-----------------|------------------|
| Base de datos (full) | Diaria | 7 dias | 30 dias |
| Base de datos (WAL) | Continua | 24 horas | 7 dias |
| Configuracion (Git) | Cada cambio | Indefinida | Indefinida |
| Logs | Diaria | 7 dias | 90 dias |
| Metricas (snapshot) | Diaria | 7 dias | 30 dias |
| Datos de usuario | Diaria (incr.) + semanal (full) | 14 dias | 60 dias |
| Sistema operativo | Mensual | 3 meses | — |

### 5.2. Disposicion de Backups Caducados

- Los backups locales se sobrescriben segun la politica de rotacion
- Los backups remotos se eliminan automaticamente al vencer el periodo de retencion
- La eliminacion se realiza mediante borrado seguro (sobrescritura)
- Se mantiene un registro de eliminacion de backups durante 12 meses

### 5.3. Verificacion de Backups

- Verificacion diaria de integridad de backups automaticos
- Prueba de restauracion mensual (aleatoria)
- Auditoria trimestral de la politica de retencion de backups

---

## 6. Procedimiento de Bloqueo de Datos

### 6.1. Cuadno Procede el Bloqueo

El bloqueo de datos procede cuando:

- El interesado solicita la supresion pero existe una obligacion legal de conservacion
- El interesado solicita la limitacion del tratamiento
- Finaliza el periodo de conservacion activa pero existe obligacion legal de bloqueo

### 6.2. Procedimiento de Bloqueo

1. Identificacion de los datos a bloquear
2. Separacion logica o fisica de los datos del tratamiento activo
3. Marcado de los datos como "bloqueados" en el sistema
4. Restriccion de acceso a los datos bloqueados (solo personal autorizado)
5. Registro del bloqueo en el ROPA
6. Notificacion al interesado (si procede)

### 6.3. Fin del Periodo de Bloqueo

Transcurrido el periodo de bloqueo (generalmente el plazo de prescripcion de responsabilidades), los datos seran definitivamente eliminados.

---

## 7. Procedimiento de Legal Hold (Conservacion por Requerimiento Judicial)

### 7.1. Activacion del Legal Hold

El Legal Hold se activara cuando:

- Se reciba una orden judicial que requiera la conservacion de datos especificos
- Se tenga conocimiento de un procedimiento judicial en curso o inminente
- Una autoridad administrativa requiera la conservacion de datos
- Exista una investigacion interna que requiera preservacion de evidencia

### 7.2. Procedimiento de Legal Hold

1. Notificacion inmediata al DPO y al responsable de seguridad
2. Identificacion de los datos afectados por la orden
3. Suspension de la politica de retencion para los datos identificados
4. Copia forense de los datos (imagen bit-a-bit si procede)
5. Almacenamiento seguro de los datos preservados (cifrados, acceso restringido)
6. Registro del Legal Hold en el sistema de gestion documental
7. Revision periodica de la vigencia del Legal Hold

### 7.3. Finalizacion del Legal Hold

- El Legal Hold finaliza cuando la autoridad competente lo autorice
- Al finalizar, los datos se incorporan al proceso de eliminacion ordinario
- Se documenta la finalizacion y se notifica a los responsables

---

## 8. Responsabilidades

### 8.1. DPO (Delegado de Proteccion de Datos)

- Supervisar el cumplimiento de la politica de retencion
- Aprobar las excepciones a la politica de retencion
- Gestionar los Legal Holds
- Realizar auditorias de cumplimiento
- Atender consultas de interesados sobre retencion de datos

### 8.2. Responsable de Seguridad

- Implementar las medidas tecnicas para la eliminacion segura
- Verificar la correcta ejecucion de los procedimientos de eliminacion
- Gestionar los accesos a los datos bloqueados
- Mantener los registros de eliminacion

### 8.3. Administradores de Sistemas

- Configurar las politicas de retencion automaticas en los sistemas
- Ejecutar los procedimientos de eliminacion programados
- Verificar la integridad de las eliminaciones
- Documentar las incidencias en la ejecucion

### 8.4. Desarrolladores

- Disenar los sistemas para que soporten la eliminacion selectiva de datos
- Implementar funcionalidades de exportacion, bloqueo y eliminacion
- Documentar los datos recogidos y sus periodos de retencion

---

## 9. Auditoria y Verificacion

| Actividad | Frecuencia | Responsable |
|-----------|------------|-------------|
| Revision de periodos de retencion | Anual | DPO |
| Auditoria de eliminaciones ejecutadas | Trimestral | Responsable de Seguridad |
| Verificacion de backups caducados | Mensual | Administrador |
| Revision de Legal Holds activos | Mensual | DPO |
| Prueba de procedimiento de eliminacion | Anual | Equipo de Seguridad |
| Actualizacion de categorias de datos | Anual | DPO + Equipo |

---

## 10. Excepciones

### 10.1. Excepciones Permitidas

Se permiten excepciones a la politica de retencion en los siguientes casos:

- **Legal Hold**: orden judicial o requerimiento legal
- **Investigacion**: datos necesarios para una investigacion interna o externa
- **Disputa legal**: datos relevantes para un litigio en curso o inminente
- **Consentimiento expreso**: el interesado ha consentido explicitamente una retencion mayor
- **Interes publico**: datos necesarios para fines de interes publico (investigacion, estadistica)

### 10.2. Procedimiento de Excepcion

1. Solicitud motivada de excepcion al DPO
2. Evaluacion de la solicitud por el DPO (maximo 5 dias)
3. Aprobacion o denegacion por escrito
4. Documentacion de la excepcion en el registro correspondiente
5. Revision periodica de la vigencia de la excepcion

---

## 11. Infracciones y Consecuencias

El incumplimiento de la presente Politica podra dar lugar a:

- Medidas disciplinarias segun la legislacion laboral aplicable
- Responsabilidad administrativa (sanciones de la AEPD)
- Responsabilidad civil (indemnizaciones a los afectados)
- Responsabilidad penal (en casos de especial gravedad)

---

## 12. Documentos Relacionados

- [PRIVACY-POLICY.md](PRIVACY-POLICY.md) — Politica de privacidad
- [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md) — Acuerdo de tratamiento de datos
- [DATA-BREACH-POLICY.md](DATA-BREACH-POLICY.md) — Politica de violaciones de datos
- [SECURITY-POLICY.md](SECURITY-POLICY.md) — Politica de seguridad
- [GDPR-CHECKLIST.md](GDPR-CHECKLIST.md) — Lista de verificacion RGPD
- [COOKIE-POLICY.md](COOKIE-POLICY.md) — Politica de cookies

---

## 13. Contacto

Para consultas sobre la presente Politica de Retencion de Datos:

**CodeIbra — Delegado de Proteccion de Datos (DPO)**
Correo electronico: dpo@codeibra.dev
Asunto: "Retencion de Datos"

---

*Documento generado y mantenido por CodeIbra para el proyecto Backend Template.*
*Ultima actualizacion: 1 de enero de 2026*

---

**Backend Template** — Creado por CodeIbra
Copyright (c) [2026] CodeIbra. Todos los derechos reservados.
