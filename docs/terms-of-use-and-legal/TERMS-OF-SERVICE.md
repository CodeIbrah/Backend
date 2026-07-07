# Términos del Servicio (Terms of Service)

**Proyecto:** Backend Template
**Creador:** CodeIbra
**Versión:** 1.0
**Fecha de entrada en vigor:** 1 de enero de 2026

---

## 1. Aceptación de los Términos

### 1.1. Ámbito

Los presentes Términos del Servicio (en adelante, "Términos" o "ToS") regulan el acceso, uso y disfrute del proyecto **Backend Template** (en adelante, "el Proyecto", "la Plataforma" o "el Servicio"), incluyendo todas sus aplicaciones, API, microservicios, módulos, documentación y funcionalidades asociadas, creado y mantenido por **CodeIbra** (en adelante, "el Creador", "el Proveedor" o "nosotros").

### 1.2. Aceptación

Al acceder, registrarse, descargar, instalar o utilizar cualquier parte del Proyecto, el Usuario manifiesta que ha leído, comprendido y acepta quedar vinculado por estos Términos. Si el Usuario no está de acuerdo con estos Términos, no podrá acceder ni utilizar el Servicio.

### 1.3. Modificaciones

CodeIbra se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones sustanciales serán notificadas al Usuario con al menos 30 días de antelación mediante:

- Publicación en el sitio web del Proyecto
- Notificación por correo electrónico
- Aviso en la interfaz de la aplicación

El uso continuado del Servicio después de la entrada en vigor de las modificaciones constituirá la aceptación de los nuevos Términos.

---

## 2. Descripción del Servicio

### 2.1. Naturaleza del Proyecto

Backend Template es una plantilla backend empresarial de código abierto con una arquitectura híbrida que combina un monolito funcional con microservicios independientes. El Proyecto incluye:

- **Plataforma principal (Monolith)**: API REST principal con módulos de autenticación, usuarios, productos, pedidos
- **Microservicios**: Servicios independientes de autenticación, notificaciones, pagos, usuarios, facturación, correo y SMS
- **API Gateway**: Punto de entrada único con enrutamiento, balanceo y seguridad
- **Sistema de observabilidad**: Métricas (Prometheus), logs (Winston/Loki), trazas (OpenTelemetry/Jaeger)
- **Sistema de colas**: Procesamiento asíncrono con BullMQ/Redis
- **Sistema de alertas**: Notificaciones multicanal (email, Slack, PagerDuty)
- **Sistema de diagnósticos**: AI Error Doctor para diagnóstico automático de errores
- **Sistema de recuperación automática**: Auto-recovery para restaurar el sistema tras fallos
- **Dashboard de monitorización**: Grafana para visualización de métricas y logs

### 2.2. Disponibilidad

CodeIbra se esforzará por mantener el Servicio disponible de forma continua, pero no garantiza su disponibilidad ininterrumpida. El Usuario acepta que el Servicio puede sufrir interrupciones programadas (mantenimiento) o no programadas (fallos técnicos, fuerza mayor).

### 2.3. Evolución del Servicio

CodeIbra se reserva el derecho de:

- Modificar, suspender o descontinuar cualquier funcionalidad del Servicio
- Actualizar la infraestructura, la arquitectura o las dependencias del Proyecto
- Cambiar los términos de licencia del software subyacente
- Establecer o modificar límites de uso y tarifas

---

## 3. Registro y Cuentas de Usuario

### 3.1. Registro

Para acceder a determinadas funcionalidades del Servicio, el Usuario deberá registrarse creando una cuenta. Durante el registro, el Usuario se compromete a:

- Proporcionar información veraz, exacta y completa
- Mantener actualizada la información de la cuenta
- No crear cuentas de forma fraudulenta o automatizada
- No registrarse con identidades falsas o suplantar a terceros

### 3.2. Credenciales de Acceso

El Usuario es el único responsable de:

- Mantener la confidencialidad de sus credenciales de acceso
- Todas las actividades que ocurran bajo su cuenta
- Notificar inmediatamente a CodeIbra cualquier uso no autorizado de su cuenta
- Cerrar la sesión al finalizar cada uso del Servicio

CodeIbra no será responsable por pérdidas o daños derivados del uso no autorizado de la cuenta del Usuario.

### 3.3. Verificación de Edad

El Usuario declara ser mayor de 14 años. Los menores de 14 años no pueden registrarse ni utilizar el Servicio sin el consentimiento expreso de sus padres o tutores. Los menores de 18 años pero mayores de 14 requieren autorización parental o de tutor legal.

### 3.4. Suspensión y Cancelación de Cuentas

CodeIbra se reserva el derecho de suspender o cancelar cuentas que:

- Violemen estos Términos o la legislación aplicable
- Realicen actividades fraudulentas o ilícitas
- Infrinjan derechos de propiedad intelectual de terceros
- Pongan en riesgo la seguridad o integridad del sistema
- Superen los límites de uso establecidos de forma abusiva

---

## 4. Licencia de Uso

### 4.1. Licencia del Software

El código fuente, la documentación y los archivos asociados del Proyecto Backend Template se distribuyen bajo una licencia personalizada basada en MIT con cláusula adicional de atribución obligatoria.

Para más detalles, consulte el archivo [LICENSE.md](LICENSE.md).

### 4.2. Condiciones Esenciales de la Licencia

El Usuario puede:

- Usar, copiar, modificar y distribuir el Software
- Crear obras derivadas
- Incorporar el Software en productos comerciales
- Sublicenciar el Software modificado

Siempre que:

- Se mantenga el aviso de copyright original
- Se proporcione atribución prominente a CodeIbra como creador y desarrollador principal
- No se presente el Software como creación propia

### 4.3. API y Uso del Servicio

El uso de las API del Proyecto está sujeto a los siguientes términos adicionales:

- Límites de tasa (rate limits) según el plan contratado
- Prohibición de ingeniería inversa de los endpoints de producción
- Prohibición de uso para fines ilegales o no autorizados
- Atribución obligatoria en aplicaciones que utilicen la API

---

## 5. Propiedad Intelectual

### 5.1. Titularidad

El Proyecto Backend Template, incluyendo todo su código fuente, documentación, diseño, arquitectura, logotipos, marcas y materiales asociados, es propiedad intelectual de CodeIbra, salvo que se indique expresamente lo contrario respecto a dependencias de terceros.

### 5.2. Contenido del Usuario

El Usuario conserva todos los derechos de propiedad intelectual sobre el contenido que genere, almacene o procese a través del Servicio ("Contenido del Usuario"). Al utilizar el Servicio, el Usuario concede a CodeIbra una licencia limitada para:

- Almacenar, procesar y transmitir el Contenido del Usuario
- Realizar copias de seguridad del Contenido del Usuario
- Analizar el Contenido del Usuario para mejorar el Servicio

### 5.3. Notificación de Infracciones

Si el Usuario considera que algún contenido del Servicio infringe sus derechos de propiedad intelectual, puede notificarlo a legal@codeibra.dev proporcionando:

- Identificación de la obra protegida
- Descripción de la infracción
- Datos de contacto del reclamante
- Declaración de buena fe

---

## 6. Obligaciones del Usuario

### 6.1. Uso Aceptable

El Usuario se compromete a utilizar el Servicio de conformidad con la ley, la moral, el orden público y estos Términos. En particular, el Usuario NO podrá:

a) Utilizar el Servicio para actividades ilegales o no autorizadas
b) Violar cualquier ley aplicable (local, nacional o internacional)
c) Infringir derechos de propiedad intelectual de terceros
d) Transmitir virus, malware, gusanos, troyanos u otro código malicioso
e) Intentar acceder sin autorización a sistemas, redes o datos de terceros
f) Realizar ataques de denegación de servicio (DoS/DDoS)
g) Realizar scraping, crawleo automatizado o extracción masiva de datos sin autorización
h) Suplantar la identidad de otras personas o entidades
i) Enviar spam, phishing o comunicaciones no solicitadas
j) Almacenar o transmitir contenido ilegal, obsceno, difamatorio o discriminatorio
k) Realizar actividades que puedan dañar, deshabilitar o sobrecargar la infraestructura
l) Eludir medidas de seguridad, límites de tasa o controles de acceso
m) Utilizar el Servicio para minería de criptomonedas u operaciones de alto consumo computacional
n) Modificar, descompilar o realizar ingeniería inversa del Servicio excepto en los casos permitidos por ley

### 6.2. Límites de Uso (Rate Limits)

El Servicio implementa límites de tasa para garantizar la estabilidad y seguridad del sistema:

| Tipo de Límite | Plan Gratuito | Plan Profesional | Plan Empresarial |
|---------------|---------------|------------------|-------------------|
| Peticiones/minuto (API pública) | 60 | 300 | 1000+ |
| Peticiones/hora (autenticación) | 30 | 120 | 500+ |
| Usuarios simultáneos | 10 | 100 | Ilimitado |
| Almacenamiento de datos | 100 MB | 5 GB | 50 GB+ |
| Llamadas a webhook/hora | 10 | 100 | 500+ |

Los límites pueden ser ajustados por CodeIbra en cualquier momento para preservar la integridad del sistema.

### 6.3. Prohibiciones Específicas

Queda expresamente prohibido:

a) Utilizar el sistema de AI Error Doctor para diagnosticar sistemas externos no autorizados
b) Manipular las métricas de monitorización o los logs de auditoría
c) Desactivar o eludir los sistemas de alerta y recuperación automática
d) Utilizar los sistemas de colas (BullMQ) para procesar cargas de trabajo no autorizadas
e) Almacenar datos sensibles (categorías especiales del Art. 9 RGPD) sin autorización expresa

---

## 7. Tarifas y Pagos

### 7.1. Servicios Gratuitos y de Pago

Backend Template se ofrece como software de código abierto bajo la licencia especificada. Los servicios alojados (hosted services) pueden estar sujetos a tarifas según el plan contratado.

### 7.2. Facturación

Los planes de pago se facturarán según los términos acordados en el momento de la contratación:

- Los pagos se procesarán a través de Stripe
- Las facturas se emitirán electrónicamente
- Los precios no incluyen impuestos aplicables (IVA)

### 7.3. Cancelación y Reembolsos

- El Usuario puede cancelar su suscripción en cualquier momento
- No se realizarán reembolsos por períodos parciales no utilizados
- En caso de incumplimiento de estos Términos, no se realizará reembolso alguno

---

## 8. Limitación de Responsabilidad

### 8.1. Exención de Garantías

EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O IMPLÍCITA, INCLUYENDO PERO NO LIMITADO A:

- Que el Servicio sea ininterrumpido, oportuno, seguro o libre de errores
- Que los defectos sean corregidos
- Que el Servicio esté libre de virus u otros componentes dañinos
- La exactitud, fiabilidad o integridad de cualquier información proporcionada
- La idoneidad para un propósito particular
- La no infracción de derechos de terceros

### 8.2. Limitación de Responsabilidad

EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, CodeIbra, sus colaboradores y proveedores NO SERÁN RESPONSABLES ANTE EL USUARIO O TERCEROS POR:

a) Daños directos, indirectos, incidentales, especiales, consecuentes o ejemplares
b) Pérdida de datos, ingresos, beneficios, ahorros anticipados o clientela
c) Interrupción del negocio o pérdida de oportunidad
d) Daños por malware, vulnerabilidades de seguridad o fallos del sistema
e) Costes de adquisición de bienes o servicios sustitutivos
f) Reclamaciones de terceros contra el Usuario

