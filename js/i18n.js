// ═══════════════════════════════════════════════════
// everwith — Sistema i18n
// Traducciones + detección automática + cambio en vivo
// ═══════════════════════════════════════════════════

const TRANSLATIONS = {
  es: {
    tagline:       'siempre contigo',
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
    tagline:       'always with you',
    loginBtn:      'enter',
    registerBtn:   'create account',
    logout:        'leave',
    okBtn:         "i'm okay ❤️",
    sentOk:        'sent ✓',
    noSignal:      'no recent signal 🌙',
    isOkay:        'is okay (recently)',
    disconnecting: 'taking a break today 🌿',
    waitingTitle:  'share your code with your person',
    waitingOr:     'or enter your partner\'s code',
    linkBtn:       'connect',
    changeAvatar:  'change',
    avatarTitle:   'your image',
    choosePhoto:   'choose photo',
    save:          'save',
    cancel:        'cancel',
    copiedCode:    'copied!',
    linkError:     'code not found',
    linkSelf:      'that\'s your own code',
    alreadyLinked: 'already linked with someone',
    ephemeralHint: 'touch them to let them feel it',
  },
  it: {
    tagline:       'sempre con te',
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

// Idioma activo
let currentLang = 'es';

// ─── Detectar idioma del navegador ───
function detectLang() {
  const saved = localStorage.getItem('everwith_lang');
  if (saved && TRANSLATIONS[saved]) return saved;
  const nav = (navigator.language || 'es').toLowerCase();
  if (nav.startsWith('en')) return 'en';
  if (nav.startsWith('it')) return 'it';
  return 'es';
}

// ─── Aplicar idioma a todos los elementos data-i18n ───
function applyLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('everwith_lang', lang);

  // Actualizar textos
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key]) el.textContent = TRANSLATIONS[lang][key];
  });

  // Actualizar atributo lang del html
  document.documentElement.lang = lang;

  // Marcar botón activo
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// ─── Obtener texto traducido por clave ───
function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.es)[key] || key;
}

// ─── Inicializar y conectar botones de idioma ───
function initI18n() {
  const lang = detectLang();
  applyLang(lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
}

// Exponer globalmente
window.i18n = { applyLang, t, initI18n };
