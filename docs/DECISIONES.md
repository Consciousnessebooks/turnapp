# DECISIONES — TURNAPP

Formato de cada decisión: contexto, decisión, alternativas descartadas, cómo verificarla, fuente. Claude Code agrega acá cada decisión nueva, cada dato `[VERIFICAR]` verificado (URL y fecha) y cada aprobación de Martín (cita textual). Las decisiones de Martín (D-01 a D-06) mandan sobre la especificación y las auditorías.

## Decisiones de Martín (13/11/2026)

### D-01 · Repo público o privado: lo detecta Claude Code
Martín no sabe la visibilidad del repo. En la primera sesión, Claude Code la detecta con la API REST de GitHub (solo lectura), junto con lo que permite el plan (protección de rama, rulesets, entornos con secretos), y aplica la protección y el modo de despliegue correspondientes (ESPECIFICACION §5.3). Si hace falta algo de Martín, se lo pide con clics exactos (M-14, M-05). Resultado de la detección: _(lo completa la primera sesión)_.

### D-02 · Dominio propio: SÍ (única excepción al costo $0)
Claude Code verifica precio y requisitos vigentes (.com.ar en NIC Argentina y alternativas) y le da a Martín los pasos exactos para comprarlo. Hosting gratuito que permita uso comercial y dominio propio. El origen definitivo (`https://app.<dominio>`) queda listo antes de que el primer paciente instale la PWA o active avisos (Fase 1c, antes de la Fase 5). Por qué `app.`: el origen de la PWA queda fijo para siempre y el dominio raíz queda libre para un sitio comercial. Dominio elegido: _(pendiente, informe de Fase 0)_.

### D-03 · "Sesiones por mes" reemplaza a las frecuencias
Textual de Martín: "Necesitamos que tenga la opción de cargar cuántas sesiones por mes, hasta 4, pero con la posibilidad de agregar extras. Pueden ser 1, 2, 3, 4 o más."
Modelo (ESPECIFICACION §3): selector "1 · 2 · 3 · 4 · Más" con día y hora habitual; 1 = mismo ordinal (5º → último); 2 = cada dos semanas desde la primera sesión (alternativa 1ª y 3ª semana); 3 = tres semanas elegidas; 4 = todas las semanas con la 5ª incluida por defecto y opción "máximo 4 por mes"; "Más" = varios horarios fijos y/o más de 4 por mes; sesiones extra en cualquier momento, que cuentan en el día 25 y en el total del mes. Regla 7 = "cambio de sesiones por mes" sin huecos. Migración: semanal → 4, quincenal → 2 (conservando la paridad), mensual → 1, bimestral → cada 8 semanas, trimestral → cada 12 semanas (Martín pidió "cada N semanas"; 8 y 12 son la aproximación entera más cercana sin pasar de 2 y 3 meses; el informe de migración le muestra al profesional las próximas fechas para que ajuste). Backtesting obligatorio de todos los patrones (§8.3). Martín valida la pantalla de alta en la preview (M-17) antes de cerrar la Fase 4.
Decisiones de detalle tomadas por el editor del kit: la primera sesión siempre se agenda en la fecha elegida y, si no coincide con el patrón, queda como extra; "semana del mes" = ordinal del día de la semana (`ceil(día/7)`); en 3 por mes no se usa la 5ª semana; "Sin horario fijo" vive dentro de "Más"; colores por opción en §3.3.

### D-04 · Feriados: preguntar antes, nunca cancelar en silencio
14 días antes, "Atiendo / No atiendo" por cada feriado con turnos (se repite a los 7 días y el día anterior); "No atiendo" crea un bloqueo que avisa a los pacientes; sin respuesta, nada cambia. Lista oficial mantenida y verificada, con puentes por decreto. Configuración para automatizarlo (ESPECIFICACION §3.8). Reemplaza el `atiende_feriados = false` del borrador.

### D-05 · Piloto primero
Recorte "Piloto 1" con un profesional real (ESPECIFICACION §2.5 y §9): "Crear profesional" de 3 campos adelantado a la Fase 3, plan "Fundador" gratis y sin límite, carga rápida y "Pegar lista". Las 8 reglas siguen obligatorias para el MVP final; solo cambia el orden (reglas 6 y 7 completas en v1.1). Quién es el profesional piloto: Claude Code se lo pregunta a Martín en M-16.

