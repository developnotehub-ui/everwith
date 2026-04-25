// ═══════════════════════════════════════════════════
// everwith — Realtime
// Estado + toque efímero con ondas de pantalla completa
// ═══════════════════════════════════════════════════

var realtimeChannel = null;
var statusUpdateInterval = null;

// ─── Texto de estado según ok_at ───
function formatPartnerStatus(okAt) {
  if (!okAt) return window.i18n.t('noSignal');
  var diff = Date.now() - new Date(okAt).getTime();
  if (diff < 8  * 3600000) return window.i18n.t('isOkay');
  if (diff < 24 * 3600000) return window.i18n.t('disconnecting');
  return window.i18n.t('noSignal');
}

// ─── Actualizar texto en la UI ───
function renderPartnerStatus(okAt) {
  var el = document.getElementById('partner-status');
  if (el) el.textContent = formatPartnerStatus(okAt);
}

// ─── Animación de ondas en el avatar (pequeña, sobre el avatar) ───
function triggerAvatarRipple() {
  var wrap = document.getElementById('partner-avatar-wrap');
  if (!wrap) return;
  wrap.classList.remove('rippling');
  void wrap.offsetWidth;
  wrap.classList.add('rippling');
  setTimeout(function() { wrap.classList.remove('rippling'); }, 2500);
}

// ─── Animación de ondas a pantalla completa (quien recibe el toque) ───
function triggerFullScreenRipple() {
  var overlay = document.getElementById('touch-ripple-overlay');
  if (!overlay) return;

  // Reset
  overlay.classList.remove('hidden', 'playing');
  void overlay.offsetWidth;

  overlay.classList.add('playing');

  // Ocultar tras la animación (la más larga es tw4 = 1.2s delay + 2.4s = 3.6s)
  setTimeout(function() {
    overlay.classList.remove('playing');
    overlay.classList.add('hidden');
  }, 4000);
}

// ─── Inicializar canal Realtime ───
function initRealtime(myUserId, partnerId) {
  cleanup();

  var ids = [myUserId, partnerId].sort();
  var channelName = 'pair:' + ids[0] + ':' + ids[1];

  realtimeChannel = sb.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  // Toque efímero — quien lo recibe ve las ondas a pantalla completa
  realtimeChannel.on('broadcast', { event: 'ephemeral_touch' }, function() {
    triggerFullScreenRipple();
  });

  // Cambios de estado de la pareja en DB
  realtimeChannel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: 'id=eq.' + partnerId,
    },
    function(payload) {
      var newOkAt   = payload.new && payload.new.ok_at;
      var newAvatar = payload.new && payload.new.avatar_url;

      if (window.authState.partnerProfile) {
        window.authState.partnerProfile.ok_at = newOkAt;
      }

      renderPartnerStatus(newOkAt);

      if (newAvatar && window.avatarModule) {
        window.avatarModule.renderPartnerAvatar(payload.new);
      }
    }
  );

  realtimeChannel.subscribe();

  // Re-renderizar texto relativo cada minuto
  statusUpdateInterval = setInterval(function() {
    var okAt = window.authState && window.authState.partnerProfile && window.authState.partnerProfile.ok_at;
    renderPartnerStatus(okAt);
  }, 60000);
}

// ─── Enviar toque efímero (broadcast, sin persistencia) ───
async function sendEphemeralTouch() {
  if (!realtimeChannel) {
    console.warn('Sin canal realtime');
    return;
  }
  await realtimeChannel.send({
    type: 'broadcast',
    event: 'ephemeral_touch',
    payload: {},
  });
}

// ─── Enviar "estoy bien" ───
async function sendOkStatus() {
  var userId = window.authState && window.authState.user && window.authState.user.id;
  if (!userId) return;

  var result = await sb
    .from('profiles')
    .update({ ok_at: new Date().toISOString() })
    .eq('id', userId);

  if (!result.error) {
    var btn = document.getElementById('btn-ok');
    if (btn) {
      btn.classList.add('pulse');
      setTimeout(function() { btn.classList.remove('pulse'); }, 700);
    }
    var hint = document.getElementById('my-sent-status');
    if (hint) {
      hint.classList.remove('hidden');
      setTimeout(function() { hint.classList.add('hidden'); }, 3000);
    }
  }
}

// ─── Limpiar ───
function cleanup() {
  if (realtimeChannel) { sb.removeChannel(realtimeChannel); realtimeChannel = null; }
  if (statusUpdateInterval) { clearInterval(statusUpdateInterval); statusUpdateInterval = null; }
}

window.realtimeModule = {
  initRealtime:        initRealtime,
  sendEphemeralTouch:  sendEphemeralTouch,
  sendOkStatus:        sendOkStatus,
  renderPartnerStatus: renderPartnerStatus,
  formatPartnerStatus: formatPartnerStatus,
  cleanup:             cleanup,
};
