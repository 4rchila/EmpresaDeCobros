# Guion para Canva — Manual de usuario de la aplicación móvil

Documento para diseñar el manual en Canva. Describe qué va en cada diapositiva, qué captura usar, qué texto escribir y cómo presentarlo. El contenido sale de las capturas reales de la app (carpeta `/home/Gerlo/Descargas/appMobile/`) y del código del commit `3595f00`.

---

## 1. Especificaciones generales

| Elemento | Indicación |
|---|---|
| Formato | Presentación 16:9 para pantalla, o un PDF vertical A4 si el manual se imprime. Recomendado: 16:9. |
| Idioma | Español. Tono formal, claro y cercano; tutear al usuario ("tu voto", "pulsa"). |
| Tipografía | Títulos: Montserrat Bold o similar (la app usa un estilo geométrico). Texto: Montserrat Regular o Inter. Tamaños: título 40–48 pt, subtítulo 20–24 pt, cuerpo 16–18 pt, notas 12–14 pt. |
| Paleta (medida de las capturas) | Azul marino muy oscuro #080323 (cabeceras). Lavanda claro #F5F3FE (fondo de contenido). Violeta oscuro #11035A (botones principales). Blanco #FFFFFF (tarjetas). Dorado (etiqueta "MESA DE COMPETITIVIDAD") y azul claro (subtítulos de cabecera), usa tonos similares a los de la app. |
| Estilo de capturas | Mostrar el teléfono (marco simple, sin sombras exageradas) a la derecha o centrado, con el texto a la izquierda. |
| Colores de aviso | Banner de demostración: fondo lavanda #E6E1FA con texto #11035A. Úsalo siempre que una captura sea de ejemplo. |

Reglas de diseño:
- Una idea por diapositiva. Máximo 4 viñetas por diapositiva.
- Cada captura debe tener un rótulo arriba ("Paso 1", "Pantalla: Inicio") para que el lector la ubique.
- Las palabras que el usuario ve en la app van entre comillas y con la misma escritura (por ejemplo, «Ver votaciones»).
- No insertes capturas con datos personales reales. Las capturas actuales usan la cuenta ficticia `miembro.demo@ejemplo.invalid`.

Leyenda de iconos recomendada (usa iconos simples de Canva):
- 🔒 Dato protegido o solo en servidor.
- ⚠️ Aviso importante o limitación.
- 🧪 Contenido de demostración.
- ✅ Funciona conectado al servidor.
- ➜ Paso siguiente.

---

## 2. Estructura del manual (13 diapositivas)

| N.º | Título | Captura |
|---|---|---|
| 1 | Portada | Ninguna (logo/texto) |
| 2 | Cómo usar esta guía | Ninguna |
| 3 | Acceso: iniciar sesión | Iniciar sesión |
| 4 | Inicio | Inicio |
| 5 | Reuniones | Reuniones |
| 6 | Votar: votaciones pendientes | Votar (sin pendientes) |
| 7 | Votar: cómo emitir tu voto | Capturas pendientes (ver sección 4) |
| 8 | Voto registrado y reglas del voto | Capturas pendientes |
| 9 | Avisos | Avisos |
| 10 | Documentos e iniciativas | Documentos, Iniciativas, Documento |
| 11 | Perfil y cierre de sesión | Perfil |
| 12 | Qué funciona y qué falta | Ninguna (tabla) |
| 13 | Contacto y buenas prácticas | Ninguna |

---

## 3. Contenido diapositiva por diapositiva

### Diapositiva 1 — Portada
- Fondo azul marino #080323.
- Texto superior pequeño y dorado: MESA DE COMPETITIVIDAD.
- Título grande (blanco): Aplicación móvil para miembros.
- Subtítulo (azul claro): Manual de usuario · Versión de demostración.
- Pie pequeño: Fecha de corte: 12 de octubre de 2026.
- Opcional: un teléfono con la captura de Inicio a la derecha.

### Diapositiva 2 — Cómo usar esta guía
Texto:
- Cada pantalla aparece con su captura y una explicación corta.
- 🧪 Las pantallas con el banner "Vista de demostración" muestran datos de ejemplo, no información real de la Mesa.
- ✅ Las pantallas conectadas al servidor se identifican en la diapositiva 12.
- ⚠️ Si algo no coincide con tu teléfono, avisa a la coordinación técnica.

