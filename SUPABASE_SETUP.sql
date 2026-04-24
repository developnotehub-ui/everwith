-- ═══════════════════════════════════════════════════
-- everwith — Configuración completa de Supabase
-- ═══════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- PASO 1: Crear proyecto en Supabase
-- ─────────────────────────────────────────────
-- 1. Ve a https://supabase.com y crea una cuenta
-- 2. Haz clic en "New Project"
-- 3. Elige nombre: everwith
-- 4. Elige una contraseña fuerte para la base de datos
-- 5. Selecciona la región más cercana a tus usuarios
-- 6. Haz clic en "Create new project" (tarda ~2 min)

-- ─────────────────────────────────────────────
-- PASO 2: Configurar Auth
-- ─────────────────────────────────────────────
-- En el panel de Supabase:
-- Authentication → Settings
-- ✅ Enable email confirmations: DESACTIVAR (para simplificar)
--    (o déjalo activado si quieres verificación de email)
-- ✅ Site URL: http://localhost (desarrollo) o tu dominio

-- ─────────────────────────────────────────────
-- PASO 3: Crear tabla profiles
-- ─────────────────────────────────────────────
-- Ve a: SQL Editor → New Query → pega y ejecuta:

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  pair_code   text unique not null,
  partner_id  uuid references public.profiles(id),
  avatar_url  text,       -- base64 dataURL (para MVP; en producción usa Storage)
  ok_at       timestamptz, -- último "estoy bien"
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- PASO 4: Row Level Security (RLS)
-- ─────────────────────────────────────────────
-- Activar RLS en la tabla
alter table public.profiles enable row level security;

-- Política: cada usuario puede leer su propio perfil y el de su pareja
create policy "Leer perfil propio y pareja"
  on public.profiles for select
  using (
    auth.uid() = id
    or
    auth.uid() = partner_id
    or
    id in (
      select partner_id from public.profiles where id = auth.uid()
    )
  );

-- Política: cada usuario sólo puede modificar su propio perfil
create policy "Modificar perfil propio"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Política: insertar sólo el propio perfil
create policy "Insertar perfil propio"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Política especial: permitir búsqueda por pair_code (para vincular pareja)
-- Los perfiles son buscables por pair_code cuando el usuario está autenticado
create policy "Buscar por pair_code"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Nota: si tienes conflicto entre políticas, elimina la de arriba y deja
-- solo la más permisiva para usuarios autenticados. Para producción,
-- refina las políticas según tus necesidades de privacidad.

-- ─────────────────────────────────────────────
-- PASO 5: Activar Realtime
-- ─────────────────────────────────────────────
-- Opción A (recomendada): desde el panel
-- Database → Replication → Tablas → activar "profiles"
-- Asegúrate de que Publication incluye UPDATE events

-- Opción B: por SQL
alter publication supabase_realtime add table public.profiles;

-- ─────────────────────────────────────────────
-- PASO 6: Obtener credenciales
-- ─────────────────────────────────────────────
-- Settings → API
-- Copia:
--   Project URL → SUPABASE_URL
--   anon public  → SUPABASE_KEY
-- Pégalos en js/auth.js:
--   const SUPABASE_URL = 'https://xxxx.supabase.co';
--   const SUPABASE_KEY = 'eyJ...';

-- ─────────────────────────────────────────────
-- PASO 7 (Opcional): Supabase Storage para avatares
-- ─────────────────────────────────────────────
-- Para producción, en lugar de guardar base64 en la DB:
-- Storage → New Bucket → "avatars" → Public bucket
-- Añade política de Storage:
--   Allowed operations: SELECT (public), INSERT, UPDATE (authenticated owner)
-- En js/avatar.js, reemplaza la lógica de guardado con:
--
-- const filePath = `${userId}/avatar.jpg`;
-- const { data } = await sb.storage
--   .from('avatars')
--   .upload(filePath, blob, { upsert: true });
-- const { data: { publicUrl } } = sb.storage
--   .from('avatars')
--   .getPublicUrl(filePath);
-- await sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);

-- ─────────────────────────────────────────────
-- ÍNDICES útiles
-- ─────────────────────────────────────────────
create index if not exists profiles_pair_code_idx on public.profiles(pair_code);
create index if not exists profiles_partner_id_idx on public.profiles(partner_id);
