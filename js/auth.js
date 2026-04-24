// ═══════════════════════════════════════════════════
// everwith — Autenticación
// Supabase Auth + persistencia de sesión (sin F5 logout)
// ═══════════════════════════════════════════════════

// ── CONFIGURACIÓN SUPABASE ──
// Reemplaza estos valores con los de tu proyecto Supabase
const SUPABASE_URL = 'https://yiegzkovbqtnkylmttup.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWd6a292YnF0bmt5bG10dHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTA3NjYsImV4cCI6MjA5MjU2Njc2Nn0.WA1Uf6QafqJISwqmoYPaJZQLpGqYOCg0-1nByIax6D4';

// Inicializar cliente Supabase
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // La sesión se persiste en localStorage automáticamente
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Exportar cliente para otros módulos
window.sb = _sb;

// Estado de autenticación global
window.authState = {
  user: null,
  profile: null, // { id, pair_code, partner_id, avatar_url, display_name }
};

// ─── Mostrar/ocultar pantallas ───
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('hidden', !s.id.endsWith(name));
  });
}

// ─── Cargar o crear perfil del usuario ───
async function loadOrCreateProfile(userId, email) {
  // Intentar cargar perfil existente
  let { data: profile, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    // Generar código de emparejamiento único (6 chars alfanumérico)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: newProfile, error: createErr } = await sb
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        pair_code: code,
        partner_id: null,
        avatar_url: null,
        display_name: email.split('@')[0],
        ok_at: null,
      })
      .select()
      .single();

    if (createErr) { console.error('Error creando perfil:', createErr); return null; }
    profile = newProfile;
  }

  return profile;
}

// ─── Inicializar auth: detectar sesión existente ───
async function initAuth() {
  // Obtener sesión persistida (no se pierde con F5)
  const { data: { session } } = await sb.auth.getSession();

  if (session?.user) {
    await onAuthenticated(session.user);
    return;
  }

  // Sin sesión → mostrar login
  showScreen('login');
}

// ─── Callback cuando el usuario está autenticado ───
async function onAuthenticated(user) {
  window.authState.user = user;

  // Cargar perfil
  const profile = await loadOrCreateProfile(user.id, user.email);
  if (!profile) { showScreen('login'); return; }

  window.authState.profile = profile;

  // Mostrar código en pantalla de espera
  document.getElementById('my-pair-code').textContent = profile.pair_code;

  // Si ya tiene pareja vinculada → pantalla principal
  if (profile.partner_id) {
    await window.appCore?.startMain?.();
    showScreen('main');
  } else {
    showScreen('waiting');
  }
}

// ─── LOGIN ───
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'completa todos los campos';
    return;
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    errEl.textContent = error.message;
    return;
  }

  await onAuthenticated(data.user);
});

// ─── REGISTRO ───
document.getElementById('btn-register').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'completa todos los campos';
    return;
  }

  const { data, error } = await sb.auth.signUp({ email, password });

  if (error) {
    errEl.textContent = error.message;
    return;
  }

  if (data.user) {
    await onAuthenticated(data.user);
  } else {
    errEl.textContent = 'revisa tu email para confirmar tu cuenta';
  }
});

// ─── LOGOUT ───
async function doLogout() {
  await sb.auth.signOut();
  window.authState.user = null;
  window.authState.profile = null;
  window.realtimeModule?.cleanup?.();
  showScreen('login');
}

document.getElementById('btn-logout').addEventListener('click', doLogout);
document.getElementById('btn-logout-wait').addEventListener('click', doLogout);

// ─── COPIAR CÓDIGO ───
document.getElementById('btn-copy-code').addEventListener('click', () => {
  const code = document.getElementById('my-pair-code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('btn-copy-code');
    btn.style.color = 'var(--accent)';
    setTimeout(() => { btn.style.color = ''; }, 1500);
  });
});

// ─── VINCULAR CON PAREJA ───
document.getElementById('btn-link').addEventListener('click', async () => {
  const inputCode = document.getElementById('partner-code-input').value.trim().toUpperCase();
  const errEl = document.getElementById('link-error');
  errEl.textContent = '';

  if (!inputCode) return;

  const myProfile = window.authState.profile;

  // Comprobar que no sea el propio código
  if (inputCode === myProfile.pair_code) {
    errEl.textContent = window.i18n.t('linkSelf');
    return;
  }

  // Buscar perfil con ese código
  const { data: partnerProfile, error } = await sb
    .from('profiles')
    .select('*')
    .eq('pair_code', inputCode)
    .single();

  if (error || !partnerProfile) {
    errEl.textContent = window.i18n.t('linkError');
    return;
  }

  // Vincular ambas partes
  await sb.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', myProfile.id);
  await sb.from('profiles').update({ partner_id: myProfile.id }).eq('id', partnerProfile.id);

  // Actualizar estado local
  window.authState.profile.partner_id = partnerProfile.id;

  // Ir a pantalla principal
  await window.appCore?.startMain?.();
  showScreen('main');
});

// ─── Escuchar cambios de auth (ej: caducidad de token) ───
sb.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    showScreen('login');
  }
});

// Iniciar
initAuth();
