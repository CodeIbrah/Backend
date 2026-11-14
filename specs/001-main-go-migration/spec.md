# Feature Specification: Migración de la API principal a Go

**Feature Branch**: `001-main-go-migration`

**Created**: 2026-10-10

**Status**: Ready for Planning

**Input**: User description: "Migración de main a Go. El proyecto actual (`main`) es un servicio NestJS de 5.071 líneas con 33 dependencias y 8 modelos Prisma que debe reescribirse en Go para reducir el consumo de recursos en un hardware limitado (i3 2 núcleos, 8 GB RAM) y eliminar deuda arquitectónica: el Dockerfile de main nunca compiló, la persistencia en memoria es inválida y no existe comunicación interna entre servicios."

## Clarifications

### Session 2026-10-10

- Q: Which legacy modules (`audit`, `activity-log`, `reports`, `cipher`) must survive the
  rewrite? → A: `audit`, `activity-log` and `cipher` are preserved. `reports` is explicitly
  out of scope.
- Q: Are there real users whose data must be carried into the rewritten system? → A: No. The
  migration starts from a clean environment; no existing user data is carried over.
- Q: What happens to the real-time notification capability, which has no direct
  equivalent? → A: Real-time notifications are kept, delivered over a newly designed
  channel. The client is expected to be updated to consume it; backwards compatibility with
  the previous real-time protocol is not required.
- Q: Which external identity providers are in scope for the first version? → A: All six
  providers that exist today are reimplemented. The decision was made despite the fact
  that actual provider usage cannot be verified from this repository: it contains no
  frontend, and `apps/api-test-ui` is declared as a workspace but absent from disk. Deferring
  Apple to a later, unsized feature was rejected because it would relocate risk rather than
  reduce it.
- Q: What numeric latency target applies to the busiest route? → A: 200 ms at the 95th
  percentile. The previous wording "agreed percentile 95" named no number, which made the
  criterion unverifiable. 200 ms leaves headroom for Apple signature verification, which is
  inherently slow, on the constrained target hardware.
- Q: How long are audit and activity-log records retained? → A: 12 months in full detail,
  after which they are aggregated. Note this qualifies the append-only rule: append-only
  governs modification and deletion by operator action, not automated lifecycle handling.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Arranque del sistema completo en el hardware objetivo (Priority: P1)

Un desarrollador trabaja en su portátil — un Intel Core i3 con 2 núcleos y 8 GB de RAM — y
necesita levantar la API, la base de datos y la caché de forma simultánea para poder
desarrollar y probar. Anteriormente este arranque agotaba la memoria del sistema y
provocaba el reinicio del equipo a mitad de la operación.

**Why this priority**: Sin esto no hay desarrollo posible. Es el bloqueante cero: todo lo
demás se hace sobre un entorno que se cae. La constitution v1.0.0 (Principio I) lo fija
como presupuesto medible, no aspiracional.

**Independent Test**: Levantar el stack completo en la máquina objetivo, medir la
consu agregada de memoria del sistema operativo, y confirmar que la suma de todos los
procesos del proyecto permanece por debajo del umbral fijado sinswap.

**Acceptance Scenarios**:

1. **Given** un equipo limpio con el stack completo detenido, **When** el desarrollador
   inicia el entorno de desarrollo completo, **Then** todos los componentes quedan
   disponibles y el sistema operativo reporta la memoria total usada por el proyecto por
   debajo del presupuesto definido, sin swap activo.
2. **Given** el stack ya en ejecución, **When** el desarrollador ejecuta la batería de
   pruebas automatizadas, **Then** la máquina completes la ejecución sin reiniciarse y
   sinswap.
3. **Given** el stack en ejecución, **When** el desarrollador paraliza el proceso durante
   un minuto y lo reanuda, **Then** ningún dato persistido por el usuario se pierde.

---

### User Story 2 - Acceso de usuario y registro (Priority: P2)

