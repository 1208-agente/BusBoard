# Manual de Usuario - BusBoard

## 1. Que es BusBoard

BusBoard es un sistema para mostrar horarios de buses en una terminal y tambien permitir que las personas consulten la misma informacion desde internet, usando computadora, tablet o smartphone.

El sistema tiene tres partes principales:

- Pantalla publica de la estacion.
- Panel administrativo.
- Publicidad por estacion.

La pantalla publica muestra salidas, llegadas y anuncios. El panel administrativo permite cargar estaciones, itinerarios, anuncios y cambios como retrasos o cancelaciones.

## 2. Conceptos basicos

### Estacion

Es una terminal o ciudad desde donde salen o a donde llegan buses. Por ejemplo:

- Marcala
- La Paz
- Tegucigalpa
- Comayagua

La estacion seleccionada define que viajes aparecen como salidas o llegadas.

### Itinerario

Un itinerario es un viaje unico entre dos estaciones. No se debe ingresar dos veces.

Ejemplo:

- Origen: Marcala
- Destino: La Paz
- Hora de salida: 1:00 PM
- Hora de llegada: 3:00 PM

En la pantalla de Marcala se vera como salida a la 1:00 PM.

En la pantalla de La Paz se vera como llegada a las 3:00 PM.

### Publicidad

Los anuncios pueden ser:

- Videos de YouTube.
- Imagenes.
- Enlaces publicitarios.

Cada anuncio puede asignarse a una estacion especifica o a todas las estaciones.

## 3. Acceso al sistema

### Pantalla publica

La pantalla publica se abre desde:

index.html

Cuando el sistema este publicado en internet, la direccion sera parecida a:

https://tu-sitio.pages.dev/index.html

### Panel administrativo

El panel administrativo se abre desde:

admin.html

Cuando el sistema este publicado en internet, la direccion sera parecida a:

https://tu-sitio.pages.dev/admin.html

Para ingresar se usa el correo y la clave del usuario creado en Supabase.

## 4. Uso de la pantalla publica

La pantalla publica muestra:

- Nombre de la estacion activa.
- Hora actual.
- Proxima salida y proxima llegada.
- Tabla de salidas o llegadas.
- Espacio publicitario.

La pantalla alterna automaticamente entre salidas y llegadas.

Tambien se puede tocar o hacer clic sobre la tabla para cambiar manualmente entre salidas y llegadas.

En celulares se muestran botones:

- Todo
- Salidas
- Llegadas

## 5. Seleccion de estacion

En la pantalla publica hay un selector de estacion.

Al cambiar la estacion:

- Las salidas cambian segun los viajes cuyo origen sea esa estacion.
- Las llegadas cambian segun los viajes cuyo destino sea esa estacion.
- Los anuncios cambian segun la estacion seleccionada.

## 6. Administrar estaciones

En el panel administrativo existe la seccion Estaciones.

Desde ahi se puede:

- Crear una nueva estacion.
- Editar el nombre de una estacion.
- Activar o desactivar una estacion.
- Borrar una estacion.

Es importante usar el catalogo de estaciones para evitar errores de escritura.

Ejemplo incorrecto:

- Marcala
- marcala
- Marcala con espacio al final

Ejemplo correcto:

- Usar siempre la estacion desde el catalogo.

## 7. Administrar itinerarios

Los itinerarios se registran desde la seccion Itinerario normal.

Campos principales:

- Dia.
- Estacion de origen.
- Empresa.
- Hora de salida.
- Hora de llegada.
- Estacion de destino.
- Ruta.
- Estado.
- Demora en minutos.
- Inicio de temporada.
- Fin de temporada.

No se debe indicar si el viaje es salida o llegada. El sistema lo deduce automaticamente.

### Estados disponibles

- A tiempo.
- Abordando.
- Llegando.
- Demorado.
- Cancelado.

### Demora

La demora afecta la hora de salida. Por ejemplo, si un bus sale a las 8:00 AM y se marca demora de 15 minutos, se mostrara como demorado.

## 8. Carga de itinerarios por archivo CSV

El sistema permite importar itinerarios por archivo CSV.

Formato:

day,company,departure_time,arrival_time,origin,destination,route,status,delay,start_date,end_date

Ejemplo:

monday,Transportes Marcala,13:00,15:00,Marcala,La Paz,ML-01,on_time,0,,

### Significado de columnas

- day: dia de semana en ingles.
- company: empresa.
- departure_time: hora de salida.
- arrival_time: hora de llegada.
- origin: estacion de origen.
- destination: estacion de destino.
- route: codigo o nombre de ruta.
- status: estado.
- delay: demora en minutos.
- start_date: inicio de temporada.
- end_date: fin de temporada.

### Dias validos

- monday
- tuesday
- wednesday
- thursday
- friday
- saturday
- sunday

### Estados validos

