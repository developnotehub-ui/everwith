// ═══════════════════════════════════════════════════
// everwith — Realtime
// Estado + toque efímero con ondas JS (fiable)
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

function renderPartnerStatus(okAt) {
  var el = document.getElementById('partner-status');
  if (el) el.textContent = formatPartnerStatus(okAt);
}

// ─── Animación de ondas a pantalla completa ───
// Crea elementos <div> dinámicamente en JS para evitar
// el problema del reflow con clases CSS + display:none
function triggerFullScreenRipple() {
  var container = document.getElementById('screen-main');
  if (!container) return;

  var delays = [0, 400, 800, 1200];

  delays.forEach(function(delay) {
    setTimeout(function() {
      var ring = document.createElement('div');
      ring.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'width:10px',
        'height:10px',
        'margin-top:-5px',
        'margin-left:-5px',
        'border-radius:50%',
        'border:1.5px solid rgba(196,160,232,0.7)',
        'pointer-events:none',
        'z-index:999',
        'transform:scale(1)',
        'opacity:0.8',
        'transition:none',
      ].join(';');

      document.body.appendChild(ring);

      // Forzar reflow antes de iniciar la transición
      void ring.offsetWidth;

      ring.style.transition = 'transform 2.2s cubic-bezier(0.1,0.6,0.3,1), opacity 2.2s ease-out';
      ring.style.transform  = 'scale(' + (Math.max(window.innerWidth, window.innerHeight) * 0.22) + ')';
      ring.style.opacity    = '0';

      setTimeout(function() {
        if (ring.parentNode) ring.parentNode.removeChild(ring);
      }, 2400);
    }, delay);
  });
}

// ─── Inicializar canal Realtime ───
function initRealtime(myUserId, partnerId) {
  cleanup();

  var ids = [myUserId, partnerId].sort();
  var channelName = 'pair:' + ids[0] + ':' + ids[1];

  realtimeChannel = sb.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  // Toque efímero recibido → ondas en pantalla
  realtimeChannel.on('broadcast', { event: 'ephemeral_touch' }, function() {
    console.log('Toque efímero recibido ✓');
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

  realtimeChannel.subscribe(function(status) {
    console.log('Canal realtime:', status);
  });

  statusUpdateInterval = setInterval(function() {
    var okAt = window.authState && window.authState.partnerProfile && window.authState.partnerProfile.ok_at;
    renderPartnerStatus(okAt);
  }, 60000);
}

// ─── Enviar toque efímero ───
async function sendEphemeralTouch() {
  if (!realtimeChannel) {
    console.warn('Sin canal realtime — no se puede enviar toque');
    return;
  }
  console.log('Enviando toque efímero...');
  var result = await realtimeChannel.send({
    type: 'broadcast',
    event: 'ephemeral_touch',
    payload: {},
  });
  console.log('Resultado envío:', result);
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
