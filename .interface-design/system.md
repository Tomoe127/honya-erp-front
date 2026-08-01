# Honya ERP — sistema de diseño

## Dirección y sensación

Mundo visual: **librería** — pergamino, tinta, lomos de libro en tapa dura
(oxblood). No es un SaaS corporativo genérico; debe sentirse como la trastienda
bien cuidada de una librería independiente: cálido, legible, sin ruido.
Usuarios reales: vendedor en el mostrador, almacenero haciendo inventario,
admin revisando el día al cierre — todos necesitan claridad rápida, no
espectáculo visual.

## Paleta (tokens en `src/styles.css`, bloque `@theme`)

- `--color-parchment` `#f6f1e7` — lienzo base (fondo de página y sidebar)
- `--color-parchment-deep` `#efe7d8` — superficie secundaria (poco uso)
- `--color-paper` `#fbf8f1` — tarjetas/paneles ("ficha de catálogo")
- `--color-ink` `#1b2430` — texto primario
- `--color-ink-soft` `#55606e` — texto secundario
- `--color-ink-muted` `#8d8779` — texto terciario/metadata
- `--color-brand` `#7a2e2e` (oxblood) — único acento, acciones primarias
- `--color-brand-dark` `#5e2222` — hover/pressed
- `--color-brand-soft` `#f1e4e1` — fondos de badges/avatares de marca
- `--color-success` / `--color-success-soft` — verde bosque, estado activo
- `--color-warning` / `--color-warning-soft` — ámbar, alertas (bajo stock, futuro)
- `--color-danger` / `--color-danger-soft` — rojo claro, errores/inactivo
- `--color-line` `rgba(27,36,48,.08)` / `--color-line-strong` `rgba(27,36,48,.16)`

Un solo acento de color (oxblood) para acciones — los demás colores son
semánticos (éxito/advertencia/error), nunca decorativos.

## Tipografía

- `--font-serif` "Source Serif 4" — wordmark "Honya", H1 de cada página
- `--font-sans` "Inter" — todo lo demás (nav, tablas, formularios, botones)
- Iconos: Material Symbols Outlined (no el set "Material Icons" por defecto)

## Profundidad — estrategia elegida: bordes, no sombras

- Bordes de 1px con `--color-line` (8% opacidad) para separar secciones.
- Única excepción: la tarjeta de login usa una sombra suave de 3 capas
  (momento de "llegada", justifica el único énfasis con sombra de toda la app).
- Sidebar: mismo fondo que el lienzo (`bg-parchment`), separado solo por
  `border-r border-line` — nunca un bloque de color distinto.

## Firma visual: el "lomo" (`.spine` en styles.css)

