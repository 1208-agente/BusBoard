# Guia paso a paso: publicar BusBoard en internet

Esta guia asume que nunca has usado Supabase ni Cloudflare Pages.

## Que hace cada pieza

- **BusBoard**: los archivos de la pagina (`index.html`, `admin.html`, CSS y JS).
- **Supabase**: guarda datos en internet: rutas, horarios, anuncios y usuarios admin.
- **Cloudflare Pages**: publica la pagina para que cualquiera pueda abrirla desde una URL.
- **YouTube**: aloja videos publicitarios. BusBoard solo guarda el enlace.

## Parte 1: preparar Supabase

1. Entra a `https://supabase.com`.
2. Crea cuenta o inicia sesion.
3. Crea un proyecto nuevo.
4. Elige una region cercana.
5. Espera a que el proyecto termine de crearse.

## Parte 2: crear tablas

1. Dentro de tu proyecto Supabase, abre **SQL Editor**.
2. Crea un query nuevo.
3. Copia todo el contenido de `supabase-schema.sql`.
4. Pegalo en Supabase.
5. Presiona **Run**.

Esto crea:

- `trips`: rutas y horarios.
- `ads`: publicidad por estacion.
- politicas RLS para que el publico pueda leer, pero solo usuarios autenticados puedan administrar.

## Parte 3: crear usuario administrador

1. En Supabase, abre **Authentication**.
2. Entra a **Users**.
3. Crea un usuario.
4. Usa un correo real o de prueba.
5. Define una clave.

Ese correo y clave son los que usaras en `admin.html`.

## Parte 4: obtener credenciales publicas

1. En Supabase, abre **Project Settings**.
2. Abre **API Keys** o **API**.
3. Copia:
   - Project URL
   - anon key o publishable key

No uses la `service_role key` en la web.

## Parte 5: configurar BusBoard

1. Abre `D:\BusBoard\supabase-config.js`.
2. Pon tus datos:

```js
window.BusBoardSupabaseConfig = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-KEY"
};
```

3. Guarda el archivo.

## Parte 6: probar localmente

1. Abre `D:\BusBoard\index.html`.
2. Debe mostrar la pantalla publica.
3. Abre `D:\BusBoard\admin.html`.
4. Inicia sesion con el correo y clave creados en Supabase.
5. Carga rutas o anuncios.
6. Recarga `index.html` y revisa que se vean.

## Parte 7: cargar datos de prueba

Para anuncios:

1. En admin, ve a **Publicidad**.
2. Carga `D:\BusBoard\anuncios-prueba.csv`.

Para rutas:

1. En admin, ve a **Carga por lote**.
2. Descarga la plantilla o prepara un CSV con:

```csv
day,company,departure_time,arrival_time,origin,destination,route,status,delay,start_date,end_date
monday,Transportes Marcala,07:00,07:50,Marcala,La Paz,ML-01,on_time,0,,
```

## Parte 8: publicar en Cloudflare Pages

Opcion sencilla: GitHub + Cloudflare.

1. Crea una cuenta en `https://github.com`.
2. Crea un repositorio, por ejemplo `busboard`.
3. Sube todos los archivos de `D:\BusBoard`.
4. Entra a `https://dash.cloudflare.com`.
5. Abre **Workers & Pages**.
6. Crea una nueva app de **Pages**.
7. Conecta tu cuenta de GitHub.
8. Elige el repositorio `busboard`.
9. Configuracion:
   - Framework preset: `None`
   - Build command: vacio
   - Output directory: `/`
10. Publica.

Cloudflare te dara una URL parecida a:

```txt
https://busboard.pages.dev
```

Con esa URL puedes abrir:

```txt
https://busboard.pages.dev/index.html
https://busboard.pages.dev/admin.html
```

## Parte 9: como se usa en estaciones

En la pantalla de la estacion:

1. Abre la URL publica.
2. Selecciona la estacion, por ejemplo `Marcala`.
3. Deja la pantalla en modo completo con F11.

En celulares/tablets:

1. Abre la misma URL.
2. El usuario selecciona su estacion.
3. La pagina se adapta automaticamente.

## Seguridad basica

- La `anonKey` se puede usar en frontend.
- Nunca publiques la `service_role key`.
- Las politicas RLS del archivo SQL son las que protegen escritura.
- Publico puede leer rutas y anuncios activos.
- Solo usuarios autenticados pueden crear/editar/borrar.
