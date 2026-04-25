// ═══════════════════════════════════════════════════
// everwith — Autenticación
// ═══════════════════════════════════════════════════

const SUPABASE_URL = 'https://yiegzkovbqtnkylmttup.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWd6a292YnF0bmt5bG10dHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTA3NjYsImV4cCI6MjA5MjU2Njc2Nn0.WA1Uf6QafqJISwqmoYPaJZQLpGqYOCg0-1nByIax6D4';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

window.sb = _sb;
window.authState = { user: null, profile: null };

// ─── Mostrar/ocultar pantallas ───
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('hidden', !s.id.endsWith(name));
  });
}

// ─── Cargar o crear perfil ───
async function loadOrCreateProfile(userId, email) {
  let { data: profile } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
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

  // ─── Auto-reparar vínculo roto ───
  // Si mi partner_id es null pero alguien en la DB me tiene como su pareja,
  // significa que el vínculo quedó a medias. Lo reparamos automáticamente.
  if (!profile.partner_id) {
    const { data: partner } = await sb
      .from('profiles')
      .select('*')
      .eq('partner_id', userId)
      .single();

    if (partner) {
      // Alguien nos tiene vinculados — restaurar nuestro lado
      await sb
        .from('profiles')
        .update({ partner_id: partner.id })
        .eq('id', userId);

      profile.partner_id = partner.id;
      console.log('Vínculo auto-reparado con:', partner.display_name);
    }
  }

  return profile;
}

// ─── Escuchar si alguien nos vincula mientras esperamos ───
function listenForPartnerLink(userId) {
  const linkChannel = sb.channel(`link:${userId}`, {
    config: { broadcast: { self: false } },
  })
    .on('broadcast', { event: 'linked' }, async (payload) => {
      const partnerId = payload.payload?.partner_id;
      if (partnerId && !window.authState.profile?.partner_id) {
        window.authState.profile.partner_id = partnerId;
        sb.removeChannel(linkChannel);
        await window.appCore?.startMain?.();
        showScreen('main');
      }
    })
    .subscribe();
}

// ─── Callback cuando el usuario está autenticado ───
async function onAuthenticated(user) {
  window.authState.user = user;

  const profile = await loadOrCreateProfile(user.id, user.email);
  if (!profile) { showScreen('login'); return; }

  window.authState.profile = profile;
  document.getElementById('my-pair-code').textContent = profile.pair_code;

  if (profile.partner_id) {
    await window.appCore?.startMain?.();
    showScreen('main');
  } else {
    showScreen('waiting');
    listenForPartnerLink(user.id);
  }
}

// ─── Inicializar: detectar sesión persistida ───
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    await onAuthenticated(session.user);
    return;
  }
  showScreen('login');
}

// ─── LOGIN ───
document.getElementById('btn-login').addEventListener('click', async () => {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) { errEl.textContent = 'completa todos los campos'; return; }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = error.message; return; }

  await onAuthenticated(data.user);
});

// ─── REGISTRO ───
document.getElementById('btn-register').addEventListener('click', async () => {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) { errEl.textContent = 'completa todos los campos'; return; }

  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) { errEl.textContent = error.message; return; }

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
  const errEl     = document.getElementById('link-error');
  errEl.textContent = '';

  if (!inputCode) return;

  const myProfile = window.authState.profile;

  if (inputCode === myProfile.pair_code) {
    errEl.textContent = window.i18n.t('linkSelf');
    return;
  }

  const { data: partnerProfile } = await sb
    .from('profiles')
    .select('*')
    .eq('pair_code', inputCode)
    .single();

  if (!partnerProfile) {
    errEl.textContent = window.i18n.t('linkError');
    return;
  }

  // 1. Vincular ambos en la DB
  await sb.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', myProfile.id);
  await sb.from('profiles').update({ partner_id: myProfile.id }).eq('id', partnerProfile.id);

  // 2. Notificar a la otra persona via broadcast con reintentos
  const notifyChannel = sb.channel(`link:${partnerProfile.id}`, {
    config: { broadcast: { self: false } },
  });

  let attempts = 0;
  await new Promise((resolve) => {
    notifyChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const sendOnce = async () => {
          attempts++;
          await notifyChannel.send({
            type: 'broadcast',
            event: 'linked',
            payload: { partner_id: myProfile.id },
          });
          if (attempts < 5) setTimeout(sendOnce, 600);
          else resolve();
        };
        sendOnce();
      }
    });
  });

  setTimeout(() => sb.removeChannel(notifyChannel), 4000);

  // 3. Pasar a pantalla principal
  window.authState.profile.partner_id = partnerProfile.id;
  await window.appCore?.startMain?.();
  showScreen('main');
});

// ─── Escuchar caducidad de sesión ───
sb.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') showScreen('login');
});

// Arrancar
initAuth();
