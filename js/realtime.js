// ═══════════════════════════════════════════════════
// everwith — Realtime
// Sincronización de estado "estoy bien" y toque efímero
// El toque efímero NUNCA se guarda en base de datos
// ═══════════════════════════════════════════════════

let realtimeChannel = null;
let statusUpdateInterval = null;

// ─── Formatear estado de la pareja según su último ok_at ───
function formatPartnerStatus(okAt) {
  if (!okAt) {
    return window.i18n.t('noSignal');
  }

  const diff = Date.now() - new Date(okAt).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  // Menos de 8 horas → "está bien (hace un rato)"
  if (diff < 8 * 3600000) {
    return window.i18n.t('isOkay');
  }

  // 8–24 horas → "hoy está desconectando"
  if (diff < 24 * 3600000) {
    return window.i18n.t('disconnecting');
  }

  // Más de 24 horas → "sin señal reciente"
  return window.i18n.t('noSignal');
}

// ─── Actualizar texto de estado en la UI ───
function renderPartnerStatus(okAt) {
  const el = document.getElementById('partner-status');
  if (el) el.textContent = formatPartnerStatus(okAt);
}

// ─── Activar animación de toque efímero ───
function triggerEphemeralAnimation() {
  const wrap = document.getElementById('partner-avatar-wrap');
  if (!wrap) return;

  // Quitar clase si ya estaba animando (reset)
  wrap.classList.remove('rippling');

  // Forzar reflow para reiniciar animación CSS
  void wrap.offsetWidth;

  wrap.classList.add('rippling');

  // Quitar clase al terminar
  setTimeout(() => wrap.classList.remove('rippling'), 2500);
}

// ─── Inicializar canal Realtime para la pareja ───
function initRealtime(myUserId, partnerId) {
  // Limpiar canal anterior si existe
  cleanup();

  // Nombre de canal único para esta pareja (ordenado para que sea el mismo desde ambos lados)
  const ids = [myUserId, partnerId].sort();
  const channelName = `pair:${ids[0]}:${ids[1]}`;

  realtimeChannel = sb.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  // ── Escuchar "toque efímero" (BROADCAST, sin persistencia) ──
  realtimeChannel.on('broadcast', { event: 'ephemeral_touch' }, () => {
    triggerEphemeralAnimation();
  });

  // ── Escuchar cambios de estado de la pareja en DB (Realtime Postgres Changes) ──
  realtimeChannel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${partnerId}`,
    },
    (payload) => {
      const newOkAt = payload.new?.ok_at;
      renderPartnerStatus(newOkAt);

      // Actualizar avatar de pareja si cambió
      const newAvatar = payload.new?.avatar_url;
      if (newAvatar) renderPartnerAvatar(payload.new);
    }
  );

  realtimeChannel.subscribe();

  // Actualizar estado mostrado cada minuto (para que el texto relativo sea correcto)
  statusUpdateInterval = setInterval(() => {
    const partnerOkAt = window.authState?.partnerProfile?.ok_at;
    renderPartnerStatus(partnerOkAt);
  }, 60000);
}

// ─── Enviar toque efímero (broadcast, sin guardar) ───
async function sendEphemeralTouch() {
  if (!realtimeChannel) return;
  await realtimeChannel.send({
    type: 'broadcast',
    event: 'ephemeral_touch',
    payload: {}, // Sin datos identificables
  });
}

// ─── Enviar "estoy bien" (persiste en DB) ───
async function sendOkStatus() {
  const userId = window.authState?.user?.id;
  if (!userId) return;

  const now = new Date().toISOString();

  const { error } = await sb
    .from('profiles')
    .update({ ok_at: now })
    .eq('id', userId);

  if (!error) {
    // Animar botón
    const btn = document.getElementById('btn-ok');
    btn?.classList.add('pulse');
    setTimeout(() => btn?.classList.remove('pulse'), 700);

    // Mostrar hint de enviado
    const hint = document.getElementById('my-sent-status');
    if (hint) {
      hint.classList.remove('hidden');
      setTimeout(() => hint.classList.add('hidden'), 3000);
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

// Exponer globalmente
window.realtimeModule = {
  initRealtime,
  sendEphemeralTouch,
  sendOkStatus,
  renderPartnerStatus,
  cleanup,
};