Un usuario final abre la aplicación cliente, introduce su correo y contraseña y accede a
su cuenta. Si no tiene cuenta, se registra. Si olvida su contraseña, la recupera. Durante
todo el proceso, el servidor registra los eventos de seguridad correspondientes.

**Why this priority**: Es la funcionalidad central que da valor al sistema. Sin ella no
hay producto. Es independiente de las historias de proveedores externos porque el camino
correo/contraseña no depende de ningún tercero.

**Independent Test**: Registrar un usuario nuevo, iniciar sesión con él, cerrar sesión,
recuperar la contraseña por correo y verificar que queda registrado como evento de
seguridad. Todo ello contra la API sin ninguna otra funcionalidad activa.

**Acceptance Scenarios**:

1. **Given** un usuario se registra con un correo válido y una contraseña que cumple la
   política de robustez, **When** confirma el registro, **Then** recibe un token de acceso
   y puede llamar a un recurso protegido con él.
2. **Given** un usuario ya registrado, **When** envía sus credenciales correctas, **Then**
   obtiene un token de acceso y el evento de inicio de sesión queda registrado.
3. **Given** un usuario ya registrado, **When** envía una contraseña incorrecta, **Then**
   recibe un rechazo genérico que no revela si el correo existe, y el intento fallido
   queda registrado.
4. **Given** un usuario solicita la recuperación de contraseña, **When** completa el flujo,
   **Then** recibe un correo con un enlace de un solo uso que le permite establecer una
   contraseña nueva.
5. **Given** una petición sin token válido hacia un recurso protegido, **When** llega al
   servidor, **Then** se rechaza con un código de no autorizado y no se ejecuta ninguna
   lógica de negocio.

---

### User Story 3 - Acceso mediante proveedor externo (Priority: P3)

Un usuario que ya tiene una cuenta en un proveedor de identidad externo quiere acceder sin
crear una cuenta nueva en este sistema. Acepta la autorización en la pantalla del
proveedor y es devuelto a la aplicación ya autenticado.

**Why this priority**: Es una comodidad sobre el camino principal, no un requisito para
que el producto funcione. Se implementa después porque la integración con cada proveedor
tiene una complejidad propia y ninguna bloquea el resto del sistema.

**Independent Test**: Autenticar a un usuario exclusivamente a través de un proveedor
externo y verificar que llega al sistema con su identidad establecida, sin registro previo.

**Acceptance Scenarios**:

1. **Given** un usuario sin cuenta en este sistema, **When** inicia el flujo de acceso
   con un proveedor externo y completa la autorización, **Then** el sistema crea su
   registro y lo autentica en el mismo flujo.
2. **Given** un usuario ya vinculado a un proveedor externo, **When** repite el flujo de
   acceso con ese mismo proveedor, **Then** se autentica sobre su cuenta existente y no
   se crea un registro duplicado.
3. **Given** un usuario ya vinculado a un proveedor externo, **When** inicia sesión con
   correo y contraseña pero su correo no está verificado en ese proveedor, **Then** el
   sistema rechaza el uso de esa identidad y no vincula cuentas por dirección de correo
   sin verificar.
4. **Given** una respuesta de un proveedor externo con un token alterado, una firma que no
   valida o caducada, **When** el sistema la procesa, **Then** rechaza el acceso sin crear
   ni vincular ningún registro, con independencia de qué proveedor la emitiera.
5. **Given** un conjunto conocido de proveedores externos soportados, **When** se enumera
   la configuración del sistema, **Then** los seis proveedores previstos están disponibles
   y ninguno se omite de forma silenciosa.

---

### User Story 4 - Notificaciones en tiempo real (Priority: P4)

Un usuario con la aplicación abierta ve reflejados sus cambios sin recargar la página: si
cambia un dato de su perfil o su cuenta recibe una actualización de estado, la interfaz se
entera al momento. Si el canal se cae, la aplicación sigue siendo usable consultando
directamente y vuelve a conectarse sola.

