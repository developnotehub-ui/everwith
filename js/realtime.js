// ═══════════════════════════════════════════════════
// everwith — Realtime
// Estado compartido + toque efímero sin persistencia
// ═══════════════════════════════════════════════════

var realtimeChannel = null;
var statusUpdateInterval = null;

// ─── Calcular texto de estado según ok_at ───
function formatPartnerStatus(okAt) {
  if (!okAt) return window.i18n.t('noSignal');

  var diff    = Date.now() - new Date(okAt).getTime();
  var hours8  = 8  * 3600000;
  var hours24 = 24 * 3600000;

  if (diff < hours8)  return window.i18n.t('isOkay');
  if (diff < hours24) return window.i18n.t('disconnecting');
  return window.i18n.t('noSignal');
}

// ─── Actualizar texto en la UI ───
function renderPartnerStatus(okAt) {
  var el = document.getElementById('partner-status');
  if (el) el.textContent = formatPartnerStatus(okAt);
}

// ─── Animación de toque efímero ───
function triggerEphemeralAnimation() {
  var wrap = document.getElementById('partner-avatar-wrap');
  if (!wrap) return;
  wrap.classList.remove('rippling');
  void wrap.offsetWidth; // forzar reflow para reiniciar CSS
  wrap.classList.add('rippling');
  setTimeout(function() { wrap.classList.remove('rippling'); }, 2500);
}

// ─── Inicializar canal Realtime ───
function initRealtime(myUserId, partnerId) {
  cleanup();

  var ids = [myUserId, partnerId].sort();
  var channelName = 'pair:' + ids[0] + ':' + ids[1];

  realtimeChannel = sb.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  // Escuchar toque efímero (broadcast, sin persistencia)
  realtimeChannel.on('broadcast', { event: 'ephemeral_touch' }, function() {
    triggerEphemeralAnimation();
  });

  // Escuchar cambios de estado de la pareja en DB
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

      renderPartnerStatus(newOkAt);

      // Actualizar ok_at en el estado local
      if (window.authState.partnerProfile) {
        window.authState.partnerProfile.ok_at = newOkAt;
      }

      // Actualizar avatar si cambió
      if (newAvatar && window.avatarModule) {
        window.avatarModule.renderPartnerAvatar(payload.new);
      }
    }
  );

  realtimeChannel.subscribe();

  // Re-renderizar el texto cada minuto (los textos relativos cambian con el tiempo)
  statusUpdateInterval = setInterval(function() {
    var okAt = window.authState && window.authState.partnerProfile && window.authState.partnerProfile.ok_at;
    renderPartnerStatus(okAt);
  }, 60000);
}

// ─── Enviar toque efímero (broadcast, sin guardar nada) ───
async function sendEphemeralTouch() {
  if (!realtimeChannel) {
    console.warn('Sin canal realtime para toque efímero');
    return;
  }
  await realtimeChannel.send({
    type: 'broadcast',
    event: 'ephemeral_touch',
    payload: {},
  });
}

// ─── Enviar "estoy bien" (persiste en DB) ───
async function sendOkStatus() {
  var userId = window.authState && window.authState.user && window.authState.user.id;
  if (!userId) return;

  var now = new Date().toISOString();

  var result = await sb
    .from('profiles')
    .update({ ok_at: now })
    .eq('id', userId);

  if (!result.error) {
    // Pulso en el botón
    var btn = document.getElementById('btn-ok');
    if (btn) {
      btn.classList.add('pulse');
      setTimeout(function() { btn.classList.remove('pulse'); }, 700);
    }
    // Hint de enviado
    var hint = document.getElementById('my-sent-status');
    if (hint) {
      hint.classList.remove('hidden');
      setTimeout(function() { hint.classList.add('hidden'); }, 3000);
    }
  }
}

// ─── Limpiar suscripciones ───
function cleanup() {
  if (realtimeChannel) {
    sb.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
}

window.realtimeModule = {
  initRealtime:          initRealtime,
  sendEphemeralTouch:    sendEphemeralTouch,
  sendOkStatus:          sendOkStatus,
  renderPartnerStatus:   renderPartnerStatus,
  formatPartnerStatus:   formatPartnerStatus, // exportado para i18n
  cleanup:               cleanup,
};
