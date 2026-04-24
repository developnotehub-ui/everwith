// ═══════════════════════════════════════════════════
// everwith — App principal
// Orquesta todos los módulos
// ═══════════════════════════════════════════════════

let bgInitialized = false;

// ─── Iniciar pantalla principal ───
async function startMain() {
  const myProfile     = window.authState.profile;
  const myUserId      = window.authState.user.id;
  const partnerId     = myProfile.partner_id;

  // Cargar perfil de la pareja
  let partnerProfile = null;
  if (partnerId) {
    const { data } = await sb
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single();
    partnerProfile = data;
    window.authState.partnerProfile = partnerProfile;
  }

  // ─── Renderizar avatares ───
  window.avatarModule?.renderMyAvatar(myProfile);
  window.avatarModule?.renderPartnerAvatar(partnerProfile);

  // ─── Mostrar estado inicial de la pareja ───
  window.realtimeModule?.renderPartnerStatus(partnerProfile?.ok_at);

  // ─── Tooltip en avatar pareja ───
  const partnerWrap = document.getElementById('partner-avatar-wrap');
  if (partnerWrap) {
    partnerWrap.title = window.i18n.t('ephemeralHint');
  }

  // ─── Inicializar Realtime ───
  if (partnerId) {
    window.realtimeModule?.initRealtime(myUserId, partnerId);
  }

  // ─── Fondo de partículas (sólo una vez) ───
  if (!bgInitialized) {
    initBackground();
    bgInitialized = true;
  }
}

// ─── Botón "Estoy bien" ───
document.getElementById('btn-ok').addEventListener('click', () => {
  window.realtimeModule?.sendOkStatus();
});

// ─── El idioma puede cambiar → actualizar estado de pareja si está en pantalla ───
// Observar cambios de idioma para actualizar el texto del status
const _origApplyLang = window.i18n.applyLang.bind(window.i18n);
window.i18n.applyLang = function(lang) {
  _origApplyLang(lang);
  // Si estamos en pantalla principal, re-renderizar estado
  if (!document.getElementById('screen-main').classList.contains('hidden')) {
    const partnerOkAt = window.authState?.partnerProfile?.ok_at;
    window.realtimeModule?.renderPartnerStatus(partnerOkAt);
    // Actualizar tooltip
    const partnerWrap = document.getElementById('partner-avatar-wrap');
    if (partnerWrap) partnerWrap.title = window.i18n.t('ephemeralHint');
  }
};

// ─── Exponer para que auth.js lo llame ───
window.appCore = { startMain };

// ─── Inicializar i18n ───
window.i18n.initI18n();
