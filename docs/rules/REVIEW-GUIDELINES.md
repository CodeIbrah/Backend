# Guía de Code Review — Backend Template

> **Versión:** 1.0.0  
> **Última actualización:** 2026-06-29  
> **Aplica a:** Todos los Pull Requests del proyecto

---

## Índice

1. [Introducción](#1-introducción)
2. [El Proceso de Review](#2-el-proceso-de-review)
3. [Qué Revisar](#3-qué-revisar)
4. [Checklist de Funcionalidad](#4-checklist-de-funcionalidad)
5. [Checklist de Seguridad](#5-checklist-de-seguridad)
6. [Checklist de Rendimiento](#6-checklist-de-rendimiento)
7. [Checklist de Estilo y Calidad](#7-checklist-de-estilo-y-calidad)
8. [Checklist de Pruebas](#8-checklist-de-pruebas)
9. [Feedback Constructivo](#9-feedback-constructivo)
10. [Requerimientos de Aprobación](#10-requerimientos-de-aprobación)
11. [Self-Review Checklist](#11-self-review-checklist)
12. [Responsabilidades](#12-responsabilidades)
13. [Casos Especiales](#13-casos-especiales)

---

## 1. Introducción

El Code Review es una de las prácticas más importantes para mantener la calidad del código. No se trata de encontrar errores, sino de **compartir conocimiento, mejorar el diseño y prevenir problemas antes de que lleguen a producción**.

### 1.1 Objetivos del Code Review

| Objetivo | Descripción |
|----------|-------------|
| **Calidad** | Asegurar que el código cumple con los estándares |
| **Seguridad** | Detectar vulnerabilidades antes de producción |
| **Mantenibilidad** | Código claro y fácil de mantener |
| **Conocimiento** | Compartir expertise entre el equipo |
| **Consistencia** | Mantener un estilo uniforme en todo el proyecto |
| **Prevención** | Detectar bugs y problemas de diseño temprano |

### 1.2 Filosofía

> "Review el código, no a la persona. Critique la implementación, no al autor."

---

## 2. El Proceso de Review

### 2.1 Diagrama del proceso

```
Autor crea PR
      │
      ▼
Asigna revisores (mínimo 1)
      │
      ▼
Revisor revisa código
      │
      ├── ✅ Aprobar → Merge
      │
      ├── 🔄 Solicitar cambios → Autor corrige → Volver a revisar
      │
      └── 💬 Comentar solo → Discusión → Iterar

Tiempo objetivo: < 24h hábiles para respuesta inicial
```

### 2.2 Roles

| Rol | Responsabilidad |
|-----|-----------------|
| **Autor** | Crear PR, responder feedback, hacer correcciones |
| **Revisor** | Revisar código, dar feedback constructivo, aprobar |
| **Mantenedor** | Merge final cuando se cumplen todos los requisitos |

### 2.3 Timeline esperado

| Etapa | Tiempo máximo |
|-------|---------------|
| Primera revisión | 24h hábiles |
| Respuesta a feedback | 24h hábiles |
| Re-revisión | 12h hábiles |
| Merge (post-aprobación) | Inmediato |

---

## 3. Qué Revisar

### 3.1 Áreas de revisión

```
PR recibido
    │
    ├── 1. Funcionalidad ──→ ¿Hace lo que debe?
    ├── 2. Seguridad    ──→ ¿Es seguro?
    ├── 3. Rendimiento ──→ ¿Es eficiente?
    ├── 4. Estilo      ──→ ¿Sigue estándares?
    ├── 5. Pruebas     ──→ ¿Está probado?
    ├── 6. Diseño      ──→ ¿Es mantenible?
    └── 7. Docs        ──→ ¿Está documentado?
```

### 3.2 Prioridades de revisión

| Prioridad | Aspecto | Por qué |
|-----------|---------|---------|
| 🔴 **Alta** | Seguridad | Vulnerabilidades = riesgo inmediato |
| 🔴 **Alta** | Funcionalidad | Bugs = impacto en usuarios |
| 🟡 **Media** | Rendimiento | Degradación afecta experiencia |
| 🟡 **Media** | Pruebas | Sin pruebas = deuda técnica |
| 🟢 **Baja** | Estilo | Prettier/ESLint lo corrigen automáticamente |

---

## 4. Checklist de Funcionalidad

### 4.1 Verificar

- [ ] ¿El código implementa correctamente los requerimientos?
- [ ] ¿Se cubren los casos de éxito?
- [ ] ¿Se cubren los casos de error y edge cases?
- [ ] ¿Las validaciones de entrada son correctas?
- [ ] ¿Los mensajes de error son claros y útiles?
- [ ] ¿El comportamiento con datos vacíos/nulos es correcto?
- [ ] ¿Hay regresiones en funcionalidad existente?
- [ ] ¿La integración con otros servicios funciona correctamente?

### 4.2 Ejemplo de revisión funcional

```typescript
// ❌ Problema: No maneja usuario no encontrado
async getUser(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  return user; // Si es null, devuelve null → 200 OK con null body
}

// ✅ Correcto
async getUser(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return user;
}
```

---

## 5. Checklist de Seguridad

### 5.1 Verificar

- [ ] **No hay secretos hardcodeados** (API keys, passwords, tokens)
- [ ] **Validación de entrada** con Zod en todos los endpoints
- [ ] **Autenticación** presente en endpoints protegidos
- [ ] **Autorización** (roles) correctamente implementada
- [ ] **No hay SQL injection** (usar Prisma queries, no raw SQL sin parámetros)
- [ ] **Rate limiting** configurado donde corresponde
- [ ] **No se exponen datos sensibles** en respuestas (passwordHash, etc.)
- [ ] **CORS** configurado con lista blanca
- [ ] **Headers de seguridad** (Helmet) presentes
- [ ] **No hay deserialización insegura**
- [ ] **Los IDs no son secuenciales** (usar UUIDs)
- [ ] **Validación de tamaño/type** en file uploads

### 5.2 Anti-patrones de seguridad

```typescript
// ❌ Nunca
const user = await this.prisma.user.findUnique({
  where: { id: req.body.id },  // No validado
});
return { ...user, passwordHash: undefined };  // Aún está en el objeto

// ✅ Siempre
const { id } = GetUserSchema.parse(req.params);
const user = await this.prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true, role: true },
});
```

---

## 6. Checklist de Rendimiento

### 6.1 Verificar

- [ ] **No hay N+1 queries** — Usar `include` o `select` de Prisma
- [ ] **Cache con Redis** para operaciones costosas
- [ ] **Índices de BD** cubren las queries nuevas
- [ ] **No hay bucles innecesarios** dentro de transacciones
- [ ] **Paginación** en listas (no `findMany()` sin `take`/`skip`)
- [ ] **Conexiones a BD/Redis** se cierran correctamente
- [ ] **Operaciones async** no bloquean el event loop
- [ ] **No hay memory leaks** (objetos grandes no referenciados)
- [ ] **Payloads de respuesta** no incluyen datos innecesarios

### 6.2 Anti-patrones de rendimiento

```typescript
// ❌ N+1 Query
const users = await this.prisma.user.findMany();
for (const user of users) {
  const posts = await this.prisma.post.findMany({
    where: { userId: user.id },
  });
}

// ✅ Query optimizada
const users = await this.prisma.user.findMany({
  include: { posts: true },
});

// ❌ Sin paginación
const all = await this.prisma.user.findMany();

// ✅ Con paginación
const page = await this.prisma.user.findMany({
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { createdAt: 'desc' },
});
```

---

## 7. Checklist de Estilo y Calidad

### 7.1 Verificar

- [ ] **TypeScript strict mode** sin `any`
- [ ] **Máximo 250 líneas por archivo**
- [ ] **Una clase/unidad por archivo**
- [ ] **Nombres descriptivos** (variables, funciones, clases)
- [ ] **Orden de imports** correcto
- [ ] **No hay código comentado**
- [ ] **No hay `console.log`** (usar Logger de NestJS)
- [ ] **Constantes extraídas** (no magic numbers/strings)
- [ ] **Funciones pequeñas** (ideal < 30 líneas)
- [ ] **Complejidad ciclomática baja** (evitar if anidados profundos)
- [ ] **Early returns** preferidos sobre if-else anidados
- [ ] **Principio DRY** — No duplicar código
- [ ] **Principio SOLID** — Responsabilidad única

### 7.2 Ejemplos de estilo

```typescript
// ❌ Complejidad innecesaria
function process(data: unknown): string {
  if (data !== null && data !== undefined) {
    if (typeof data === 'object') {
      if ('name' in data) {
        return String(data.name);
      }
    }
  }
  return 'default';
}

// ✅ Early return
function process(data: unknown): string {
  if (!data || typeof data !== 'object' || !('name' in data)) {
    return 'default';
  }
  return String(data.name);
}

// ❌ Magic numbers
if (errorCount > 5) {
  await this.sendAlert();
}

// ✅ Constante nombrada
const ALERT_THRESHOLD = 5;
if (errorCount > ALERT_THRESHOLD) {
  await this.sendAlert();
}
```

---

## 8. Checklist de Pruebas

### 8.1 Verificar

- [ ] **Pruebas unitarias** para toda nueva lógica de negocio
- [ ] **Pruebas de integración** para nuevos endpoints
- [ ] **Casos de éxito** cubiertos
- [ ] **Casos de error** cubiertos (400, 401, 403, 404, 500)
- [ ] **Edge cases** cubiertos (null, empty, valores límite)
- [ ] **Mocks adecuados** — No mockear lo que no pertenece a la unidad
- [ ] **Test names descriptivos** — `should return 404 when user not found`
- [ ] **No hay tests flaky** — No dependen de estado compartido
- [ ] **Cobertura no disminuye** respecto a main

### 8.2 Ejemplo de revisión de tests

```typescript
// ❌ Test que no prueba nada significativo
it('should work', async () => {
  const result = await service.getUser('1');
  expect(result).toBeDefined();
});

// ✅ Test bien definido
it('should return user data when user exists', async () => {
  const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
  mockRepo.findById.mockResolvedValue(mockUser);

  const result = await service.getUser('1');

  expect(result).toEqual({
    id: '1',
    email: 'test@test.com',
    name: 'Test',
  });
  expect(mockRepo.findById).toHaveBeenCalledWith('1');
});

it('should throw NotFoundError when user does not exist', async () => {
  mockRepo.findById.mockResolvedValue(null);

  await expect(service.getUser('999')).rejects.toThrow(NotFoundError);
});
```

---

## 9. Feedback Constructivo

### 9.1 Cómo dar feedback

```markdown
# ✅ Buen feedback (específico, amable, accionable)

"La función `processData` en la línea 45 tiene 3 niveles de anidamiento.
¿Has considerado usar un early return para reducir la complejidad?
Algo como:

if (!data) return defaultResult;
if (!data.isValid) return defaultResult;
// ... resto del código

Esto mejoraría la legibilidad."

# ❌ Mal feedback (genérico, negativo, vago)

"Esto está mal, refactorízalo."
"Tu código es muy complicado."
```
```

### 9.2 El sándwich de feedback

```
👍 Positivo  ── "Me gusta cómo manejaste los edge cases..."

🔧 Constructivo ── "Sin embargo, la función podría beneficiarse 
                    de early returns para reducir anidamiento..."

👍 Cierre  ── "En general el enfoque es sólido, buen trabajo."
```

### 9.3 Tipos de comentarios

| Tipo | Cuándo usarlo | Ejemplo |
|------|---------------|---------|
| **Pregunta** | Cuando no entiendes algo | "¿Por qué elegiste esta aproximación?" |
| **Sugerencia** | Mejora opcional | "Podrías considerar extraer esta lógica a un helper" |
| **Solicitud de cambio** | Error o violación de estándar | "Esto necesita un early return" |
| **Elogio** | Código bien escrito | "Me gusta cómo implementaste la validación aquí" |
| **Nitpick** | Detalle menor (opcional) | "Falta un espacio después de este `if`" (marcar como nit) |

### 9.4 Emojis para categorizar feedback

| Emoji | Significado |
|-------|-------------|
| 💡 | Sugerencia / idea |
| ❓ | Pregunta / duda |
| 🔧 | Solicitud de cambio |
| 👍 | Aprobación / elogio |
| 📝 | Nitpick / detalle menor |
| 🔒 | Problema de seguridad |
| ⚡ | Problema de rendimiento |

---

## 10. Requerimientos de Aprobación

### 10.1 Reglas

| Requisito | Detalle |
|-----------|---------|
| **Mínimo de revisores** | 1 aprobación obligatoria |
| **Máximo de revisores** | 3 (para PRs grandes o críticos) |
| **CI verde** | Todos los checks deben pasar |
| **Sin cambios solicitados** | Todos los threads deben estar resueltos |
| **Autor no se aprueba** | Nunca hacer self-merge |

### 10.2 Cuándo aprobar

```markdown
Apruebo cuando:
✅ El código es correcto y seguro
✅ Los tests pasan y cubren el cambio
✅ El diseño sigue los principios del proyecto
✅ No quedan preguntas sin resolver
✅ Los cambios solicitados fueron aplicados
```

### 10.3 Cuándo solicitar cambios

```markdown
Solicito cambios cuando:
❌ Hay un bug o problema funcional
❌ Hay una vulnerabilidad de seguridad
❌ El código viola estándares del proyecto
❌ Faltan pruebas para el nuevo código
❌ El diseño es incorrecto o insostenible
```

---

## 11. Self-Review Checklist

### 11.1 Antes de crear el PR, el autor debe verificar

- [ ] **El código funciona** — Probado localmente
- [ ] **No hay bugs** — Casos de éxito y error probados
- [ ] **Pruebas pasan** — `npm run test` exitoso
- [ ] **Linter OK** — `npm run lint` sin errores
- [ ] **Build OK** — `npm run build` exitoso
- [ ] **Cobertura adecuada** — Nuevas pruebas para nuevo código

### 11.2 Autorevisión del código

- [ ] **Leí mi propio PR completo** antes de asignar revisores
- [ ] **Eliminé console.log** y debugging code
- [ ] **Verifiqué nombres de variables** — Claros y descriptivos
- [ ] **Verifiqué tipos** — Sin `any` ni type assertions
- [ ] **Verifiqué errores** — Todos los try/catch manejan errores
- [ ] **Verifiqué logging** — Nivel adecuado (info, warn, error)
- [ ] **Verifiqué comentarios** — Sin código comentado
- [ ] **Verifiqué el diff** — Solo los archivos necesarios

### 11.3 Autorevisión del PR description

- [ ] **Título descriptivo** siguiendo Conventional Commits
- [ ] **Descripción clara** del qué y por qué
- [ ] **Referencia al ticket/issue**
- [ ] **Instrucciones de prueba** para el revisor
- [ ] **Capturas de pantalla** si hay cambios visuales
- [ ] **Notas de breaking changes** si aplica

---

## 12. Responsabilidades

### 12.1 Del autor

- Crear PRs pequeños y enfocados (< 300 líneas)
- Proveer contexto suficiente en la descripción
- Responder feedback de manera oportuna
- Mantener la rama actualizada con main
- No mergear sin aprobación

### 12.2 Del revisor

- Revisar dentro del timeframe acordado (24h hábiles)
- Ser respetuoso y constructivo
- Enfocarse en problemas importantes, no solo estilo
- Explicar el "por qué" detrás del feedback
- Aprobar cuando el código está listo

### 12.3 Ambos

- Mantener una actitud profesional y colaborativa
- Separar a la persona del código
- Estar abierto a diferentes enfoques
- Priorizar el aprendizaje del equipo

---

## 13. Casos Especiales

### 13.1 PRs urgentes (hotfix)

```
Para hotfixes críticos:
- Revisión acelerada: 2 horas máximo
- Mínimo 1 revisor, pero puede ser async
- Se puede mergear con menos tests si es necesario
- Se documenta la deuda técnica para resolver después
```

### 13.2 PRs grandes (> 300 líneas)

```
Si un PR excede 300 líneas:
- El autor debe explicar por qué no se pudo dividir
- Se recomienda revisión por 2 personas
- El revisor puede solicitar dividir en PRs más pequeños
```

### 13.3 Discrepancias técnicas

```markdown
Cuando hay desacuerdo técnico:
1. Discutir en el PR con datos y argumentos
2. Si no hay consenso, escalar a un tercer revisor
3. La decisión final la toma el mantenedor del módulo
4. Documentar la decisión para futuras referencias
```