**Why this priority**: Es funcionalidad que la experiencia del producto da por hecha, pero
ningún otro flujo depende de ella: el sistema opera íntegramente por consulta. Se
implementa después de la autenticación porque necesita identidad para autenticar el canal.

**Independent Test**: Abrir un canal de notificaciones con un usuario autenticado, provocar
un cambio en sus datos por otra vía y comprobar que la notificación llega sin que el
cliente haya consultado nada. Después, interrumpir el canal y comprobar que el cliente
recibe un aviso y se reconecta.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con un canal de notificaciones abierto, **When** se
   produce un cambio en sus datos, **Then** recibe la notificación correspondiente sin
   haber consultado el recurso.
2. **Given** un canal de notificaciones abierto, **When** la conexión con el servidor se
   interrumpe, **Then** el cliente recibe un aviso de la interrupción y se reconecta por sí
   solo sin intervención del usuario.
3. **Given** un canal de notificaciones abierto pero el servidor no puede sostener la
   conexión, **Then** el cliente recibe un aviso explícito de degradación y puede seguir
   operando sus flujos consultando directamente.
4. **Given** un cliente que intenta abrir un canal sin credenciales válidas, **When**
   conecta, **Then** el servidor rechaza la conexión sin haber establecido ningún canal.

---

### User Story 5 - Diagnóstico de fallos en producción (Priority: P5)

Un operador atiende un reporte de un usuario que experienced un error. Necesita localizar
en qué punto exacto falló la petición, con qué identificador de correlación, y si el
problema fue del sistema o de un servicio externo.

**Why this priority**: Es la capacidad que evita migración a ciegas. Sin ella, cada
incidente obliga a instrumentar a posteriori y repetir el fallo en desarrollo.

**Independent Test**: Provocar un fallo controlado, capturar el identificador de
correlación devuelto al cliente, y localizar esa misma petición con todos sus
registros y métricas desde una consulta de solo lectura.

**Acceptance Scenarios**:

1. **Given** una petición que falla, **When** el operador busca con el identificador de
   correlación devuelto al cliente, **Then** recupera todos los registros de esa
   petición, incluidas las llamadas a servicios externos, ordenados cronológicamente.
2. **Given** el sistema en ejecución, **When** el operador consulta las métricas, **Then**
   obtiene el número de peticiones, la tasa de error y la latencia por percentiles para
   cada ruta.
3. **Given** una dependencia caída, **When** el operador consulta la comprobación de
   estado, **Then** el sistema informa qué dependencia concreta no responde, en lugar de
   informar un estado genérico.

### Edge Cases

- **Reinicio durante una operación**: el sistema se apaga mientras procesa una petición de
  escritura. Al reiniciar, esa escritura está confirmada y las que no lo estaban se
  reportan como fallidas de forma explícita, nunca como exitosas.
- **Correo ya registrado**: el registro se rechaza con un mensaje genérico que no revela
  si el correo está en el sistema.
- **Correo con formato inválido o de tipo no permitido**: se rechaza en el límite, antes
  de tocar la base de datos.
- **Contraseña débil**: se rechaza con criterios de robustez explícitos y accionables.
- **Correo duplicado por diferencia de mayúsculas o espacios circundantes**: se trata
  como el mismo correo y no se crea un registro adicional.
- **Token expirado o malformado**: se rechaza con un mensaje que distingue el error del
  cliente, de modo que el cliente sabe si debe renovar o reautenticarse.
- **Proveedor externo caído o lento**: el inicio de sesión falla con un mensaje claro y en
  un tiempo acotado, sin dejar la petición colgada.
- **Petición simultánea con el mismo token desde varias peticiones**: cada petición lleva
  su propia traza y el sistema no confunde una con otra.
- **Base de datos o caché no disponible al arrancar**: el sistema arranca en estado
  degradado, lo señala en su comprobación de estado y no acepta tráfico que requiera la
  dependencia caída.