### Diapositiva 3 — Acceso: iniciar sesión
Captura: "Iniciar sesión" (pantalla con fondo oscuro, campos de correo y contraseña).

Pasos (en una columna a la izquierda, con numeración):
1. Escribe el correo que te asignó la Mesa.
2. Escribe tu contraseña.
3. Pulsa «Iniciar sesión».

Notas:
- El botón se activa solo cuando ambos campos tienen texto.
- Si los datos no son correctos, aparece un mensaje de error debajo del formulario.
- ✅ El inicio de sesión se verifica con el servidor del proyecto.
- 🔒 La contraseña nunca se muestra en pantalla.

Texto de ayuda en la captura: "Usa la cuenta de miembro que te asignó la Mesa."

### Diapositiva 4 — Inicio
Captura: "Inicio" (cabecera oscura con "Hola, Miembro Demo", tarjeta de próxima reunión, botones "Ver votaciones", "Consultar iniciativas", "Consultar documentos" y barra inferior).

Explicación por zonas (usa flechas o números sobre la captura):
1. Saludo: muestra tu nombre de la sesión.
2. Tarjeta "Próxima reunión · ejemplo": 🧪 dato de demostración.
3. Tarjeta "Votación pendiente": aparece solo si hay una votación abierta sin tu voto. ✅
4. Botones: «Ver votaciones» (votaciones), «Consultar iniciativas» y «Consultar documentos» (demostración).
5. Barra inferior: acceso a las cinco secciones.

### Diapositiva 5 — Reuniones
Captura: "Reuniones" (dos tarjetas, banner de demostración).

Texto:
- Cada tarjeta muestra fecha, hora, modalidad y lugar.
- Pulsa una reunión para abrir su detalle con la agenda.
- 🧪 Las reuniones son de ejemplo; no son sesiones reales de la Mesa.
- Botón «Volver a reuniones» en el detalle.

### Diapositiva 6 — Votar: votaciones pendientes
Captura: "Votar" (sección "Pendientes" sin elementos y "Todas las votaciones").

Texto:
- Aquí aparecen las votaciones abiertas en las que aún no tienes voto registrado.
- Si no hay ninguna, la pantalla lo explica: "No hay votaciones pendientes".
- ✅ Esta sección se conecta al servidor.
- Mensaje de la pantalla que el usuario verá: "Cuando tengas una votación abierta sin voto registrado, aparecerá aquí."

### Diapositiva 7 — Votar: cómo emitir tu voto (pasos)
Captura: pendiente (ver sección 4). Mientras tanto, deja un marco con el texto "Captura pendiente".

Pasos numerados, con flecha entre cada uno:
1. Pulsa la votación pendiente.
2. Lee la propuesta, el resumen y la fecha de cierre que indica el servidor.
3. Pulsa «Elegir mi voto» y selecciona una opción.
4. Pulsa «Revisar elección» para ver tu selección.
5. Pulsa «Enviar voto» y, en el diálogo «¿Confirmar tu voto?», pulsa «Confirmar y enviar».

Recuadro de atención (⚠️): "Cancelar en el diálogo no envía nada. Revisa tu elección antes de confirmar."

### Diapositiva 8 — Voto registrado y reglas
Captura: pendiente (pantalla "Voto registrado" o "Voto ya registrado").

Dos columnas:

Izquierda: qué muestra la app
- "Voto registrado": el servidor confirmó tu voto.
- "Voto ya registrado": tu cuenta ya tenía un voto en esa votación; la app no indica la opción ni la fecha.
- Botón «Volver al inicio».

Derecha: reglas
- 🔒 Un voto por miembro. No se puede cambiar ni cancelar desde la app.
- 🔒 Mientras la votación esté abierta, no se muestran resultados.
- ⚠️ Si la conexión falla al enviar, la app no reenvía el voto sola. Muestra un estado incierto; puedes reintentar a mano sin duplicarlo.
- ⚠️ Este aviso no es un comprobante oficial.

Pie: "Las votaciones cerradas muestran el botón «Ver resultados» con los conteos que publica el servidor."

### Diapositiva 9 — Avisos
Captura: "Avisos" (banner de demostración; tarjetas "REUNIÓN" y "PROPUESTA").

