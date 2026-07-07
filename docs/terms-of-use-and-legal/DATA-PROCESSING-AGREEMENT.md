# Acuerdo de Tratamiento de Datos (Data Processing Agreement — DPA)

**Proyecto:** Backend Template
**Creador/Responsable:** CodeIbra
**Versión:** 1.0
**Fecha de entrada en vigor:** 1 de enero de 2026

---

## 1. Partes del Acuerdo

### 1.1. Responsable del Tratamiento (Controller)

**Nombre:** CodeIbra
**Representante legal:** CodeIbra (desarrollador principal y creador)
**Dirección:** Calle de la Tecnología, 42, 28001 Madrid, España
**CIF/NIF:** B-12345678
**Correo electrónico:** controller@codeibra.dev
**Teléfono:** +34 912 345 678

### 1.2. Encargado del Tratamiento (Processor)

**Nombre:** [Nombre del Encargado]
**Dirección:** [Dirección del Encargado]
**CIF/NIF:** [CIF/NIF del Encargado]
**Correo electrónico:** [Correo del Encargado]
**Teléfono:** [Teléfono del Encargado]

*(En adelante, conjuntamente denominadas las "Partes" e individualmente la "Parte")*

---

## 2. Objeto y Ámbito de Aplicación

### 2.1. Objeto

El presente Acuerdo de Tratamiento de Datos (en adelante, "DPA" o "Acuerdo") tiene por objeto regular las condiciones en las que el Encargado del Tratamiento tratará los datos personales por cuenta del Responsable del Tratamiento, de conformidad con lo establecido en el Artículo 28 del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (RGPD), la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), y demás normativa aplicable en materia de protección de datos.

### 2.2. Ámbito de Aplicación

Este DPA se aplica a todo tratamiento de datos personales realizado por el Encargado por cuenta del Responsable en el marco de los servicios prestados a través del proyecto **Backend Template** (creado por CodeIbra), incluyendo:

- Plataforma principal (main monolith)
- Microservicios (auth, users, payments, notifications, invoice, mail, SMS)
- API Gateway
- Sistemas de observabilidad (logs, métricas, trazas)
- Sistema de colas (BullMQ/Redis)
- Sistema de alertas y notificaciones
- Sistema de diagnósticos y recuperación automática
- Cualquier otro servicio asociado

---

## 3. Definiciones

Los términos utilizados en el presente DPA tendrán el significado que se les atribuye en el RGPD:

- **Datos personales**: toda información sobre una persona física identificada o identificable («el interesado»).
- **Tratamiento**: cualquier operación o conjunto de operaciones realizadas sobre datos personales o conjuntos de datos personales, ya sea por procedimientos automatizados o no.
- **Responsable del tratamiento**: la persona física o jurídica, autoridad pública, servicio u otro organismo que, solo o junto con otros, determina los fines y medios del tratamiento.
- **Encargado del tratamiento**: la persona física o jurídica, autoridad pública, servicio u otro organismo que trata datos personales por cuenta del responsable del tratamiento.
- **Destinatario**: la persona física o jurídica, autoridad pública, servicio u otro organismo al que se comuniquen datos personales.
- **Violación de la seguridad de los datos personales**: toda violación de la seguridad que ocasione la destrucción, pérdida o alteración accidental o ilícita de datos personales transmitidos, conservados o tratados de otra forma.
- **Datos sensibles (categorías especiales)**: datos que revelen el origen étnico o racial, opiniones políticas, convicciones religiosas o filosóficas, afiliación sindical, datos genéticos, datos biométricos, datos relativos a la salud o la vida sexual.
- **Subencargado**: otro encargado del tratamiento contratado por el Encargado para realizar actividades de tratamiento específicas por cuenta del Responsable.

---

## 4. Naturaleza, Fines y Duración del Tratamiento

### 4.1. Naturaleza del Tratamiento

El Encargado tratará los datos personales por cuenta del Responsable para la prestación de los servicios de plataforma backend conforme a los términos acordados entre las Partes. El tratamiento incluirá, según el servicio contratado:

- Recogida y almacenamiento de datos de usuario
- Autenticación y autorización de usuarios
- Procesamiento de pagos y facturación
- Gestión de notificaciones y comunicaciones
- Almacenamiento y procesamiento de logs
- Monitorización y análisis de rendimiento
- Diagnóstico y resolución de errores
- Copias de seguridad y recuperación ante desastres
- Cualquier otro tratamiento necesario para la prestación del servicio

### 4.2. Categorías de Interesados

Los datos personales tratados por el Encargado pertenecerán a las siguientes categorías de interesados:

- Usuarios registrados del proyecto Backend Template
- Usuarios finales de los servicios que utilizan Backend Template
- Administradores y operadores del sistema
- Personal del Responsable que accede a los sistemas
- Terceros autorizados por el Responsable

### 4.3. Categorías de Datos Personales

Las categorías de datos personales objeto del tratamiento serán:

- **Datos de identificación**: nombre, apellidos, nombre de usuario, identificador interno
- **Datos de contacto**: correo electrónico, dirección postal, número de teléfono
- **Datos de autenticación**: hash de contraseña, tokens JWT, refresh tokens
- **Datos de uso**: logs de acceso, direcciones IP, agente de usuario, endpoints consultados
- **Datos de facturación**: dirección fiscal, NIF/CIF, datos de pago tokenizados (Stripe)
- **Datos de perfil**: preferencias, avatar, biografía, configuración regional
- **Datos de comunicación**: contenido de solicitudes de soporte, tickets, incidencias
- **Datos de métricas**: métricas de rendimiento, errores, trazas de diagnóstico

Queda expresamente prohibido el tratamiento de categorías especiales de datos (Art. 9 RGPD) salvo instrucción expresa y por escrito del Responsable.

### 4.4. Duración del Tratamiento

El tratamiento de datos personales por parte del Encargado tendrá una duración igual al período de vigencia del contrato de servicios entre las Partes. Finalizado el mismo, el Encargado deberá devolver o destruir todos los datos personales según las instrucciones del Responsable, salvo que exista una obligación legal de conservación.

---

## 5. Instrucciones del Responsable

5.1. El Encargado tratará los datos personales únicamente siguiendo las instrucciones documentadas del Responsable, a menos que esté obligado a ello en virtud del Derecho de la Unión o de los Estados miembros. En tal caso, el Encargado informará al Responsable de esa exigencia legal antes del tratamiento, salvo que tal información esté prohibida por razones de interés público esencial.

5.2. El Encargado no podrá:

- Tratar los datos personales para finalidades propias o distintas de las instruidas
- Comunicar los datos personales a terceros sin autorización del Responsable
- Transferir datos personales fuera del Espacio Económico Europeo sin las garantías adecuadas
- Crear subencargados sin autorización previa y por escrito del Responsable

5.3. El Encargado informará inmediatamente al Responsable si, en su opinión, una instrucción infringe el RGPD u otras disposiciones de protección de datos.

---

## 6. Confidencialidad

6.1. El Encargado garantizará que todas las personas autorizadas para tratar datos personales en virtud del presente Acuerdo estén sujetas a una obligación legal o contractual de confidencialidad.

6.2. La obligación de confidencialidad incluye:

- No revelar información alguna sobre los datos personales tratados a terceros no autorizados
- No copiar, reproducir o duplicar los datos personales sin autorización expresa
- No utilizar los datos personales para fines distintos a los establecidos en el presente DPA
- Mantener la confidencialidad incluso después de la finalización del Acuerdo

6.3. El Encargado adoptará las medidas necesarias para garantizar que su personal conozca y cumpla estas obligaciones de confidencialidad.

---

## 7. Medidas de Seguridad (Art. 32 RGPD)

### 7.1. Obligación General

El Encargado implementará las medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo del tratamiento, incluyendo, según corresponda:

### 7.2. Medidas Técnicas