### D-06 · Estructura de la entrega
Martín sube el kit a `main` antes de la primera sesión (guía). Por eso `CLAUDE.md`, `.claude/agents/` y el hook cargan desde la primera sesión, sin una fase de arranque con reinicio.

## Contradicciones entre auditorías resueltas por el editor del kit (criterio: lo más seguro que no frene el piloto)

| # | Tema | Posiciones | Decisión |
|---|---|---|---|
| C-01 | Token de Supabase para la sesión | producto-ux A10: un solo token de GitHub e introspección por workflow; seguridad C-2 y claude-code C4: token de solo lectura con alcance vía network secret | Token de alcance "Database: Read" del proyecto, solo para `/database/query/read-only`, más la guarda. Un token de escritura en GitHub no se usa para leer. Plan B: M-04. |
| C-02 | MFA del Super Admin | producto-ux M7: recomendado en el piloto, obligatorio en v1.1; seguridad C-6: obligatorio en el servidor (`aal2`) | Obligatorio en el servidor desde la Fase 3, con recuperación documentada antes de activarlo y segundo autenticador sugerido. Son 2 minutos de Martín. |
| C-03 | Vinculación de la app instalada en iPhone | pwa-push A5: cookie de traspaso + código de 6 dígitos; seguridad C-5: vinculación inversa con 8 caracteres o pepper + límite global; producto-ux C5: no borrar el fragmento, "Copiar/Pegar código" | Capas: fragmento que no se borra hasta estar instalada, cookie de traspaso (iOS 17.2+) y, de respaldo, vinculación inversa con código de 8 caracteres, "Copiar código" y "Pegar código", límite global y por IP. El código de 6 dígitos desaparece. El profesional también puede aprobar el código en el consultorio. |
| C-04 | Nombre del profesional en los avisos | producto-ux A9: siempre; seguridad M-6 y pwa-push M6: nunca por defecto | Apagado por defecto; el profesional puede activar "Mostrar mi nombre en los avisos". El caso de dos profesionales se resuelve al abrir el aviso. En avisos se dice "turno", no "sesión". |
| C-05 | Largo del cuerpo del aviso | producto-ux: 120; pwa-push: 178 | 120 caracteres, con versión corta y "Tocá para ver las fechas". |
| C-06 | Instalar en Android antes de activar avisos | pwa-push M7: recomendado; producto-ux C5: opcional | Permitido sin instalar (verificado en el dispositivo), con sugerencia persistente de instalar y detección de pérdida del permiso. |
| C-07 | Actualizar ramas apiladas | producto-ux M6: rebase; claude-code A2: merge | Merge de `origin/main` (rebase exige force push, prohibido). |
| C-08 | Mover una sesión | producto-ux C4: turno nuevo vinculado y el original "reprogramado"; seguridad A-6: misma fila con `fecha_ocurrencia` conservada | Misma fila (idempotencia garantizada), con `movido_desde` y el evento en `turnos_eventos`. |
| C-09 | Límite del alta rápida | producto-ux: 6 campos y 7 interacciones; claude-code B2: 7 y 10; Martín pidió "día y hora habitual" | 7 campos visibles (2 precargados) y 8 interacciones como máximo, contadas por el e2e. |
| C-10 | "Required reviewers" en el entorno `produccion` | seguridad C-1: "si está disponible" | No se usa: la regla de rama impide usar los secretos desde otra rama y el merge de Martín ya es la aprobación. Se evita un clic sin capacidad real de evaluación. |
| C-11 | Arranque | claude-code C2: Fase 0a con PR y reinicio de sesión, script de extracción | Innecesario con el kit subido a `main` (D-06). Las verificaciones de C2 (subagentes visibles, guarda activa) quedan como pasos del Arranque. |
| C-12 | Repo privado gratuito sin secretos de entorno | seguridad C-1: deploy manual o integración de Supabase; claude-code C3: sin protección, la guarda manda | Modo M (manual) por defecto, sin secretos de producción en GitHub; se le ofrece a Martín hacerlo público como opción; la base se aplica antes del merge. |
| C-13 | Generar VAPID y `CRON_SECRET` | seguridad A-8 y pwa-push A1: workflow aparte | Modo A: `bootstrap-secretos.yml` disparado por Martín. Modo M: generación en el navegador de Martín desde Plataforma. Nunca en la sesión ni en el chat. |
| C-14 | SMTP | borrador: Gmail; producto-ux A10: config como código; pwa-push M4: puertos | Proveedor con dominio propio (D-02); Gmail por 465 solo de respaldo temporal; config como código en modo A. |
| C-15 | Avisos previos a la sesión | borrador: 15/30/60; producto-ux A5: día anterior + 1 hora | Día anterior a las 19:00 activado y pre-sesión 1 hora por defecto, configurables. |
| C-16 | Tamaño del backtesting | producto-ux M9: 12 × 60 × 1 para el piloto; borrador: 18 × 200 × 3 con horario de verano | Piloto con todos los escenarios de D-03 y D-04 en 12 × 60 × 1; final completo con dos zonas con horario de verano. |
| C-17 | Cola de avisos y feed `.ics` | seguridad M-2 y A-7 vs pwa-push C1 y M4 (superpuestas) | Fusionadas: reclamo atómico con revalidación de vigencia; feed con token propio de solo lectura más descarga de eventos sueltos. |