- **Dependencia lenta que excede el tiempo de espera**: la petición se abandona con error
  explícito y se registra como agotada, no como correcta.
- **Volumen alto de tráfico simultáneo**: el sistema degrada de forma controlada en lugar
  de agotar la memoria disponible.

## Requirements _(mandatory)_

### Functional Requirements

#### Autenticación y sesión

- **FR-001**: El sistema MUST permitir a un usuario registrarse con dirección de correo y
  contraseña, y establecer su identidad en el mismo flujo.
- **FR-002**: El sistema MUST autenticar a un usuario registrado mediante correo y
  contraseña, emitiendo un token de acceso con caducidad definida.
- **FR-003**: El sistema MUST rechazar las peticiones sin token válido hacia recursos
  protegidos sin ejecutar lógica de negocio alguna.
- **FR-004**: El sistema MUST permitir a un usuario recuperar el acceso a su cuenta
  mediante un enlace de un solo uso, y ese enlace MUST expirar.
- **FR-005**: El sistema MUST exponer una forma de renovar el acceso sin exigir al usuario
  volver a introducir credenciales.
- **FR-006**: El sistema MUST registrar como evento de seguridad cada intento de inicio de
  sesión, incluidos los fallidos, con marca temporal, origen e identidad involucrada.
- **FR-007**: El sistema MUST responder con el mismo mensaje genérico ante un correo no
  registrado y ante una contraseña incorrecta.
- **FR-008**: El sistema MUST vincular una identidad de proveedor externo a un registro
  existente únicamente cuando la asociación esté verificada por ese proveedor.
- **FR-008a**: El sistema MUST validar criptográficamente la respuesta de cada proveedor
  externo antes de aceptarla, y MUST rechazarla si la firma no valida, si el token está
  alterado o si ha caducado. La validación MUST ser específica del proveedor y MUST NOT
  delegar la integridad de la respuesta en el mero éxito de la llamada HTTP.
- **FR-008b**: El sistema MUST soportar los seis proveedores de identidad que existen en el
  sistema actual. La configuración MUST permitir consultar su estado de forma explícita, de
  modo que la ausencia de un proveedor no pueda pasar inadvertida.

#### Gestión de usuarios

- **FR-009**: El sistema MUST permitir consultar y modificar el perfil del usuario
  autenticado, incluidos sus datos de contacto y preferencias.
- **FR-010**: El sistema MUST validar toda la entrada del usuario en el límite de la
  petición, antes de que alcance la lógica de negocio.
- **FR-011**: El sistema MUST impedir que un usuario acceda a los datos de otro usuario.

#### Persistencia

- **FR-012**: El sistema MUST persistir todo estado que acepte del cliente y reporte de
  vuelta, de modo que sobreviva a un reinicio completo del proceso.
- **FR-013**: El sistema MUST usar almacenamiento relacional como única fuente de
  verdad para datos de negocio.
- **FR-014**: El sistema MUST permitir deshacer cambios no confirmados mediante un
  mecanismo transaccional, de modo que un fallo intermedio no deje datos a medias.
- **FR-015**: El sistema MUST generar identificadores de forma que las colisiones no sean
  posibles bajo concurrencia.
- **FR-016**: El sistema MUST aplicar cada cambio de estructura de datos como una
  migración versionada, reversible y aplicada de forma explícita.
- **FR-017**: El sistema MUST cachear únicamente datos derivados y MUST ser capaz de
  reconstruirlos por completo desde la fuente de verdad.

#### Comunicación en tiempo real

- **FR-018**: El sistema MUST notificar a los clientes conectados los cambios
  relevantes en sus datos sin que estos deban consultar repetidamente.
- **FR-019**: El sistema MUST avisar al cliente cuando la comunicación en tiempo real se
  interrumpe y MUST permitir la reconexión automática sin intervención del usuario.
