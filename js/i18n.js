// ═══════════════════════════════════════════════════
// everwith — i18n
// Traducciones ES / EN / IT
// ═══════════════════════════════════════════════════

var TRANSLATIONS = {
  es: {
    tagline:       'Siempre contigo',
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
    ephemeralHint: 'pensando en ti',
	cropHint: "arrastra · pellizca · desliza para zoom",
    loginTab: "entrar",
    registerTab: "registro",
    loginBtn: "entrar",
    registerBtn: "crear cuenta",
    // Placeholders
    emailPlaceholder: "tu@correo.com",
    passwordPlaceholder: "contraseña",
    repeatPasswordPlaceholder: "repetir contraseña"
  },
  en: {
    tagline:       'Always with you',
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
    ephemeralHint: 'thinking of you',
	cropHint: "drag · pinch · slide to zoom",
    loginTab: "login",
    registerTab: "register",
    loginBtn: "sign in",
    registerBtn: "create account",
    // Placeholders
    emailPlaceholder: "your@email.com",
    passwordPlaceholder: "password",
    repeatPasswordPlaceholder: "repeat password"
  },
  it: {
    tagline:       'Sempre con te',
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
    ephemeralHint: 'ti sto pensando',
	cropHint: "trascina · pizzica · scorri per zoom",
    loginTab: "accedi",
    registerTab: "registrati",
    loginBtn: "entra",
    registerBtn: "crea account",
    // Placeholders
    emailPlaceholder: "tua@email. com",
    passwordPlaceholder: "password",
    repeatPasswordPlaceholder: "ripeti password"
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

  // 1. Actualizar textos estáticos (textContent)
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key]) el.textContent = TRANSLATIONS[lang][key];
  });

  // 2. ACTUALIZAR PLACEHOLDERS (Esto es lo que faltaba)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-placeholder');
    if (TRANSLATIONS[lang][key]) {
      el.setAttribute('placeholder', TRANSLATIONS[lang][key]);
    }
  });

  document.documentElement.lang = lang;

  // Marcar botón activo
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // ─── Re-renderizar estado dinámico de la pareja ───
  var mainScreen = document.getElementById('screen-main');
  if (mainScreen && !mainScreen.classList.contains('hidden')) {
    var okAt = window.authState &&
               window.authState.partnerProfile &&
               window.authState.partnerProfile.ok_at;

    var statusEl = document.getElementById('partner-status');
    if (statusEl && window.realtimeModule && window.realtimeModule.formatPartnerStatus) {
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