TODO ELLO, INCLUSO SI SE HA ADVERTIDO DE LA POSIBILIDAD DE TALES DAÑOS, Y CON INDEPENDENCIA DE LA TEORÍA LEGAL SOBRE LA QUE SE FUNDAMENTE LA RECLAMACIÓN.

### 8.3. Límite Máximo de Responsabilidad

En ningún caso la responsabilidad total de CodeIbra por todas las reclamaciones relacionadas con el Servicio superará la cantidad mayor entre:

- 100 EUR
- El importe total pagado por el Usuario a CodeIbra durante los 12 meses anteriores al hecho generador de la reclamación

### 8.4. Exclusiones

Nada en estos Términos excluye o limita la responsabilidad de CodeIbra por:

- Muerte o daños personales causados por negligencia
- Fraude o declaraciones fraudulentas
- Incumplimiento doloso de obligaciones contractuales esenciales
- Cualquier otra responsabilidad que no pueda ser excluida o limitada por ley

---

## 9. Indemnización

El Usuario acepta indemnizar, defender y mantener indemne a CodeIbra, sus colaboradores, directivos, empleados y agentes, frente a cualquier reclamación, demanda, pérdida, daño, coste o gasto (incluyendo honorarios razonables de abogados) derivados de:

a) El uso del Servicio por parte del Usuario en violación de estos Términos
b) El Contenido del Usuario que infrinja derechos de terceros
c) La violación por parte del Usuario de cualquier ley, reglamento o normativa aplicable
d) Cualquier disputa entre el Usuario y terceros relacionada con el Servicio

CodeIbra se reserva el derecho de asumir la defensa exclusiva de cualquier reclamación sujeta a indemnización, y el Usuario cooperará plenamente con dicha defensa.

---

## 10. Privacidad y Protección de Datos

### 10.1. Política de Privacidad

El tratamiento de datos personales se regirá por lo dispuesto en la [Política de Privacidad](PRIVACY-POLICY.md), que forma parte integrante de estos Términos.

### 10.2. Acuerdo de Tratamiento de Datos (DPA)

Cuando el Usuario actúe como Responsable del Tratamiento y utilice el Servicio para tratar datos personales de terceros, se aplicará el [Acuerdo de Tratamiento de Datos](DATA-PROCESSING-AGREEMENT.md) (DPA) disponible en el sitio web del Proyecto.

### 10.3. Cookies

El uso de cookies y tecnologías similares se regula en la [Política de Cookies](COOKIE-POLICY.md).

---

## 11. Comunicaciones y Notificaciones

### 11.1. Comunicaciones Electrónicas

Al utilizar el Servicio, el Usuario acepta recibir comunicaciones electrónicas de CodeIbra, incluyendo:

- Notificaciones de servicio y administrativas
- Actualizaciones de seguridad
- Información sobre cambios en los Términos o Políticas
- Comunicaciones comerciales (con consentimiento previo)

### 11.2. Notificaciones Oficiales

Las notificaciones oficiales relacionadas con estos Términos se realizarán por escrito y se enviarán a la dirección de correo electrónico proporcionada por el Usuario en su registro, o a través de la interfaz del Servicio.

---

## 12. Legislación Aplicable y Jurisdicción

### 12.1. Legislación Aplicable

Estos Términos se regirán e interpretarán de conformidad con la legislación española, con exclusión de sus normas de conflicto legal y de la Convención de las Naciones Unidas sobre Compraventa Internacional de Mercaderías.

### 12.2. Jurisdicción

Para cualquier controversia derivada de estos Términos, las Partes se someten a la jurisdicción exclusiva de los juzgados y tribunales de la ciudad de Madrid, España, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.

### 12.3. Resolución Alternativa de Conflictos

Antes de acudir a la vía judicial, las Partes se comprometen a intentar resolver cualquier controversia mediante:

- Negociación directa durante un plazo de 30 días
- Mediación ante un mediador designado de común acuerdo
- Arbitraje de la Corte de Arbitraje de Madrid (en su defecto)