- **FR-020**: El sistema MUST autenticar el canal en tiempo real con el mismo mecanismo de
  identidad que el resto de la API, y MUST rechazarla si carezca de credenciales válidas.
- **FR-021**: El sistema MUST avisar de forma explícita cuando no puede sostener la
  comunicación en tiempo real, de modo que el cliente pueda seguir operando sus flujos por
  consulta directa.
- **FR-022**: El diseño del canal en tiempo real MUST ser nuevo. La compatibilidad con el
  protocolo de tiempo real del sistema anterior NO es un requisito, y el cliente se
  adapta al canal nuevo.

#### Observabilidad

- **FR-023**: El sistema MUST emitir registros estructurados que incluyan un identificador
  de correlación por petición, y ese identificador MUST propagarse a todas las
  operaciones derivadas, incluidas las llamadas externas.
- **FR-024**: El sistema MUST exponer métricas de volumen de peticiones, tasa de error y
  latencia por percentiles para cada ruta.
- **FR-025**: El sistema MUST exponer una comprobación de estado que informe el estado
  real de cada dependencia, identificando cuál falla cuando alguna no responde.
- **FR-026**: El sistema MUST exponer un mecanismo de trazas que permita reconstruir el
  recorrido completo de una petición, incluidas las llamadas a servicios de terceros.
- **FR-027**: El sistema MUST establecer un tiempo máximo de respuesta para toda llamada
  a un servicio externo y MUST tratar su excedencia como error explícito.

#### Operación y despliegue

- **FR-028**: El sistema MUST arrancar y quedar operativo sin requerir la presencia de
  más de un proceso propio de la aplicación.
- **FR-029**: El sistema MUST construir una imagen de contenedor desde una definición
  limpia y multi-etapa, y esa construcción MUST verificarse de forma automática antes de
  integrar cambios.
- **FR-030**: El sistema MUST exponer su configuración exclusivamente por variables de
  entorno, sin valores secretos escritos en el repositorio.
- **FR-031**: El sistema MUST aplicar límites de memoria explícitos a cualquier
  dependencia con consumo acotado, y su política de expulsión MUST preservar la
  integridad de los datos encolados.
- **FR-032**: El sistema MUST NOT depender de ninguna capacidad de plataforma que no esté
  disponible en el entorno objetivo.

#### Auditoría, bitácora de actividad y cifrado

- **FR-033**: El sistema MUST mantener una bitácora de actividad de las acciones de los
  usuarios, distinguishable del registro de eventos de seguridad de FR-006.
- **FR-034**: El sistema MUST permitir consultar la bitácora de actividad y los registros
  de auditoría por usuario y por intervalo temporal, con paginación.
- **FR-035**: Los registros de auditoría y de bitácora MUST ser de solo adición: el sistema
  MUST NOT ofrecer una vía para modificarlos o eliminarlos. Esta regla se refiere a la acción
  del operador y MUST NOT impedir el tratamiento automático por ciclo de vida descrito en
  FR-035b.
- **FR-035b**: El sistema MUST conservar los registros de auditoría y de bitácora en su
  detalle íntegro durante doce meses. Superado ese plazo, el sistema MUST reducir su
  volumen mediante agregación por intervalo temporal, y MUST NOT conservar el detalle
  individual de los registros agregados. El proceso de agregación MUST ser reversible en el
  sentido de que MUST NOT alterar los registros que aún se conservan en detalle.
- **FR-036**: El sistema MUST cifrar los datos sensibles en reposo y MUST permitir su
  descifrado únicamente a través de una clave gestionada fuera del código y fuera de la
  configuración versionada.
- **FR-037**: El sistema MUST rotar la clave de cifrado sin necesidad de reescribir los
  datos protegidos.

### Key Entities

- **Usuario**: Persona capaz de autenticarse. Atributos: identificador, dirección de correo
  (única), marca temporal de creación, marca temporal de verificación, estado de la
  cuenta.
