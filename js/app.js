// ═══════════════════════════════════════════════════
// everwith — App principal
// ═══════════════════════════════════════════════════

async function startMain() {
  var myProfile  = window.authState.profile;
  var myUserId   = window.authState.user.id;
  var partnerId  = myProfile.partner_id;

  // Cargar perfil de la pareja
  var partnerProfile = null;
  if (partnerId) {
    var res = await sb.from('profiles').select('*').eq('id', partnerId).single();
    partnerProfile = res.data;
    window.authState.partnerProfile = partnerProfile;
  }

  // Renderizar avatares
  window.avatarModule && window.avatarModule.renderMyAvatar(myProfile);
  window.avatarModule && window.avatarModule.renderPartnerAvatar(partnerProfile);

  // Estado inicial de la pareja
  window.realtimeModule && window.realtimeModule.renderPartnerStatus(partnerProfile && partnerProfile.ok_at);

  // Tooltip toque efímero
  var partnerWrap = document.getElementById('partner-avatar-wrap');
  if (partnerWrap) partnerWrap.title = window.i18n.t('ephemeralHint');

  // Inicializar Realtime
  if (partnerId) {
    window.realtimeModule && window.realtimeModule.initRealtime(myUserId, partnerId);
  }

  // Mostrar avatar de esquina con transición suave
  setTimeout(function() {
    var corner = document.getElementById('my-avatar-corner');
    if (corner) corner.classList.add('visible');
  }, 400);
}

// Botón "Estoy bien"
document.getElementById('btn-ok').addEventListener('click', function() {
  window.realtimeModule && window.realtimeModule.sendOkStatus();
});

// Actualizar status pill al cambiar idioma
var _origApplyLang = window.i18n.applyLang.bind(window.i18n);
window.i18n.applyLang = function(lang) {
  _origApplyLang(lang);
  var mainScreen = document.getElementById('screen-main');
  if (mainScreen && !mainScreen.classList.contains('hidden')) {
    var okAt = window.authState && window.authState.partnerProfile && window.authState.partnerProfile.ok_at;
    window.realtimeModule && window.realtimeModule.renderPartnerStatus(okAt);
    var partnerWrap = document.getElementById('partner-avatar-wrap');
    if (partnerWrap) partnerWrap.title = window.i18n.t('ephemeralHint');
  }
};

window.appCore = { startMain: startMain };

window.i18n.initI18n();
