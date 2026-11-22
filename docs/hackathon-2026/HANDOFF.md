# HANDOFF — Paulet en el NASA Space Apps Challenge 2026 (versión corta)

> **Lee solo esto primero.** El detalle completo (unas 580 líneas) está en `HANDOFF_COMPLETO.md`. No lo leas entero:
> abre solo la sección que necesites (tabla de abajo; `grep -n "^## " HANDOFF_COMPLETO.md` da las líneas).
> Al terminar una tarea, actualiza **este** archivo (estado y pendientes) y haz commit. Explicaciones al dueño en español.

Última actualización: 2026-11-22.

## Estado
- La hackathon terminó. Se entregó **Paulet: Andes to Orbit** (reto *Space Mission Design Game*, equipo Paulet Delta-V).
  Se esperan resultados: nominados globales 3 dic 2026, finalistas 17 dic 2026, ganadores 26 ene 2027.
- **Mientras se esperan resultados no se toca el repo del concurso ni su Vercel**, salvo pedido explícito del dueño.
- "Paulet: A 130-Year Promise" es la versión que sigue después de la hackathon, en el repo del juego principal.

## Dónde está cada cosa
| Qué | Dónde |
|---|---|
| Juego del concurso (público, solo el juego) | `artesanalinteligencia1-dotcom/paulet-spaceapps-2026`, carpeta `game/`; clon `C:\Paulet\paulet-spaceapps-2026` |
| Juego en línea y demo | https://paulet-spaceapps-2026.vercel.app y https://paulet-spaceapps-2026.vercel.app/deck/ |
| Juego principal (versión siguiente) | `artesanalinteligencia1-dotcom/PP.game`, rama `cloud/fase-1`; clon `C:\Paulet\PP.game`; su entrada es `HANDOFF.md` en la raíz |
| Esta bitácora | `PP.game/docs/hackathon-2026/` (índice en `README.md`) |
| Texto entregado (nombre, resumen, uso de IA) | `docs/SUBMISSION.md` |
| Medios locales (intro, tráiler, música, voces) | `C:\Paulet\{intro-a, trailer, trailer-final, trailer-test, soundtrack, media_raw, tools}` |
| Copia de todo `C:\Paulet` | Google Drive, `Mi unidad\MI\Paulet` (hecha el 2026-11-22) |
| Respaldo del historial viejo del repo del concurso | `C:\Paulet\respaldo-paulet-spaceapps-historial-2026-11-16.bundle` (también en la copia de Drive, por decisión del dueño) |
| Memoria de Claude Code (solo en esta PC) | `C:\Users\roone\.claude\projects\C--Paulet\memory\` |

## Pendiente
1. **Dueño:** pedir a GitHub Support que purgue la caché de commits viejos del repo del concurso (enlaces directos por
   identificador y referencias del PR #1). El historial ya se reescribió el 2026-11-16.
2. **Dueño:** probar una sala en línea con 2–3 dispositivos reales.
3. **Dueño:** descargar el certificado de participación cuando esté disponible.
4. Después de los resultados: pasar lo útil del concurso (multijugador en línea, modo móvil, películas) al juego principal.

## Qué sección de `HANDOFF_COMPLETO.md` leer
| Si necesitas… | Sección |
|---|---|
| Reglas de la entrega y cómo juzgan | §3 y §4 |
| Qué pedía el reto frente a la primera versión | §5 |
| Recursos de NASA y cómo se usan | §6 |
| Por qué se decidió algo | §8 Decisiones |
| Qué se hizo, con fecha y commit | §9 Hecho |
| Pedidos del dueño y estudio de animación | §10 (subsecciones) |
| Dónde estaba cada cosa durante la hackathon, Firebase | §12 |
