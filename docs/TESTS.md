# TESTS — TURNAPP

Mapa de las 8 reglas fundacionales (ESPECIFICACION §2.2) a los tests que las prueban. Lo completa `qa-testing` a medida que se escriben. Un test se lista solo si existe en el repo y pasa en CI.

| Regla | Qué tiene que probarse | Tests (archivo › nombre) | Estado |
|---|---|---|---|
| 1. Reserva automática por sesiones por mes | Generación 1/2/3/4/Más sin duplicados ni choques; extras sin tocar el patrón; backtesting §8.3 | — | Sin tests todavía |
| 2. Aislamiento de datos | Matriz RLS: paciente A no ve ni toca datos de B; profesional solo lo suyo; Super Admin solo agregados | — | Sin tests todavía |
| 3. Resumen mensual (día 25) | Fechas del mes siguiente (patrón + extras), honorario y total; reloj simulado | — | Sin tests todavía |
| 4. Cancelación por el paciente | Anticipación mínima validada en el servidor; aviso al profesional; WhatsApp si falta menos | — | Sin tests todavía |
| 5. Multiplataforma | e2e en 360 y 1280 px; instalabilidad | — | Sin tests todavía |
| 6. Bloqueo por el profesional | Día, franja o varios días; cancela afectados y avisa | — | Sin tests todavía |
| 7. Cambio de sesiones por mes sin huecos | Desde una fecha; no toca el pasado; detecta choques | — | Sin tests todavía |
| 8. Honorarios individuales | Cambio afecta solo futuros no cancelados desde la fecha | — | Sin tests todavía |
