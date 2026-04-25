// ═══════════════════════════════════════════════════
// everwith — i18n
// Traducciones ES / EN / IT
// ═══════════════════════════════════════════════════

var TRANSLATIONS = {
  es: {
    tagline:       'siempre contigo, sin ruido',
    loginBtn:      'entrar',
    registerBtn:   'crear cuenta',
    logout:        'salir',
    okBtn:         'estoy bien ❤️',
    sentOk:        'enviado ✓',
    noSignal:      'sin señal reciente 🌙',
    isOkay:        'está bien (hace un rato)',
    disconnecting: 'hoy está desconectando 🌿',
    waitingTitle:  'comparte tu código con tu persona',
    waitingOr:     'o introduce el código de tu pareja',
    linkBtn:       'vincular',
    changeAvatar:  'cambiar',
    avatarTitle:   'tu imagen',
    choosePhoto:   'elegir foto',
    save:          'guardar',
    cancel:        'cancelar',
    copiedCode:    '¡copiado!',
    linkError:     'código no encontrado',
    linkSelf:      'ese es tu propio código',
    alreadyLinked: 'ya tienes pareja vinculada',
    ephemeralHint: 'tócale para que lo sienta',
  },
  en: {
    tagline:       'always with you, without noise',
    loginBtn:      'enter',
    registerBtn:   'create account',
    logout:        'leave',
    okBtn:         "i'm okay ❤️",
    sentOk:        'sent ✓',
    noSignal:      'no recent signal 🌙',
    isOkay:        'is okay (recently)',
    disconnecting: 'taking a break today 🌿',
    waitingTitle:  'share your code with your person',
    waitingOr:     "or enter your partner's code",
    linkBtn:       'connect',
    changeAvatar:  'change',
    avatarTitle:   'your image',
    choosePhoto:   'choose photo',
    save:          'save',
    cancel:        'cancel',
    copiedCode:    'copied!',
    linkError:     'code not found',
    linkSelf:      "that's your own code",
    alreadyLinked: 'already linked with someone',
    ephemeralHint: 'touch them to let them feel it',
  },
  it: {
    tagline:       'sempre con te, senza rumore',
    loginBtn:      'entra',
    registerBtn:   'crea account',
    logout:        'esci',
    okBtn:         'sto bene ❤️',
    sentOk:        'inviato ✓',
    noSignal:      'nessun segnale recente 🌙',
    isOkay:        'sta bene (di recente)',
    disconnecting: 'oggi si sta disconnettendo 🌿',
    waitingTitle:  'condividi il tuo codice con la tua persona',
    waitingOr:     'o inserisci il codice del tuo partner',
    linkBtn:       'collega',
    changeAvatar:  'cambia',
    avatarTitle:   'la tua immagine',
    choosePhoto:   'scegli foto',
    save:          'salva',
    cancel:        'annulla',
    copiedCode:    'copiato!',
    linkError:     'codice non trovato',
    linkSelf:      'è il tuo stesso codice',
    alreadyLinked: 'hai già un partner collegato',
    ephemeralHint: 'toccalo perché lo senta',
  },
};

var currentLang = 'es';

// ─── Detectar idioma del navegador ───
function detectLang() {
  var saved = localStorage.getItem('everwith_lang');
  if (saved && TRANSLATIONS[saved]) return saved;
  var nav = (navigator.language || 'es').toLowerCase();
  if (nav.indexOf('en') === 0) return 'en';
  if (nav.indexOf('it') === 0) return 'it';
  return 'es';
}

// ─── Obtener texto traducido ───
function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.es)[key] || key;
}

// ─── Aplicar idioma ───
function applyLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('everwith_lang', lang);

  // Actualizar todos los textos estáticos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key]) el.textContent = TRANSLATIONS[lang][key];
  });

  document.documentElement.lang = lang;

  // Marcar botón activo
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // ─── Re-renderizar estado dinámico de la pareja ───
  // Usa los datos reales del ok_at — NO sobreescribe con texto fijo
  var mainScreen = document.getElementById('screen-main');
  if (mainScreen && !mainScreen.classList.contains('hidden')) {
    var okAt = window.authState
      && window.authState.partnerProfile
      && window.authState.partnerProfile.ok_at;

    var statusEl = document.getElementById('partner-status');
    if (statusEl && window.realtimeModule && window.realtimeModule.formatPartnerStatus) {
      // Recalcula el texto con el nuevo idioma usando el dato real
      statusEl.textContent = window.realtimeModule.formatPartnerStatus(okAt);
    }
  }
}

// ─── Inicializar ───
function initI18n() {
  var lang = detectLang();
  applyLang(lang);

  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      applyLang(btn.dataset.lang);
    });
  });
}

window.i18n = { applyLang: applyLang, t: t, initI18n: initI18n };
