# Cambios de diseno aplicados

Fecha de referencia: 2026-06-09

Commit subido a GitHub: `bbb8276` - `Ajusta estilos de secciones principales`

## Hero principal

Archivo: `index.html`

- Se separo el titulo principal en dos lineas:
  - `Tu cuerpo lleva anos hablandote.`
  - `Es hora de que alguien realmente te escuche.`
- Se agrego un `span` dentro del `h1` para controlar el salto de linea desde CSS.
- El video inicial mantiene autoplay con `mute=1` para que arranque de forma confiable.
- Se agrego un boton-icono transparente sobre el video para activar sonido.
- El boton cambia el iframe a `mute=0` despues del clic y envia comandos `setVolume`, `unMute` y `playVideo`.

Archivo: `styles.css`

- El fondo del card/hero principal cambio a `#762325`.
- El titulo principal quedo en blanco.
- El texto de especialidades dentro del hero quedo en blanco con opacidad.
- El nombre `Dra. Karla Andrade` quedo en blanco con opacidad.
- El boton `Conocer a la doctora` quedo blanco con texto `#762325`.
- El color `#762325` se aplico solo al hero, no como variable global del sitio.

## Especialidades

Archivo: `index.html`

- Se elimino el texto lateral:
  - `Consulta ginecologica, obstetrica y hormonal con un enfoque claro, cercano y personalizado.`

Archivo: `styles.css`

- Se elimino la regla `.specialty-copy` porque el texto ya no existe.
- La seccion `specialties` se coloco dentro de un card tipo `section-band`.
- El fondo final de Especialidades cambio a `#762325`, el mismo color del hero inicial.
- Todo el texto de Especialidades quedo en blanco para mantener contraste.

## Sobre mi

Archivo: `styles.css`

- La seccion `about` recibio fondo rosado `#df8f9f`.
- La seccion `about` se coloco dentro de un card tipo `section-band`, con bordes redondeados y margen lateral como el hero principal.
- El titulo `Medicina cercana, conocimiento y confianza.` quedo con peso `900`.
- Se agrego `padding-top: 48px` al texto derecho para alinearlo visualmente con el titulo.
- En responsive movil se reseteo ese desplazamiento con `padding-top: 0`.

## Agendar cita

Archivo: `styles.css`

- La seccion `booking` recibio fondo rosado suave `#f2dde8`.
- El titulo `Selecciona el dia y la hora que mejor se adapte a ti.` quedo con peso `900`.
- El interlineado del titulo se ajusto a `line-height: 0.94`.
- El eyebrow `Agendar cita` quedo:
  - color `#762325`
  - fuente base `var(--serif)`
  - tamano `13px`
  - peso `500`
  - sin letter spacing
- El formulario quedo con:
  - borde `1px solid rgba(116, 29, 48, 0.1)`
  - radio `8px`
  - fondo blanco

## Boton flotante

Archivo: `index.html`

- Se elimino el boton flotante inferior:
  - `Agendar cita`

Archivo: `styles.css`

- Se eliminaron las reglas:
  - `.floating-cta`
  - `.floating-cta:hover`
  - version movil de `.floating-cta`

Nota: el boton `Agendar cita` del header se mantiene activo.

## Archivos modificados

- `index.html`
- `styles.css`

## Espaciado entre cards

Archivo: `styles.css`

- Se agrego `margin-block` a `.section-band` para separar visualmente los cards/secciones.
- En movil el espaciado vertical de `.section-band` queda en `12px`.

## Pendiente para futuras iteraciones

- Revisar visualmente cada seccion en desktop y movil.
- Ajustar tonos rosados si el fondo de `Sobre mi` o `Agendar cita` se siente demasiado fuerte.
- Revisar si el titulo del hero necesita menor tamano en pantallas pequenas.
- Definir si se mantendra `Satoshi` como reemplazo local de Neue Montreal.
