// ═══════════════════════════════════════════════════
// everwith — Avatares
// ═══════════════════════════════════════════════════

let pendingAvatarDataUrl = null;

// ─── Renderizar avatar propio ───
function renderMyAvatar(profile) {
  const initialsEl = document.getElementById('my-initials');
  const imgEl      = document.getElementById('my-img');

  if (profile?.avatar_url) {
    imgEl.src = profile.avatar_url;
    imgEl.classList.remove('hidden');
    initialsEl.classList.add('hidden');
  } else {
    initialsEl.textContent = (profile?.display_name || profile?.email || 'yo').charAt(0).toUpperCase();
    imgEl.classList.add('hidden');
    initialsEl.classList.remove('hidden');
  }
}

// ─── Renderizar avatar de la pareja ───
function renderPartnerAvatar(partnerProfile) {
  if (partnerProfile) window.authState.partnerProfile = partnerProfile;

  const initialsEl = document.getElementById('partner-initials');
  const imgEl      = document.getElementById('partner-img');

  if (partnerProfile?.avatar_url) {
    imgEl.src = partnerProfile.avatar_url;
    imgEl.classList.remove('hidden');
    initialsEl.classList.add('hidden');
  } else {
    initialsEl.textContent = (partnerProfile?.display_name || partnerProfile?.email || '?').charAt(0).toUpperCase();
    imgEl.classList.add('hidden');
    initialsEl.classList.remove('hidden');
  }
}

// ─── Abrir modal de avatar ───
function openAvatarModal() {
  const modal = document.getElementById('modal-avatar');
  modal.classList.remove('hidden');
  pendingAvatarDataUrl = null;

  const profile         = window.authState.profile;
  const previewInitials = document.getElementById('avatar-preview-initials');
  const previewImg      = document.getElementById('avatar-preview-img');

  if (profile?.avatar_url) {
    previewImg.src = profile.avatar_url;
    previewImg.classList.remove('hidden');
    previewInitials.classList.add('hidden');
  } else {
    previewInitials.textContent = (profile?.display_name || 'yo').charAt(0).toUpperCase();
    previewImg.classList.add('hidden');
    previewInitials.classList.remove('hidden');
  }
}

// ─── Cerrar modal ───
function closeAvatarModal() {
  document.getElementById('modal-avatar').classList.add('hidden');
  pendingAvatarDataUrl = null;
  document.getElementById('avatar-file-input').value = '';
}

// ─── Comprimir imagen a base64 (max 200px) ───
function compressImage(file) {
  return new Promise(function(resolve) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function() {
      var MAX = 200;
      var ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      var canvas = document.createElement('canvas');
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

// ─── Seleccionar archivo ───
document.getElementById('avatar-file-input').addEventListener('change', async function(e) {
  var file = e.target.files && e.target.files[0];
  if (!file) return;

  var dataUrl = await compressImage(file);
  pendingAvatarDataUrl = dataUrl;

  var previewImg      = document.getElementById('avatar-preview-img');
  var previewInitials = document.getElementById('avatar-preview-initials');
  previewImg.src = dataUrl;
  previewImg.classList.remove('hidden');
  previewInitials.classList.add('hidden');
});

// ─── Guardar avatar ───
document.getElementById('btn-save-avatar').addEventListener('click', async function() {
  var userId = window.authState && window.authState.user && window.authState.user.id;
  if (!userId) return;

  var avatarUrl = pendingAvatarDataUrl || (window.authState.profile && window.authState.profile.avatar_url);

  if (!avatarUrl) {
    closeAvatarModal();
    return;
  }

  var result = await sb
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (!result.error) {
    window.authState.profile.avatar_url = avatarUrl;
    renderMyAvatar(window.authState.profile);
  }

  closeAvatarModal();
});

// ─── Cancelar ───
document.getElementById('btn-cancel-avatar').addEventListener('click', closeAvatarModal);

// ─── Cerrar modal al clic fuera ───
document.getElementById('modal-avatar').addEventListener('click', function(e) {
  if (e.target.id === 'modal-avatar') closeAvatarModal();
});

// ─── Clic en avatar propio → abrir modal ───
document.getElementById('my-avatar-wrap').addEventListener('click', openAvatarModal);

// ─── Clic en avatar pareja → toque efímero ───
document.getElementById('partner-avatar-wrap').addEventListener('click', function() {
  // Solo funciona si hay pareja vinculada
  if (!window.authState || !window.authState.profile || !window.authState.profile.partner_id) return;

  window.realtimeModule && window.realtimeModule.sendEphemeralTouch();

  // Feedback suave en mi avatar al enviar
  var myAvatar = document.getElementById('my-avatar');
  if (myAvatar) {
    myAvatar.style.borderColor = 'rgba(196,160,232,0.5)';
    setTimeout(function() { myAvatar.style.borderColor = ''; }, 1000);
  }
});

// Exponer
window.avatarModule = { renderMyAvatar: renderMyAvatar, renderPartnerAvatar: renderPartnerAvatar };
