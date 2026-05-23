# BusBoard Web + Supabase

## 1. Crear proyecto en Supabase

1. Entra a Supabase y crea un proyecto.
2. Abre `SQL Editor`.
3. Ejecuta el contenido de `supabase-schema.sql`.
4. En `Authentication`, crea un usuario administrador con correo y clave.

## 2. Configurar la app

1. Copia `supabase-config.example.js` como `supabase-config.js`.
2. Cambia:

```js
window.BusBoardSupabaseConfig = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-KEY"
};
```

Los valores estan en Supabase: `Project Settings` > `API`.

## 3. Probar local

Abre `index.html` para la pantalla publica y `admin.html` para administracion.

Si `supabase-config.js` no existe, la app usa datos locales de prueba.
Si existe y tiene credenciales validas, usa Supabase.

## 4. Publicar en Cloudflare Pages

1. Sube estos archivos a un repositorio GitHub.
2. En Cloudflare Pages crea un proyecto desde ese repositorio.
3. Framework: `None`.
4. Build command: vacio.
5. Output directory: `/`.

## 5. URLs sugeridas

- `/index.html`: consulta publica y pantalla de estacion.
- `/admin.html`: administracion.

Cuando pasemos a una app con rutas limpias, podremos usar:
- `/`
- `/screen/marcala`
- `/admin`

## Publicidad

Los anuncios se administran desde `admin.html`.

Campos:
- `Estacion`: nombre de estacion o `all` para todas.
- `Tipo`: `youtube`, `tiktok`, `image` o `link`.
- `URL video/imagen`: enlace de YouTube, Shorts, TikTok o URL publica de imagen.
- `Enlace anunciante`: pagina que abre el anuncio al tocar/clic.
- `Orden`: prioridad de rotacion.
- `Activo`: permite pausar anuncios.

La pantalla mezcla automaticamente videos de YouTube, Shorts, TikTok, imagenes y enlaces, filtrados por la estacion activa.

## Imagenes y videos locales

1. Coloca imagenes, GIF o videos locales en `media`.
2. Ejecuta `generar-ads.ps1`.
3. El script limpia y regenera `pantalla`, que es la carpeta que usa la web.
4. Sube a GitHub `pantalla/lista.js` y los archivos dentro de `pantalla`.

Extensiones soportadas: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.mp4`, `.mov`, `.webm`.

## Migraciones

Si el proyecto Supabase ya existia antes de TikTok, ejecuta `supabase-migration-tiktok.sql` una vez en el SQL Editor.
