# Admin Panel - Next.js

Panel de administración para gestión de autos, migrado de HTML a Next.js con App Router, TypeScript y Tailwind CSS.

## Características

- ✅ Autenticación con Supabase (email/password)
- ✅ CRUD completo de autos
- ✅ Subida de imágenes y videos con compresión automática
- ✅ Gestión de archivos (agregar/eliminar)
- ✅ Estados: Oferta, Vendido, Reservado
- ✅ Interfaz idéntica al HTML original
- ✅ Sin registro público (usuarios creados manualmente en Supabase)

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

Puedes usar `.env.local.example` como referencia.

### 3. Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Build de producción

```bash
npm run build
npm start
```

## Deployment en Netlify

### Configuración

1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno en Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

Netlify detectará automáticamente que es un proyecto Next.js y configurará el build apropiadamente.

## Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx          # Página principal del admin
│   │   ├── layout.tsx             # Layout raíz con AuthProvider
│   │   ├── globals.css            # Estilos globales (migrados del HTML)
│   │   └── page.tsx               # Redirect a /admin
│   ├── components/
│   │   ├── AuthProvider.tsx       # Context de autenticación
│   │   ├── LoginForm.tsx          # Formulario de login
│   │   ├── AdminTabs.tsx          # Tabs del panel
│   │   ├── AutoForm.tsx           # Formulario para agregar auto
│   │   ├── AutosList.tsx          # Lista de autos
│   │   └── EditAutoModal.tsx      # Modal de edición
│   ├── lib/
│   │   ├── supabaseClient.ts      # Cliente de Supabase
│   │   ├── imageCompression.ts    # Utilidades de compresión
│   │   └── storageHelpers.ts      # Helpers de storage
│   └── types/
│       └── auto.ts                # Tipos TypeScript
├── public/                        # Archivos estáticos
├── .env.local.example             # Template de variables de entorno
├── netlify.toml                   # Configuración de Netlify
└── package.json
```

## Uso

### Login

Solo usuarios creados manualmente en Supabase Auth pueden acceder al panel. No hay registro público.

### Agregar Auto

1. Ir a la pestaña "Agregar Auto"
2. Llenar el formulario
3. Subir imágenes/videos (las imágenes se comprimen automáticamente)
4. Click en "Subir auto"

### Gestionar Autos

1. Ir a la pestaña "Gestionar Autos"
2. Ver lista de todos los autos
3. Editar: modificar datos, agregar/eliminar archivos, marcar como oferta/vendido/reservado
4. Eliminar: elimina el auto y todos sus archivos del storage

### Badges

- **OFERTA**: Auto en oferta con precio reducido
- **VENDIDO**: Auto vendido
- **RESERVADO**: Auto reservado

## Supabase

### Tabla: Autos

Campos:
- `id` (int, primary key)
- `marca` (text)
- `modelo` (text)
- `año` (int)
- `precio` (numeric)
- `descripcion` (text, nullable)
- `imagenes` (text[], array de URLs)
- `en_oferta` (boolean)
- `precio_oferta` (numeric, nullable)
- `vendido` (boolean)
- `reservado` (boolean)

### Storage Bucket: autos-fotos

Almacena todas las imágenes y videos de los autos.

### Policies

- **anon**: SELECT (para web pública)
- **authenticated**: ALL (para staff logueado)

## Tecnologías

- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database + Storage)
- React 19+

## Notas

- Las imágenes se comprimen automáticamente al 70% de calidad
- Los videos NO se comprimen
- Al eliminar un auto, se eliminan todos sus archivos del storage
- La sesión persiste automáticamente
