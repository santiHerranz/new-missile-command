# Optimización de Intercepción y Puntería (Lead)

Este documento describe en detalle las mejoras realizadas al cálculo de intercepción y al ajuste de puntería (lead), cubriendo motivación, derivación matemática, estabilidad numérica, integración en el juego, validación y posibles extensiones.

## Objetivos

- Aumentar la fiabilidad del cálculo de intercepción para blancos móviles.
- Evitar inestabilidades numéricas (cancelación catastrófica, discriminantes negativos pequeños por error FP, casos casi lineales).
- Hacer que la torre apunte visualmente al punto de intercepción ajustado por radio de explosión (lead efectivo).
- Aplicar el mismo lead en disparos manuales cercanos a asteroides.
- Ofrecer un overlay de depuración para visualizar la solución de tiro.

## Resumen de cambios

- Solver cuadrático estable en `intercept(...)` para seleccionar la menor raíz positiva con robustez.
- Corregido el uso de la lista ordenada de asteroides (se iteraba por la no ordenada).
- Puntería de la torre orientada al punto de intercepción ajustado (`explosion lead`).
- Disparo manual con lead cuando el click está cerca de un asteroide.
- Overlay de depuración con marcadores de intercepción y trayectoria.
- Parámetro de configuración `EXPLOSION_LEAD_DISTANCE` centralizado en `PHYSICS_CONFIG`.

## Contexto físico y unidades

En cada frame usamos `dt` (tiempo del juego) y velocidades en “unidades-de-pantalla por dt”. Asteroides actualizan su posición con `(vx, vy) = (speed * dt * cos, speed * dt * sin)`. Por coherencia, el cálculo de intercepción usa para el misil una rapidez `v_p = MISSILE_SPEED * dt` y para el objetivo `(vx, vy)` tal como se actualiza en el juego.

Nota: Este enfoque trabaja en el espacio de “por frame”; alternativamente podría reescribirse todo a unidades por segundo, pero mientras objetivo y misil compartan el mismo sistema de unidades, la solución es consistente.

## Derivación del problema de intercepción

Dados:

- Origen del misil `s = (sx, sy)`
- Estado actual del blanco `p = (px, py)` con velocidad constante `v_t = (vx, vy)`
- Rapidez del misil `v_p` (escalar)

Buscamos un tiempo `t > 0` tal que la distancia entre la posición futura del blanco y el misil satisfece:

|| (p - s) + v_t t || = v_p t

Elevando al cuadrado y reorganizando:

(vx^2 + vy^2 - v_p^2) t^2 + 2((vx)(px - sx) + (vy)(py - sy)) t + ||p - s||^2 = 0

Definimos:

- `a = (vx^2 + vy^2) - v_p^2`
- `b = 2 (vx·tx + vy·ty)` donde `t = p - s = (tx, ty)`
- `c = tx^2 + ty^2`

Se resuelve el cuadrático y se elige la menor raíz positiva. El punto de intercepción es:

`p_intercept = p + v_t t*`

Si no hay `t > 0`, no existe solución (el misil no alcanza o geometría desfavorable).

## Estabilidad numérica

Para mejorar robustez:

- Caso casi lineal: si `|a| < EPS`, resolvemos `b t + c = 0` cuando `|b| >= EPS` o tratamos `c ≈ 0` como solución degenerada.
- Discriminante: si `disc = b^2 - 4ac` es negativo pequeño por error FP, lo truncamos a 0 cuando `-EPS < disc < 0`.
- Forma estable de raíces: en lugar de usar directamente `(-b ± sqrt(disc)) / (2a)`, calculamos `q = -0.5 (b + sign(b) sqrt(disc))` y luego `t0 = q/a`, `t1 = c/q`. Esta forma reduce la cancelación cuando `b` y `sqrt(disc)` tienen magnitudes similares.
- Orden y selección: garantizamos `t0 <= t1`, probamos primero `t0`, y si `t0 <= 0` probamos `t1`. Aceptamos únicamente `t > 0`.

Implementación en `src/utils/physics.js`:

- `intercept(src, dst, v)` — entrada en `src/utils/physics.js:25`
- `solveQuadraticStable(a, b, c)` — solver estable en `src/utils/physics.js:65`

## Integración en el juego

1) Auto-aim

- Se ordenan asteroides por distancia con `sortByDistance(...)` y ahora se itera sobre esa lista ordenada.
- Para cada objetivo, se calcula `pos = intercept(...)`. Si hay solución:
  - Se aplica una compensación hacia adelante `EXPLOSION_LEAD_DISTANCE` en la dirección del asteroide (para detonar cerca): `adjustedPos = pos + lead * dir_target`.
  - La torre apunta visualmente a `adjustedPos` para el primer objetivo de su lista.