- on_time
- boarding
- arriving
- delayed
- cancelled

## 9. Temporadas

Las temporadas permiten cargar horarios especiales por fechas.

Si start_date y end_date estan vacios, el itinerario aplica siempre.

Si tienen fecha, el itinerario solo aplica dentro de ese rango.

Ejemplo:

2026-12-01 a 2026-12-31

Esto sirve para vacaciones, feriados o temporadas especiales.

## 10. Administrar publicidad

En el panel administrativo existe la seccion Publicidad.

Campos principales:

- Estacion.
- Tipo.
- Titulo.
- Texto.
- URL de video o imagen.
- Enlace del anunciante.
- Orden.
- Activo.

### Estacion del anuncio

Se selecciona desde una lista desplegable.

Opciones:

- Una estacion especifica.
- Todas las estaciones.

Si un anuncio se asigna a Marcala, solo se muestra al seleccionar Marcala.

Si se asigna a Todas las estaciones, se muestra en cualquier estacion.

### Tipos de anuncio

YouTube:

Se usa para videos de YouTube. No se almacena el video en el servidor.

Imagen:

Se usa para una imagen publicada en internet.

Enlace:

Se usa para un anuncio de texto con enlace.

## 11. Carga de anuncios por archivo CSV

Formato:

station,type,title,text,media_url,target_url,display_order,active

Ejemplo:

Marcala,youtube,Video Marcala,Promocion local,https://www.youtube.com/watch?v=VIDEO,https://anunciante.com,10,true

### Significado de columnas

- station: estacion del anuncio o all.
- type: youtube, image o link.
- title: titulo.
- text: texto corto.
- media_url: enlace del video o imagen.
- target_url: pagina del anunciante.
- display_order: orden de rotacion.
- active: true o false.

## 12. Reproduccion de anuncios

Los anuncios se mezclan automaticamente.

La rotacion considera:

- Anuncios de la estacion seleccionada.
- Anuncios marcados para todas las estaciones.

Los videos de YouTube avanzan al siguiente anuncio cuando terminan.

Si un video no termina o queda bloqueado, el sistema pasa al siguiente anuncio despues de un tiempo maximo.

Si el navegador bloquea el audio automatico, aparece un boton para activar audio.

## 13. Uso en la estacion

Para usar BusBoard en una pantalla de estacion:

1. Abrir la pagina publica.
2. Seleccionar la estacion correcta.
3. Presionar F11 para pantalla completa.
4. Verificar que se muestren salidas, llegadas y anuncios.
5. Si se usara audio, presionar Activar audio cuando aparezca.

## 14. Uso desde celular o tablet

La misma pagina funciona en celulares y tablets.

El usuario puede:

- Seleccionar estacion.
- Ver salidas.
- Ver llegadas.
- Ver anuncios.

La visualizacion se adapta automaticamente al tamano del dispositivo.

## 15. Actualizar la informacion

Para actualizar datos:

1. Entrar al panel administrativo.
2. Iniciar sesion.
3. Agregar o editar estaciones.
4. Agregar o cargar itinerarios.
5. Agregar o cargar anuncios.
6. Revisar la pantalla publica.

Los cambios se guardan en Supabase cuando el sistema esta conectado a internet.

## 16. Recomendaciones

- Registrar cada viaje una sola vez.
- Usar nombres de estaciones desde el catalogo.
- No escribir estaciones manualmente en anuncios.
- Revisar que los enlaces de YouTube funcionen.
- Usar anuncios generales con estacion all para que siempre haya algo que mostrar.
- Probar la pantalla antes de dejarla activa en la terminal.

## 17. Problemas comunes

### No puedo iniciar sesion

Revisar:

- Que el usuario exista en Supabase.
- Que el proveedor Email este habilitado.
- Que se este usando correo completo.
- Que la clave sea correcta.

### No aparece una estacion

Revisar:

- Que este creada en Estaciones.
- Que este activa.
- Que los itinerarios usen exactamente esa estacion.

### No aparecen anuncios

Revisar:

- Que el anuncio este activo.
- Que la estacion sea correcta.
- Que el tipo sea correcto.
- Que la URL del video o imagen funcione.

### YouTube no reproduce con audio

Algunos navegadores bloquean audio automatico.

Presionar Activar audio una vez en la pantalla.

### No se ven cambios en la web

Recargar con Ctrl + F5.

Si se actualizo codigo:

- Subir cambios a GitHub.
- Esperar el despliegue de Cloudflare Pages.

## 18. Resumen rapido

- Estaciones: catalogo de terminales.
- Itinerarios: viajes unicos entre origen y destino.
- Pantalla: deduce salidas y llegadas segun estacion.
- Publicidad: se filtra por estacion y rota automaticamente.
- Admin: permite gestionar todo.
- Supabase: guarda los datos en internet.
- Cloudflare Pages: publica la pagina web.