- **Identidad vinculada**: Credencial externa asociada a un usuario, con el proveedor como
  discriminante. Atributos: proveedor, identificador dentro del proveedor, marca temporal
  de vinculación. Un usuario puede tener varias; la combinación de proveedor e
  identificador es única.
- **Sesión o token de acceso**: Acceso emitido tras una autenticación exitosa. Atributos:
  usuario asociado, marca de emisión, marca de caducidad, estado de revocación.
- **Recuperación de acceso**: Solicitud temporal de restablecimiento. Atributos: usuario,
  token de un solo uso, marca de emisión, marca de caducidad, marca de uso.
- **Evento de seguridad**: Registro de auditoría de un intento de autenticación. Atributos:
  tipo de evento, usuario involucrado cuando existe, marca temporal, origen de la petición,
  identificador de correlación, resultado.
- **Entrada de bitácora de actividad**: Registro append-only de una acción realizada por un
  usuario sobre sus propios datos. Atributos: usuario, tipo de acción, recurso afectado,
  marca temporal, identificador de correlación. Se distingue del evento de seguridad por
  tratar de actividad de negocio y no de intentos de autenticación.
- **Material cifrado**: Valor almacenado en forma cifrada junto con el identificador del
  algoritmo y de la versión de clave con que fue cifrado, para permitir la rotación.
- **Preferencia de usuario**: Ajuste de comportamiento asociado a un usuario. Atributos:
  clave, valor, marca temporal de actualización.
- **Cambio de datos de negocio**: Cualquier registro que el sistema acepte del cliente y
  reporte de vuelta. Existe únicamente en almacenamiento persistente.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El stack de desarrollo completo, en ejecución simultánea, mantiene la
  memoria total usada por el proyecto por debajo del 40% de la memoria física del equipo
  objetivo, y el equipo no se reinicia ni entra en swap durante ninguna operación de
  desarrollo, incluidas las pruebas automatizadas.
- **SC-002**: El proceso de la API consume menos de 150 MB de memoria en reposo.
- **SC-003**: El 100% de los registros de datos de negocio sobreviven a un reinicio
  completo del proceso.
- **SC-004**: El 100% de los flujos de usuario descritos en las historias 2, 3, 4 y 5 están
  cubiertos por pruebas automatizadas que pasan de forma integrada.
- **SC-005**: Ante una petición que falla, el operador localiza el recorrido completo de
  esa petición en menos de dos minutos usando únicamente el identificador devuelto al
  cliente.
- **SC-006**: El 95% de las peticiones de la ruta de mayor tráfico se atienden en menos de
  200 milisegundos, medido en el percentil 95 sobre la carga de trabajo de referencia
  definida en la especificación de plan.
- **SC-007**: Cero peticiones con fallo de autorización que alcancen datos pertenecientes a
  otro usuario, verificado mediante pruebas automatizadas de aislamiento entre identidades.
- **SC-008**: La construcción automatizada de la imagen de contenedor tiene éxito en cada
  integración a la rama principal, sin intervención manual.
- **SC-009**: Cero secretos presentes en el repositorio, verificado mediante análisis
  automatizado en cada integración.
- **SC-010**: El 100% de las acciones de los usuarios quedan registradas con marca
  temporal e identificador de correlación.

## Assumptions

- **Alcance**: Esta especificación cubre únicamente la API principal. El destino de los
  cuatro microservicios existentes queda fuera de este alcance y requiere su propia
  especificación. Los microservicios no son dependencia de esta API, porque se verificó
  que no existen llamadas entre ellos ni hacia ellos desde la API principal.
- **Datos existentes**: Confirmado que no existen datos de usuario reales que conservar. La
  reescritura parte de un entorno limpio y no incluye migración de datos. Si en el futuro
  apareciera un conjunto de datos a preservar, requiere su propia especificación.