| ID | Medida | Descripción |
|----|--------|-------------|
| M1 | Cifrado en reposo | AES-256-GCM para datos sensibles en base de datos |
| M2 | Cifrado en tránsito | TLS 1.2/1.3 para todas las comunicaciones red |
| M3 | Hash de contraseñas | bcrypt con coste 12 para almacenamiento de credenciales |
| M4 | Autenticación segura | JWT con RS256, refresh tokens rotados, MFA disponible |
| M5 | Control de acceso | RBAC con principio de mínimo privilegio |
| M6 | Rate limiting | Límite de peticiones por IP/usuario para prevenir abusos |
| M7 | Firewall | Helmet, CORS configurado, validación de entrada |
| M8 | Logs de auditoría | Registro inmutable de accesos y operaciones en Winston/Loki |
| M9 | Monitorización continua | Prometheus/Grafana con alertas en tiempo real |
| M10 | Antivirus/ASM | Escaneo periódico de vulnerabilidades |
| M11 | Aislamiento | Contenedores Docker con redes segregadas |
| M12 | Gestión de parches | Actualización programada de dependencias |
| M13 | Copias de seguridad | Backup cifrado con retention policy documentada |
| M14 | Detección de intrusiones | Sistema de alertas automáticas (Slack/PagerDuty) |

### 7.3. Medidas Organizativas

| ID | Medida | Descripción |
|----|--------|-------------|
| O1 | Política de contraseñas | Mínimo 8 caracteres, complejidad alta, rotación periódica |
| O2 | MFA obligatorio | Para accesos administrativos y de producción |
| O3 | Principio de mínimo privilegio | Acceso restringido a lo estrictamente necesario |
| O4 | Formación continua | Formación anual en seguridad y protección de datos |
| O5 | Gestión de accesos | Revisión trimestral de accesos y permisos |
| O6 | Procedimiento de incidentes | Plan de respuesta documentado (véase DATA-BREACH-POLICY.md) |
| O7 | Evaluación de riesgos | EIPD para tratamientos de alto riesgo |
| O8 | BYOD policy | Control de dispositivos personales con acceso a datos |

### 7.4. Niveles de Seguridad por Tipo de Dato

| Tipo de Dato | Nivel | Cifrado Reposo | Cifrado Tránsito | Control Acceso | Auditoría |
|-------------|-------|---------------|-----------------|---------------|-----------|
| Contraseñas | Alto | AES-256 + bcrypt | TLS 1.3 | Restringido | Completa |
| Datos de pago | Alto | AES-256-GCM | TLS 1.3 | Restringido | Completa |
| Datos personales | Medio-Alto | AES-256 | TLS 1.2+ | Rol-based | Completa |
| Logs de acceso | Medio | AES-256 | TLS 1.2+ | Rol-based | Completa |
| Métricas | Bajo | No aplica | TLS 1.2+ | Lectura | Básica |
| Datos anonimizados | Bajo | No requerido | No requerido | Abierto | No requerida |

---

## 8. Subencargados (Subprocessors)

### 8.1. Autorización General

El Responsable autoriza expresamente al Encargado a contratar subencargados para la prestación de los servicios, siempre que cumplan con los requisitos establecidos en el Artículo 28.2 y 28.4 del RGPD.

### 8.2. Lista de Subencargados Autorizados

| Subencargado | Servicio | Jurisdicción | Datos Tratados |
|-------------|----------|-------------|----------------|
| Stripe, Inc. | Procesamiento de pagos | EEUU | Datos de pago tokenizados |
| Redis Ltd. | Caché y colas (BullMQ) | EEUU/UE | Datos de sesión, colas |
| Grafana Labs | Dashboards y observabilidad | EEUU | Métricas anonimizadas |
| Proveedor Cloud (AWS/Azure/GCP) | Infraestructura cloud | UE | Todos los datos |
| Slack (Salesforce) | Notificaciones de alertas | EEUU | Alertas (sin datos personales) |
| PagerDuty | Gestión de incidencias | EEUU | Alertas (sin datos personales) |

### 8.3. Procedimiento de Incorporación de Nuevos Subencargados

