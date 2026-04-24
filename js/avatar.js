// ═══════════════════════════════════════════════════
// everwith — Avatares
// Cambiar avatar propio + mostrar avatar de pareja
// ═══════════════════════════════════════════════════

let pendingAvatarDataUrl = null; // Imagen seleccionada, pendiente de guardar

// ─── Renderizar avatar propio ───
function renderMyAvatar(profile) {
  const initialsEl = document.getElementById('my-initials');
  const imgEl      = document.getElementById('my-img');

  if (profile?.avatar_url) {
    imgEl.src = profile.avatar_url;
    imgEl.classList.remove('hidden');
    initialsEl.classList.add('hidden');
  } else {
    const initials = (profile?.display_name || profile?.email || 'yo')
      .charAt(0).toUpperCase();
    initialsEl.textContent = initials;
    imgEl.classList.add('hidden');
    initialsEl.classList.remove('hidden');
  }
}

// ─── Renderizar avatar de la pareja ───
function renderPartnerAvatar(partnerProfile) {
  // Guardar en estado para que el status actualizado pueda acceder
  if (partnerProfile) window.authState.partnerProfile = partnerProfile;

  const initialsEl = document.getElementById('partner-initials');
  const imgEl      = document.getElementById('partner-img');

  if (partnerProfile?.avatar_url) {
    imgEl.src = partnerProfile.avatar_url;
    imgEl.classList.remove('hidden');
    initialsEl.classList.add('hidden');
  } else {
    const initials = (partnerProfile?.display_name || partnerProfile?.email || '?')
      .charAt(0).toUpperCase();
    initialsEl.textContent = initials;
    imgEl.classList.add('hidden');
    initialsEl.classList.remove('hidden');
  }
}

// ─── Abrir modal de avatar ───
function openAvatarModal() {
  const modal = document.getElementById('modal-avatar');
  modal.classList.remove('hidden');
  pendingAvatarDataUrl = null;

  // Sync con avatar actual
  const profile = window.authState.profile;
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
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 200;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

// ─── Seleccionar archivo de imagen ───
document.getElementById('avatar-file-input').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const dataUrl = await compressImage(file);
  pendingAvatarDataUrl = dataUrl;

  // Preview en modal
  const previewImg      = document.getElementById('avatar-preview-img');
  const previewInitials = document.getElementById('avatar-preview-initials');
  previewImg.src = dataUrl;
  previewImg.classList.remove('hidden');
  previewInitials.classList.add('hidden');
});

// ─── Guardar avatar ───
document.getElementById('btn-save-avatar').addEventListener('click', async () => {
  const userId = window.authState?.user?.id;
  if (!userId) return;

  const avatarUrl = pendingAvatarDataUrl || window.authState.profile?.avatar_url;

  if (!avatarUrl) {
    closeAvatarModal();
    return;
  }

  // Guardar en Supabase (como data URL base64 en el perfil)
  // Nota: para producción real usar Supabase Storage, aquí simplificamos
  const { error } = await sb
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (!error) {
    window.authState.profile.avatar_url = avatarUrl;
    renderMyAvatar(window.authState.profile);
  }

  closeAvatarModal();
});

// ─── Cancelar ───
document.getElementById('btn-cancel-avatar').addEventListener('click', closeAvatarModal);

// ─── Cerrar modal al hacer clic fuera ───
document.getElementById('modal-avatar').addEventListener('click', (e) => {
  if (e.target.id === 'modal-avatar') closeAvatarModal();
});

// ─── Clic en avatar propio → abrir modal ───
document.getElementById('my-avatar-wrap').addEventListener('click', openAvatarModal);

// ─── Clic en avatar pareja → toque efímero ───
document.getElementById('partner-avatar-wrap').addEventListener('click', () => {
  window.realtimeModule?.sendEphemeralTouch?.();

  // Feedback visual suave en el avatar propio (saber que enviaste)
  const myAvatar = document.getElementById('my-avatar');
  myAvatar.style.borderColor = 'rgba(196,160,232,0.5)';
  setTimeout(() => { myAvatar.style.borderColor = ''; }, 1000);
});

// Exponer
window.avatarModule = { renderMyAvatar, renderPartnerAvatar };