- **Módulos conservados y retirados**: `audit`, `activity-log` y `cipher` se conservan con
  el comportamiento descrito en FR-033 a FR-037. La generación de reportes queda
  explícitamente fuera de alcance.
- **Retención de auditoría y bitácora**: Doce meses en detalle íntegro y agregación
  posterior. El sistema anterior no tenía política alguna porque su almacenamiento era en
  memoria, por lo que esta decisión es nueva y no replica comportamiento previo.
- **Proveedores de identidad**: Los seis proveedores de acceso actuales se reimplementan en
  su totalidad dentro de esta especificación. Apple requiere verificación de firma de token
  propia y es la integración de mayor riesgo. El uso real por proveedor no puede verificarse
  desde este repositorio, al no contener frontend, por lo que el alcance se fija por
  replicación del sistema existente y no por demanda observada.
- **Comunicación en tiempo real**: No existe equivalente directo al protocolo actual de
  notificaciones en tiempo real. Se implementa un canal de diseño nuevo con capacidad de
  reconexión y degradación explícita. El cliente se adapta al canal nuevo; la compatibilidad
  con el protocolo anterior no es un requisito.
- **Pasarelas de pago**: Fuera de alcance. El sistema no expone funcionalidad de pago en
  esta especificación.
- **Correo electrónico**: Se asume un proveedor de envío de correo disponible en el
  entorno objetivo para la recuperación de acceso.
- **Entorno objetivo**: Intel Core i3 de 2 núcleos con 8 GB de RAM, sin aceleración por
  GPU. Los presupuestos de esta especificación están calculados para ese equipo y no
  deben reinterpretarse para hardware de servidor.
- **Caché**: Se asume que existe un almacén de caché disponible. Su configuración de
  expulsión MUST preservar los datos encolados; una política que expulse claves de cola
  provocaría pérdida silenciosa de trabajo.
- **Proveedor de despliegue en contenedores**: Se asume que existe un entorno capaz de
  ejecutar contenedores en el objetivo de producción. El entorno de desarrollo local no
  lo requiere y no debe imponerlo.
- **Métricas y trazas**: Se asume que la infraestructura de recolección de métricas y
  trazas está disponible en producción. El sistema es responsable de exponerlas, no de
  almacenarlas.
- **Carga de trabajo de referencia**: SC-006 se mide sobre un perfil de carga definido en la
  fase de plan. Ese perfil MUST ser representativo del uso previsto y MUST quedar escrito
  antes de dar por válida la medición; sin él, el criterio no es reproducible.
- **Agregación de registros**: La agregación tras doce meses requiere que el sistema pueda
  distinguir, en la información agregada, la acción totals desde acciones de un tipo
  determinado. Si el detalle es necesario para una investigación posterior, esa necesidad
  debe resolverse exportando antes de que venza el plazo.

## Deferred Items

- **Destino de los cuatro microservicios** (payment, mail, sms, notifications): requiere
  especificación propia. Hallazgo relevante: los cuatro carecen de persistencia real y
  de comunicación interna; dado su estado, migrarlos no aporta valor funcional.
- **Puertos gRPC**: el servidor gRPC existente no tiene consumidores. Su conservación
  requiere justificación de frontera según el Principio II.
- **Estrategia de despliegue en la nube**: los objetivos de despliegue existentes
  (Elastic Beanstalk, Azure App Service, Cloud Run) no han sido validados contra esta
  especificación.
- **Perfil de carga de referencia**: El número de SC-006 queda fijado, pero la carga
  concreta sobre la que se mide se define en la fase de plan. SC-006 no puede validarse
  hasta que ese perfil esté escrito.
- **Agregación frente a investigación**: Una vez agregado un registro, su detalle individual
  deja de estar disponible. Las investigaciones que lo requieran deben exportar los datos
  antes de que venza el plazo de doce meses.
- **Fecha de ratificación de la constitution**: pendiente de confirmar si la fecha
  efectiva es la de adopción.