1. El Encargado notificará al Responsable con al menos 30 días de antelación cualquier cambio en la lista de subencargados.
2. El Responsable dispondrá de 15 días para oponerse al cambio por motivos justificados de protección de datos.
3. En caso de oposición, las Partes negociarán de buena fe una solución alternativa.
4. Si no se alcanza un acuerdo, el Responsable podrá resolver el contrato sin penalización.

### 8.4. Obligaciones del Encargado respecto a los Subencargados

El Encargado se obliga a:

- Exigir a los subencargados las mismas obligaciones de protección de datos que las establecidas en el presente DPA
- Verificar que los subencargados ofrecen garantías suficientes para implementar las medidas técnicas y organizativas adecuadas
- Mantener actualizada la lista de subencargados y ponerla a disposición del Responsable
- Asumir la responsabilidad por los actos y omisiones de los subencargados

---

## 9. Asistencia al Responsable

### 9.1. Asistencia en Derechos de los Interesados

El Encargado asistirá al Responsable en el cumplimiento de su obligación de responder a las solicitudes de ejercicio de derechos de los interesados (acceso, rectificación, supresión, limitación, portabilidad, oposición), en la medida de lo posible, mediante:

- Implementación de funcionalidades técnicas que permitan la exportación, modificación y eliminación de datos por el Usuario
- Facilidad de API para que el Responsable pueda extraer o modificar datos de forma programática
- Respuesta a las solicitudes del Responsable en un plazo máximo de 48 horas
- Asistencia en la verificación de la identidad del solicitante
- Colaboración en la generación de informes de acceso

### 9.2. Asistencia en Violaciones de Seguridad

El Encargado asistirá al Responsable en el cumplimiento de su obligación de notificar violaciones de seguridad a la autoridad de control y a los interesados, mediante:

- Notificación inmediata al Responsable (máximo 24 horas desde la detección)
- Documentación completa del incidente
- Información necesaria para la notificación a la autoridad de control (72 horas)
- Información necesaria para la comunicación a los interesados
- Colaboración en la investigación forense

### 9.3. Asistencia en Evaluaciones de Impacto

El Encargado asistirá al Responsable en la realización de evaluaciones de impacto relativas a la protección de datos (EIPD), proporcionando:

- Información sobre las medidas técnicas implementadas
- Descripción de los tratamientos realizados
- Identificación y valoración de riesgos
- Propuesta de medidas para mitigar los riesgos

---

## 10. Notificación de Violaciones de Seguridad

10.1. El Encargado notificará al Responsable cualquier violación de la seguridad de los datos personales sin dilación indebida y, en cualquier caso, en un plazo máximo de **24 horas** desde que tenga conocimiento de la misma.

10.2. La notificación incluirá, como mínimo:

- Descripción de la naturaleza de la violación, incluyendo categorías y número aproximado de interesados afectados
- Nombre y datos de contacto del responsable de protección de datos o punto de contacto del Encargado
- Descripción de las consecuencias probables de la violación
- Descripción de las medidas adoptadas o propuestas para poner remedio a la violación
- Identificación de las posibles causas y medidas para evitar la recurrencia

10.3. El Encargado cooperará plenamente con el Responsable en la investigación y resolución de la violación, así como en la preparación de las notificaciones requeridas a la autoridad de control y a los interesados.

10.4. El Encargado mantendrá un registro de todas las violaciones de seguridad, incluyendo los hechos relacionados, los efectos y las medidas correctivas adoptadas.

---

## 11. Transferencias Internacionales de Datos

11.1. El Encargado no transferirá datos personales a países fuera del Espacio Económico Europeo (EEE) sin la autorización previa y por escrito del Responsable.

11.2. En caso de ser necesaria una transferencia internacional, el Encargado se asegurará de que concurra alguna de las siguientes garantías:

- Decisión de adecuación de la Comisión Europea (Art. 45 RGPD)
- Cláusulas Contractuales Tipo (Art. 46.2 RGPD)
- Normas Corporativas Vinculantes (Art. 46.2 RGPD)
- Código de conducta o mecanismo de certificación (Art. 46.2 RGPD)
- Consentimiento explícito del interesado informado de la transferencia (Art. 49 RGPD)