---

## 13. Suspensión y Terminación

### 13.1. Terminación por el Usuario

El Usuario puede terminar su relación con el Servicio en cualquier momento mediante:

- Cancelación de su cuenta a través de la interfaz
- Solicitud de baja por correo electrónico a legal@codeibra.dev
- Cese del uso del Servicio

### 13.2. Terminación por CodeIbra

CodeIbra puede suspender o terminar el acceso del Usuario al Servicio de forma inmediata si:

- El Usuario incumple cualquier disposición de estos Términos
- CodeIbra tiene motivos razonables para creer que el Usuario está realizando actividades ilícitas
- CodeIbra decide discontinuar el Servicio (con 30 días de antelación)

### 13.3. Efectos de la Terminación

Tras la terminación:

- El Usuario perderá el acceso al Servicio y a sus datos
- CodeIbra podrá eliminar el Contenido del Usuario después de 30 días
- Las disposiciones relativas a propiedad intelectual, limitación de responsabilidad, indemnización y legislación aplicable sobrevivirán a la terminación

---

## 14. Disposiciones Generales

### 14.1. Acuerdo Completo

Estos Términos, junto con la Política de Privacidad y cualquier otro documento incorporado por referencia, constituyen el acuerdo íntegro entre el Usuario y CodeIbra en relación con el Servicio.

### 14.2. Renuncia

La falta de ejercicio por CodeIbra de cualquier derecho establecido en estos Términos no constituirá una renuncia a dicho derecho.

### 14.3. Divisibilidad

Si alguna disposición de estos Términos se considera inválida, ilegal o inaplicable, dicha disposición se modificará y las demás disposiciones permanecerán en pleno vigor.

### 14.4. Cesión

El Usuario no podrá ceder sus derechos u obligaciones derivados de estos Términos sin el consentimiento previo por escrito de CodeIbra. CodeIbra podrá ceder estos Términos en su totalidad sin necesidad de consentimiento.

### 14.5. No Asociación

Nada en estos Términos crea una asociación, joint venture, agencia, relación laboral o de franquicia entre las Partes.

### 14.6. Fuerza Mayor

CodeIbra no será responsable por incumplimientos causados por eventos fuera de su control razonable, incluyendo actos de Dios, guerra, terrorismo, disturbios, embargos, incendios, inundaciones, huelgas, fallos de infraestructura de internet o cortes de suministro eléctrico.

---

## 15. Contacto

Para cualquier consulta, reclamación o notificación relacionada con estos Términos, el Usuario puede contactar:

**CodeIbra**
Correo electrónico: legal@codeibra.dev
Dirección postal: Calle de la Tecnología, 42, 28001 Madrid, España
Teléfono: +34 912 345 678
Sitio web: https://codeibra.dev

**Atención al Usuario:** support@codeibra.dev
**Delegado de Protección de Datos:** dpo@codeibra.dev

---

## 16. Documentos Relacionados

Estos Términos se complementan con los siguientes documentos, que forman parte integrante de la relación contractual:

- [LICENSE.md](LICENSE.md) — Licencia de uso del software
- [PRIVACY-POLICY.md](PRIVACY-POLICY.md) — Política de privacidad
- [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md) — Acuerdo de tratamiento de datos
- [COOKIE-POLICY.md](COOKIE-POLICY.md) — Política de cookies
- [SECURITY-POLICY.md](SECURITY-POLICY.md) — Política de seguridad
- [DISCLAIMER.md](DISCLAIMER.md) — Aviso legal y exención de responsabilidad
- [BUG-BOUNTY.md](BUG-BOUNTY.md) — Política de divulgación de vulnerabilidades

---

*Documento generado y mantenido por CodeIbra para el proyecto Backend Template.*
*Última actualización: 1 de enero de 2026*

---

**Backend Template** — Creado por CodeIbra
Copyright (c) [2026] CodeIbra. Todos los derechos reservados.