Acento de 3px `border-left: var(--color-brand)` que evoca un lomo de libro
visto de canto. Aparece en:
1. Item de navegación activo en el sidebar (con fondo `bg-brand-soft`)
2. Tarjeta de login (borde izquierdo + sombra)
3–6. Panel de crear/editar en Categorías/Editoriales/Autores/Libros — **solo
   cuando está en modo edición** (el acento tiene significado: "estás editando
   este registro", no es decoración).

## Patrones de componente

- **Página de catálogo**: H1 serif + subtítulo `text-ink-muted`, luego
  `<app-catalog-tabs>`, luego panel de formulario (`rounded-lg border
  border-line bg-paper p-5`), luego tabla envuelta en el mismo estilo de panel.
- **Campo de texto** (global, `src/styles.css`): reemplaza `mat-form-field`
  por `<label class="field-label">` + `<input class="field">` nativos.
  Label: uppercase, 12px/500, `text-ink-soft`, estático arriba (no floating
  label). Input: `border border-line-strong`, fondo `--color-parchment-deep`
  (más oscuro que la tarjeta `paper` que lo contiene — "inset"), `rounded-lg`
  8px, focus = borde `--color-brand` + anillo `box-shadow 0 0 0 3px
  var(--color-brand-soft)`. Usado en login, categorías, editoriales, autores
  y los campos simples de libros (isbn/título/descripción/precio).
- **Select** (`categoryId`/`publisherId`/`status`/`authorIds` en Libros):
  sigue siendo `mat-select` dentro de `mat-form-field appearance="outline"`
  (un select propio requeriría reconstruir teclado/ARIA/posicionamiento desde
  cero — no vale la pena). Se le agrega la clase `.field-select` (también en
  `styles.css`) que sobreescribe los tokens M3 de Material
  (`--mdc-outlined-text-field-*`) para que la caja combine con `.field`:
  mismo radio, mismo fondo inset, mismo foco de marca. El label va afuera
  (`<label class="field-label">`), sin `<mat-label>` interno flotante.
- **Botón primario**: `mat-flat-button` con `style="background-color:
  var(--color-brand); color: white;"` (Material aún no expone tokens de color
  de marca custom sin theme-builder completo, así que se fuerza inline).
- **Acciones de tabla**: enlaces de texto `text-sm font-medium text-brand
  hover:underline`, no botones con relleno — mantiene las tablas ligeras.
- **Badge de estado**: `rounded-full text-xs font-medium px-2.5 py-1` con
  `bg-success-soft text-success` (activo) o `bg-danger-soft text-danger`
  (inactivo).
- **Avatar de usuario**: círculo `bg-brand-soft text-brand` con iniciales.
- **Números**: clase `.tabular` (`font-variant-numeric: tabular-nums`) en
  precios/ISBN para evitar layout shift.

## Densidad y espaciado

- Base 4px. Paneles con padding 20px (`p-5`). Filas de formulario `gap-3`.
- Material: `density: -1` en `custom-theme.scss` (ligeramente más compacto
  que el default, coherente con una herramienta operativa diaria).

## Tema de Angular Material

`custom-theme.scss`: `primary: mat.$red-palette` (familia tonal más cercana
al oxblood), `tertiary: mat.$green-palette`, `typography: Inter`,
`density: -1`. El fondo real de la app NO usa `--mat-sys-surface` — usa
`--color-parchment` directamente (Material solo controla sus propios
componentes internos: inputs, selects, tabs).

## Modal (`MatDialog`) — formularios de crear/editar

Los formularios de crear/editar que antes eran un panel inline (empujando la
tabla hacia abajo) ahora son un `MatDialog`: `book-form-dialog`,
`movement-form-dialog`, `purchase-form-dialog`, `supplier-form-dialog`,
`sale-form-dialog`, `customer-form-dialog` (uno por feature, mismo patrón).

- **Por qué modal, no panel inline**: la tabla nunca debe moverse al abrir un
  formulario — es el mismo dato, solo cambia el modo de edición.
- **Profundidad**: única segunda excepción a "bordes, no sombras" (la
  primera es la tarjeta de login) — un modal es el mismo tipo de "momento de
  llegada" (una ficha se levanta sobre el lienzo), así que reusa esa misma
  sombra de 3 capas en vez de inventar una tercera estrategia.
- **Clases**: `panelClass: 'app-dialog'` + `backdropClass:
  'app-dialog-backdrop'` (definidas en `styles.css`). Radio `14px` (mayor
  que el `8px` de paneles inline, para diferenciar "modal" de "panel").
  Backdrop tintado en tinta (`rgba(27,36,48,.35)`), no negro puro.
- **Contenido interno**: mismos `.field`/`.field-select`/`.field-label` de
  siempre — el modal es un contenedor nuevo, no un lenguaje visual nuevo.
  Título en `font-serif text-lg font-semibold text-ink` (eco del H1 de
  página, a menor escala).
- **Datos**: el padre pasa las listas ya cargadas (categorías, libros,
  proveedores…) como `data` del diálogo en vez de que el diálogo las vuelva
  a pedir — evita llamadas HTTP duplicadas cada vez que se abre.
- **Cierre**: `dialogRef.close(response.data ?? undefined)` — el padre solo
  recarga la lista si `afterClosed()` trae un resultado truthy (se guardó
  algo), no en cancelar.

## Bug conocido y arreglado: sentinel de "Todos"/"Sin X" en `mat-select`

Angular Material `mat-select` **limpia la selección visualmente en cuanto el
`FormControl` vale `null`**, aunque exista una `<mat-option [value]="null">`
que debería coincidir — muestra el placeholder vacío en vez del texto de esa
opción, y no marca ningún check en el panel abierto. Pasa con cualquier
opción "Todos"/"Todas"/"Sin editorial"/"Cliente genérico" que use `null`
como valor.

**Fix**: nunca usar `null` como valor de una `mat-option`. Usar un sentinel
real (`0` para IDs numéricos ya que empiezan en 1, `''` para enums de
texto) y convertir ese sentinel a `undefined`/`null` solo al armar el
payload de la petición HTTP (`filters.categoryId || undefined`,
`value.customerId || null`, etc.). Ya aplicado en Libros (categoría/estado),
Inventario (libro/tipo en filtro de movimientos) y Ventas (cliente
genérico). Si aparece un nuevo combobox opcional en otra fase, aplicar el
mismo patrón desde el inicio.

## Visibilidad por rol: ocultar, no deshabilitar

Los botones de crear/editar/cancelar/activar-desactivar se ocultan por
completo (`@if (authStore.hasAnyRole('ADMIN', 'X'))`) para los roles sin
permiso, en vez de mostrarse deshabilitados. Un vendedor no tiene ninguna
razón para saber que existe un "Editar libro" que nunca va a poder usar —
deshabilitar solo agrega ruido; ya es el patrón que usa la app para
condiciones de estado (ej. "Cancelar" en Ventas solo aparece si `status ===
'COMPLETED'`), así que el chequeo de rol es la misma idea aplicada a permisos
en vez de estado. `AuthStore.hasAnyRole(...roles)` refleja exactamente los
`@PreAuthorize` del backend: catálogo/inventario → ADMIN+ALMACENERO;
compras/proveedores → ADMIN+COMPRADOR; ventas/clientes → ADMIN+VENDEDOR. Los
GET nunca se restringen (todos los roles ven todo, solo cambia quién
escribe). Al agregar un módulo nuevo, replicar este `@if` en cada botón de
escritura desde el inicio, no como parche después.

## Pendiente / no cubierto todavía

- Dashboard real: ✅ hecho (Fase 6) — KPI tiles con datos reales.
- Módulo de Usuarios: ✅ hecho — única ruta protegida con `roleGuard`
  (`data: { roles: ['ADMIN'] }`) en vez de solo ocultar botones, porque
  `GET /api/users` también es ADMIN-only en el backend (no solo la
  escritura, como el resto de módulos).
- Sin modo oscuro explícito (la app fija `color-scheme: light`).