11.3. El Encargado pondrá a disposición del Responsable copia de las garantías aplicables a las transferencias internacionales.

---

## 12. Registro de Actividades de Tratamiento (ROPA)

12.1. El Encargado mantendrá un registro de todas las categorías de actividades de tratamiento realizadas por cuenta del Responsable, que contendrá:

- Nombre y datos de contacto del Encargado y, en su caso, del representante y del DPO
- Categorías de tratamientos realizados por cuenta del Responsable
- Categorías de datos personales tratados
- Categorías de interesados
- Destinatarios de los datos, incluyendo subencargados
- Transferencias internacionales y garantías aplicables
- Plazos previstos de supresión de los datos
- Descripción general de las medidas de seguridad

12.2. El registro se mantendrá por escrito, incluido en formato electrónico, y estará a disposición de la autoridad de control cuando sea requerido.

---

## 13. Devolución y Supresión de los Datos

13.1. A la finalización del contrato por cualquier causa, el Encargado, a elección del Responsable:

- Devolverá al Responsable todos los datos personales en un formato estructurado, de uso común y lectura mecánica
- Suprimirá todos los datos personales de sus sistemas, incluyendo copias de seguridad y registros

13.2. El Encargado no estará obligado a suprimir los datos personales cuando exista una obligación legal de conservación (Derecho de la Unión o de los Estados miembros).

13.3. En caso de obligación legal de conservación, el Encargado:

- Mantendrá los datos bloqueados y separados de cualquier tratamiento activo
- Implementará medidas de seguridad adicionales para los datos conservados
- Suprimirá los datos tan pronto como cese la obligación legal

13.4. El Encargado certificará por escrito al Responsable que ha cumplido con las obligaciones de devolución y supresión en un plazo máximo de 30 días desde la finalización del contrato.

---

## 14. Auditoría y Verificación

14.1. El Responsable tendrá derecho a realizar auditorías, incluyendo inspecciones, para verificar el cumplimiento del presente DPA y del RGPD por parte del Encargado.

14.2. Las auditorías se realizarán:

- Con una antelación mínima de 15 días hábiles
- En horario laboral y sin interrupción injustificada de las operaciones
- Con una frecuencia máxima anual, salvo que exista causa justificada
- A cargo de un auditor independiente designado por el Responsable
- Siendo los costes de la auditoría por cuenta del Responsable

14.3. El Encargado:

- Facilitará el acceso a las instalaciones, sistemas y documentación necesaria
- Proporcionará la información requerida para demostrar el cumplimiento
- Permitirá la realización de pruebas técnicas no destructivas
- Colaborará con el auditor y resolverá las observaciones en el plazo acordado

14.4. Como alternativa a la auditoría, el Encargado podrá proporcionar al Responsable:

- Certificaciones vigentes (ISO 27001, SOC 2, etc.)
- Informes de auditoría externa recientes (menos de 12 meses)
- Auto-evaluaciones detalladas de cumplimiento

---

## 15. Responsabilidad

15.1. El Encargado será responsable de los daños y perjuicios causados por el tratamiento cuando:

- No haya cumplido con las obligaciones específicas del RGPD dirigidas a los encargados
- Haya actuado al margen de las instrucciones lícitas del Responsable o contrariamente a ellas
- Haya incumplido las obligaciones establecidas en el presente DPA

15.2. El Encargado indemnizará al Responsable por cualquier reclamación, sanción o coste derivado del incumplimiento del presente DPA.

15.3. La responsabilidad del Encargado se limita al importe de las tarifas pagadas por el Responsable durante los 12 meses anteriores al hecho que dio lugar a la reclamación, salvo en casos de dolo o culpa grave.

---

## 16. Legislación Aplicable y Jurisdicción

16.1. El presente DPA se regirá e interpretará de conformidad con la legislación española, incluyendo el RGPD, la LOPDGDD y cualquier otra normativa aplicable en materia de protección de datos.