## Decisiones técnicas heredadas del borrador (vigentes; detalle en ESPECIFICACION)
- Lógica de agenda en SQL como fuente única de verdad; frontend solo muestra (§3.6).
- TypeScript estricto, React Router, TanStack Query, zod, CSS Modules con tokens; sin Tailwind (§7.1).
- Producción recibe base y funciones solo por el workflow (modo A) o por pedido manual probado (modo M); nunca desde la sesión (§5.3–5.4).
- Origen y `id`/`scope`/`start_url` del manifest fijos para siempre (§7.2).
- Riesgo aceptado: `CRON_SECRET` legible en `net.http_request_queue`; mitigado porque `enviar-push` no recibe parámetros (§7.4).
- La clave privada VAPID no tiene copia: si se pierde, todos reactivan avisos.
- Publicaciones de Realtime permitidas (lista blanca para el test de catálogo): ninguna por ahora; si se usa Realtime para Alertas, solo la tabla `alertas` con RLS.

## Backlog de auditorías (hallazgos MEDIO/BAJO que no entran al piloto)
- Web Vitals de campo y presupuestos de tamaño como bloqueo (pwa-push M9): Fase 8; en el piloto solo se miden.
- Feed `.ics` del profesional (producto-ux M4), ajuste de honorarios en bloque (A11), embudo de instalación (pwa-push A5), varios profesionales con selector (producto-ux M5): v1.1.
- Proyecto `turnapp-staging` (seguridad A-1): opcional, solo si Martín tiene un segundo proyecto gratuito libre.
- MCP de Supabase (claude-code, datos verificados #17): no se usa; alcanza con el endpoint read-only.
- Notas clínicas cifradas, comprobantes, modo oscuro, varios consultorios: backlog de producto (§12).

## Datos verificados por el editor del kit (13/11/2026; reverificar antes de usar)
- Hooks de Claude Code: `PreToolUse` bloquea con `exit 2` aunque falle el JSON; `permissionDecision: "deny"` con exit 0 también; matcher `Edit|Write`; `disableAllHooks` existe en settings (por eso la guarda bloquea escribir `.claude/settings*.json`). https://code.claude.com/docs/en/hooks
- Subagentes: solo `name` y `description` obligatorios; `tools` y `disallowedTools` aceptan lista separada por comas; un directorio `agents` nuevo no se detecta en una sesión ya abierta. https://code.claude.com/docs/en/sub-agents
- Rotación de una clave legacy filtrada: crear secret key nueva, migrar, desactivar las legacy y revocar el secreto JWT legacy desde "JWT signing keys" ("Migrate JWT secret", "Rotate keys", y pasarlo de "Previously used" a "Revoked"); revocar antes de que venzan los tokens cierra sesiones activas. https://supabase.com/docs/guides/security/rotate-leaked-api-keys · https://supabase.com/docs/guides/auth/signing-keys
- Tokens personales de Supabase: con alcance por defecto, permiso "Database" con "Read", empiezan con `sbp_fc`; los de acceso total figuran "Legacy". https://supabase.com/docs/guides/platform/personal-access-tokens

## Registro de decisiones nuevas (Claude Code)
_(agregá acá, la más nueva arriba)_