- Rutas: `src/core/Game.js:466` (inicio de `handleAutoMode`), selección ordenada en `src/core/Game.js:481`, apuntado a intercepción en `src/core/Game.js:513`.

2) Disparo manual con lead

- Al hacer click, si hay un asteroide dentro de un umbral (40 px) del punto de click, se computa la intercepción y se dispara al `adjustedPos` igual que en auto.
- Si no, se dispara al punto clicado (comportamiento previo).
- Ruta: `src/core/Game.js:225` (lógica de `handleCanvasClick`).

3) Parámetro de lead y overlay

- `PHYSICS_CONFIG.EXPLOSION_LEAD_DISTANCE` (por defecto 80) en `src/constants/config.js:15` y se expone como `this.conf.EXPLOSION_LEAD_DISTANCE` en `Game` (`src/core/Game.js:61`).
- Overlay de depuración activable desde Settings (`debugIntercept`) dibuja:
  - Punto cian: intersección pura.
  - Punto amarillo: detonación (intersección + lead).
  - Línea gris: vector de tiro desde la torre al objetivo.
- Rutas de overlay: push de marcadores en auto y manual (`src/core/Game.js:284`, `src/core/Game.js:546`), y render en `draw()` (`src/core/Game.js:593`).
- Setting añadido en UI y almacenamiento: `src/ui/SettingsPanel.js:37`, `src/ui/SettingsPanel.js:86`, `src/ui/SettingsPanel.js:123`, `src/ui/SettingsPanel.js:147` y `src/utils/StorageManager.js:52`.

## Impacto en rendimiento y corrección

- Complejidad: el coste dominante en auto-aim sigue siendo la ordenación O(A log A) por torre para A asteroides visibles. El cálculo de intercepción es O(1) por pareja torre-asteroide.
- Corrección: al usar la raíz más pequeña positiva, el misil llega antes al punto de encuentro factible. El solver estable mitiga fallos en casos con `a ≈ 0` (misil y objetivo con velocidades cercanas) o discriminantes límites.
- Coherencia visual: la torre ahora apunta al punto de encuentro, alineando la “línea de puntería” con el verdadero objetivo del disparo, reduciendo aparentes fallos.

## Casos límite manejados

- Sin solución (misil más lento o geometría adversa): `intercept` devuelve `null` y se omite el disparo (auto) o se dispara al click sin lead (manual por distancia).
- Casi lineal (`|a| < EPS`): se recurre a la solución lineal, evitando divisiones numéricamente inestables.
- Discriminante ligeramente negativo por FP: se trunca a 0 para evitar NaN espurios.
- Click ambiguo: si no hay asteroide cercano al click, se preserva el comportamiento de “disparar al punto”.

## Validación rápida recomendada

1. Activar “Debug Intercept Overlay” en Settings.
2. Ejecutar en modo AUTO con varios asteroides rápidos y observar:
   - El círculo cian debe estar adelantado respecto a la posición actual del asteroide.
   - El circulo amarillo (con lead) debe quedar razonablemente cerca del borde de explosión cuando el misil llega.
3. Cambiar `PHYSICS_CONFIG.EXPLOSION_LEAD_DISTANCE` en `src/constants/config.js` y verificar sensibilidad.
4. Probar click manual sobre un asteroide: la torre debe reorientarse y trazar la línea hacia el punto de intersección.

## Posibles extensiones

- Ajuste dinámico del lead según velocidad del blanco o radio de explosión real.
- Deconflicción entre torres (asignación de objetivos para evitar duplicados y optimizar cobertura).
- Penalización por altura/sector para priorización de amenazas.
- Navegación proporcional (PN) para misiles con guía continua (si se desea “curvar” trayectorias), hoy son balísticos rectilíneos.
- Unificación de unidades a “por segundo” y normalización de `dt` para permitir variar la velocidad del loop sin afectar balística.

## Referencias de código

- `src/utils/physics.js:25` — `export function intercept(...)` con solver estable.
- `src/utils/physics.js:65` — `solveQuadraticStable(...)`.
- `src/core/Game.js:466` — Inicio de `handleAutoMode()`.
- `src/core/Game.js:481` — Uso de `sortedAsteroids[i]` (bugfix de selección).
- `src/core/Game.js:513` — Puntería de torre hacia la intercepción ajustada.
- `src/core/Game.js:225` — Lead en disparo manual cercano a asteroide.
- `src/core/Game.js:593` — Dibujo del overlay de depuración de intercepción.
- `src/constants/config.js:15` — `PHYSICS_CONFIG.EXPLOSION_LEAD_DISTANCE`.
- `src/ui/SettingsPanel.js:37` — Opción UI “Debug Intercept Overlay”.
- `src/utils/StorageManager.js:52` — Persistencia `debugIntercept`.