16.2. Cualquier controversia derivada del presente DPA será sometida a los juzgados y tribunales de la ciudad de Madrid, España, con renuncia expresa a cualquier otro fuero que pudiera corresponder a las Partes.

---

## 17. Vigencia y Modificación

17.1. El presente DPA entrará en vigor en la fecha de su firma y permanecerá vigente mientras se mantenga la relación contractual entre las Partes.

17.2. El Responsable podrá modificar el presente DPA para adaptarlo a cambios normativos o del servicio, notificándolo al Encargado con al menos 30 días de antelación.

17.3. Las modificaciones sustanciales requerirán el consentimiento expreso del Encargado.

---

## 18. Cláusulas Adicionales

18.1. **Independencia**: Si alguna disposición del presente DPA fuera declarada nula o inaplicable, las demás disposiciones permanecerán en pleno vigor y efecto.

18.2. **Prevalencia**: En caso de conflicto entre el presente DPA y el contrato principal de servicios, prevalecerá el presente DPA.

18.3. **Notificaciones**: Todas las notificaciones relacionadas con el presente DPA se realizarán por escrito y se enviarán a las direcciones de correo electrónico indicadas por las Partes.

18.4. **Acuerdo completo**: El presente DPA constituye el acuerdo íntegro entre las Partes en materia de protección de datos, sustituyendo cualquier acuerdo anterior sobre la materia.

---

## 19. Firmas

### Responsable del Tratamiento

**CodeIbra**

Firmado electrónicamente: _________________________________

Nombre: CodeIbra
Cargo: Creador y Desarrollador Principal
Fecha: ________________________

### Encargado del Tratamiento

**[Nombre del Encargado]**

Firmado electrónicamente: _________________________________

Nombre: ________________________
Cargo: ________________________
Fecha: ________________________

---

## Anexo A: Descripción del Tratamiento

| Elemento | Descripción |
|----------|-------------|
| Responsable | CodeIbra |
| Encargado | [Nombre del Encargado] |
| Proyecto | Backend Template |
| Naturaleza del tratamiento | Almacenamiento, consulta, modificación, supresión, transmisión, registro, análisis, monitorización |
| Finalidad del tratamiento | Prestación de servicios de plataforma backend, autenticación, pagos, notificaciones, logs, métricas, monitorización |
| Categorías de interesados | Usuarios registrados, usuarios finales, administradores |
| Categorías de datos | Identificación, contacto, autenticación, uso, facturación, perfil, comunicación, métricas |
| Categorías especiales | No se tratan datos de categorías especiales |
| Duración del tratamiento | Vigencia del contrato + período de liquidación |
| Medidas de seguridad | Ver Sección 7 del presente DPA |
| Transferencias internacionales | Ver Sección 11 del presente DPA |
| Subencargados | Ver Sección 8 del presente DPA |

---

## Anexo B: Instrucciones de Tratamiento

El Responsable instruye al Encargado para que realice los siguientes tratamientos:

1. **Almacenamiento y custodia** de datos personales en sistemas seguros
2. **Procesamiento de autenticación** mediante JWT y OAuth2
3. **Procesamiento de pagos** a través de Stripe (tokenización)
4. **Gestión de notificaciones** por email, SMS y Slack
5. **Registro de logs** para auditoría, depuración y monitorización
6. **Análisis de métricas** para optimización del rendimiento
7. **Copias de seguridad** cifradas según la política de retención
8. **Supresión** de datos según las instrucciones del Responsable o al finalizar el contrato

Queda expresamente prohibido al Encargado:

- Utilizar los datos para fines de prospección comercial propia
- Comunicar datos a terceros sin autorización expresa
- Transferir datos fuera del EEE sin las garantías adecuadas
- Realizar tratamientos no autorizados en el presente Anexo

---

*Documento generado y mantenido por CodeIbra para el proyecto Backend Template.*
*Última actualización: 1 de enero de 2026*

---

**Backend Template** — Creado por CodeIbra
Copyright (c) [2026] CodeIbra. Todos los derechos reservados.