Texto:
- Novedades para miembros: nueva sesión programada y propuestas disponibles.
- Pulsa un aviso para ver su detalle.
- 🧪 Los avisos son de demostración.
- ⚠️ Esta versión no envía notificaciones al teléfono.

### Diapositiva 10 — Documentos e iniciativas
Capturas: "Documentos", "Iniciativas", "Documento". Muestra las tres en un collage.

Texto:
- Documentos: actas e informes de referencia.
- Iniciativas: fichas de ejemplo para explorar la consulta.
- Detalle de documento: muestra la vista previa; el archivo PDF aún no está disponible desde el servidor.
- 🧪 Toda la información de estas pantallas es de ejemplo.
- Botón «Volver al inicio» o «Volver a documentos» en cada detalle.

### Diapositiva 11 — Perfil y cierre de sesión
Captura: "Perfil".

Texto:
- Muestra el nombre y el correo de la sesión iniciada.
- Accesos a «Consultar documentos» y «Cerrar sesión».
- Al cerrar sesión, la app borra la sesión guardada en el teléfono.
- ⚠️ La tarjeta "Revisar estados de la interfaz" es una herramienta de demostración para el equipo de desarrollo. No forma parte del uso normal y no se explica al usuario final.

### Diapositiva 12 — Qué funciona y qué falta
Diseño: tabla de tres columnas.

| Conectado al servidor ✅ | Demostración 🧪 | Pendiente ⚠️ |
|---|---|---|
| Inicio y cierre de sesión | Reuniones | Notificaciones push |
| Votaciones pendientes y detalle | Iniciativas | Historial de participación |
| Envío del voto con confirmación | Avisos | Documentos oficiales (PDF) |
| Resultados al cerrar la votación | Documentos | Servidor compartido y despliegue |

Pie: "Estado a la fecha de corte. Las pruebas se hicieron en un entorno local de desarrollo con una cuenta de prueba."

### Diapositiva 13 — Contacto y buenas prácticas
- Dudas o fallos: coordinación técnica del proyecto. Indica la pantalla, el mensaje y la hora.
- 🔒 No compartas contraseñas, tokens ni capturas con datos personales.
- 🔒 Cierra sesión si usas un teléfono compartido.
- Recomendación: revisa las capturas antes de publicarlas.

---

## 4. Capturas pendientes

Faltan capturas del flujo de voto. Pide al equipo que las tome en el teléfono y las guarde en `appMobile/`:

1. Inicio con la tarjeta "Votación pendiente" (requiere una votación abierta en el servidor).
2. Detalle de la votación con el botón «Elegir mi voto».
3. Pantalla con una opción elegida y el botón «Revisar elección».
4. Diálogo "¿Confirmar tu voto?" con «Confirmar y enviar».
5. Pantalla "Voto registrado" o "Voto ya registrado".

Sin estas capturas, la diapositiva 7 y 8 quedan sin imagen. Ojo: para tomar estas capturas hace falta una votación abierta en el servidor, y en la base de prueba actual no hay ninguna. Enviar un voto real de prueba requiere aprobación específica.

---

## 5. Lista de control antes de publicar

- [ ] Las capturas no muestran correos reales, contraseñas ni tokens.
- [ ] Cada captura de demostración lleva el banner "Vista de demostración".
- [ ] La tarjeta de "Revisar estados de la interfaz" no aparece en la explicación de uso normal.
- [ ] El texto no afirma notificaciones push, comprobante oficial ni envío real de votos sin verificación.
- [ ] La diapositiva 12 coincide con el estado real del código.
- [ ] Se incluyen las capturas faltantes del flujo de voto, o la diapositiva lo indica como pendiente.
- [ ] Fecha de corte y versión visibles en la portada.

---

## 6. Notas para el diseñador

- Usa plantillas de Canva con formato 16:9 y aplica la paleta de la sección 1.
- Para el marco del teléfono, usa un marco simple y recorta las capturas con la misma proporción (aprox. 582×1281 px, relación 9:20).
- Mantén las mismas posiciones: texto a la izquierda, captura a la derecha, rótulo de pantalla arriba.
- Para exportar: PDF de alta calidad para lectura y, si hace falta, PNG por diapositiva.
