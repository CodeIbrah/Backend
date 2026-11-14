# Contrato: Canal en tiempo real

**Feature**: 001-main-go-migration | **Date**: 2026-10-10

Canal **nuevo**. No implementa compatibilidad con el protocolo socket.io anterior (FR-022).
El cliente se adapta a este contrato.

---

## Transporte

WebSocket sobre HTTP/1.1, implementación `gorilla/websocket`.

**Endpoint**: `GET /api/v1/realtime/stream`

**Endpoints de apoyo** (mismo origen, sin handshake WebSocket):

| Endpoint                       | Propósito                                               |
| ------------------------------ | ------------------------------------------------------- |
| `GET /api/v1/realtime/health`  | Estado del servicio de tiempo real                      |
| `GET /api/v1/realtime/backlog` | Últimas notificaciones perdidas durante una desconexión |

---

## Autenticación (FR-020)

El canal usa **el mismo mecanismo de identidad que el resto de la API**.

Dos modos, ambos aceptados:

1. **Cabecera de Authorization**: `Authorization: Bearer <token>` en el handshake.
2. **Parámetro de consulta**: `?access_token=<token>` para clientes que no pueden fijar
   cabeceras (WebSocket en navegador lo permite, pero algunos clientes no).

**Rechazo** (escenario 4 de User Story 4): sin token válido o caducado, el servidor responde
`401` al handshake y **no** establece ninguna conexión. No se acepta la conexión "para luego
cerrarla": el rechazo es anterior a la apertura.

**Reutilización de sesión**: el token debe corresponder a una fila activa en `sessions`
(`revoked_at IS NULL AND expires_at > now()`). Un token revocado corta el canal.

---

## Formato de mensajes

Todos los mensajes son JSON de texto. Marco `WebSocket` de texto (no binario).

### Del servidor al cliente

```json
{
  "type": "notification",
  "id": "uuid",
  "timestamp": "2026-10-10T12:00:00Z",
  "event": "profile.updated",
  "data": {}
}
```

| Campo       | Tipo    | Descripción                                                   |
| ----------- | ------- | ------------------------------------------------------------- |
| `type`      | enum    | `notification`, `degraded`, `heartbeat`, `error`              |
| `id`        | uuid    | Identificador del mensaje. Permite deduplicar tras reconexión |
| `timestamp` | RFC3339 | Cuándo se generó **en el servidor**, no cuándo se recibió     |
| `event`     | string  | Nombre del evento, ver tabla siguiente                        |
| `data`      | object  | Carga específica del evento                                   |

### Del cliente al servidor

El cliente **no envía datos de negocio**. Solo un `ping` de aplicación opcional y el
comando de Closure. Esto es deliberado: reduce la superficie de ataque del canal y elimina
la necesidad de validar entrada en esta conexión.

| Mensaje | Cuerpo              | Cuándo                                  |
| ------- | ------------------- | --------------------------------------- |
| `ping`  | `{}`                | Opcional, para medir latencia del canal |
| `pong`  | `{}`                | Automático                              |
| `close` | `{"reason": "..."}` | Cierre limpio                           |

Cualquier otro mensaje se responde con `type: "error"` y **no** invalida la conexión.

---

## Eventos

| `event`              | Disparador                    | `data`                                     |
| -------------------- | ----------------------------- | ------------------------------------------ |
| `profile.updated`    | El usuario cambia su perfil   | `{ "changedFields": ["email"] }`           |
| `preference.changed` | Cambio de preferencia         | `{ "key": "..." }`                         |
| `identity.linked`    | Vincula una identidad externa | `{ "provider": "google" }`                 |
| `session.revoked`    | Su sesión fue revocada        | `{}` — el cliente **debe** cerrar el canal |

---

## Degradación y reconexión (FR-019, FR-021)

Este es el núcleo del contrato. El legacy con socket.io no distinguía "caído" de "no hay
notificaciones"; el cliente no podía distinguir una ventana de fallo de un sistema inactivo.

### Cuando el servidor no puede sostener el canal

Envía `type: "degraded"` y **cierra la conexión con un código explícito**:

```json
{
  "type": "degraded",
  "timestamp": "2026-10-10T12:00:00Z",
  "event": "server.degraded",
  "data": {
    "reason": "connection_capacity",
    "retryAfterSeconds": 30,
    "fallbackAvailable": true
  }
}
```

| `reason`              | Significado                        |
| --------------------- | ---------------------------------- |
| `connection_capacity` | Se alcanzó el límite de conexiones |
| `shutdown`            | Apagado ordenado del proceso       |
| `internal_error`      | Fallo no clasificable              |

`fallbackAvailable: true` es la señal explícita de que **el cliente puede seguir operando sus
flujos consultando directamente** (FR-021). No se infiere de la desconexión: se dice.

### Cuando se interrumpe la conexión

El servidor envía un **close frame con código 1012** (service restart) o 1001 (going away)
cuando la causa es conocida. Un corte de red abrupto no produce close frame; el cliente debe
detectar la desconexión por su cuenta.

### Reconexión automática (FR-019)

**Es responsabilidad del cliente.** El servidor no reenvía ni reintenta.

**El servidor provee lo que hace posible reconectar bien**: cada mensaje lleva un `id` estable.
Tras reconectar, el cliente llama a `GET /api/v1/realtime/backlog?since=<timestamp>` y recibe
lo que se perdió. Sin ese endpoint, una desconexión de 30 segundos sería una ventana
ciega, y eso es exactamente lo que el requisito de "reconexión sin intervención del usuario"
no permite.

### Heartbeat

El servidor envía `type: "heartbeat"` cada 20 s. El cliente que no recibe dos consecutivos
debe considerar la conexión muerta. Detecta conexiones zombis sin depender del TCP.

---

## Límites

| Límite                 | Valor             | Razón                                         |
| ---------------------- | ----------------- | --------------------------------------------- |
| Conexiones por usuario | 5                 | Suficiente para multi-dispositivo             |
| Conexiones totales     | 500               | Cabe holgadamente en 150 MB (Principio I)     |
| Tamaño de mensaje      | 64 KB             | Los mensajes son de notificación, no de datos |
| Buffer de escritura    | 1 MB por conexión | Evita crecimiento no acotado                  |
| Duración máxima        | Sin límite        | El canal sobrevive al TTL de la sesión        |

---

## Códigos de cierre

| Código | Significado                              |
| ------ | ---------------------------------------- |
| 1000   | Cierre normal                            |
| 1001   | Going away (apagado)                     |
| 1008   | Violación de política (mensaje inválido) |
| 1011   | Error interno                            |
| 1012   | Service restart — reconectar             |
| 1013   | Try again later — capacidad              |

---

## Códigos de error del handshake

| HTTP  | Causa                                        |
| ----- | -------------------------------------------- |
| `401` | Token ausente, inválido, caducado o revocado |
| `426` | El servidor no admite WebSocket              |
| `429` | Límite de conexiones por usuario excedido    |
| `503` | Servicio degradado, sin nuevas conexiones    |

---

## Verificación

Los escenarios de User Story 4 se prueban así:

| Escenario                  | Prueba                                                                  |
| -------------------------- | ----------------------------------------------------------------------- |
| Notificación sin consultar | Abrir canal, cambiar datos por otra vía, recibir el mensaje             |
| Aviso + reconexión         | Cortar el canal, reconectar, recuperar por backlog                      |
| Degradación explícita      | Llevar el servidor a capacidad, recibir `degraded`, seguir por consulta |
| Rechazo sin credenciales   | Conectar sin token, obtener 401, verificar que no hay canal abierto     |
