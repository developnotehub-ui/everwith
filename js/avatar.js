// ═══════════════════════════════════════════════════
// everwith — Avatares con Crop
// ═══════════════════════════════════════════════════

var pendingCropDataUrl = null;
var VIEWPORT_SIZE = 240;

var cropState = {
  naturalW: 0, naturalH: 0,
  scale: 1, minScale: 1,
  offsetX: 0, offsetY: 0,
  dragging: false, lastX: 0, lastY: 0,
  lastPinchDist: 0,
};

// ─── Renderizar avatares ───
function renderMyAvatar(profile) {
  var ini = document.getElementById('my-initials');
  var img = document.getElementById('my-img');
  if (profile && profile.avatar_url) {
    img.src = profile.avatar_url;
    img.classList.remove('hidden');
    ini.classList.add('hidden');
  } else {
    ini.textContent = ((profile && (profile.display_name || profile.email)) || 'yo').charAt(0).toUpperCase();
    img.classList.add('hidden');
    ini.classList.remove('hidden');
  }
}

function renderPartnerAvatar(p) {
  if (p) window.authState.partnerProfile = p;
  var ini = document.getElementById('partner-initials');
  var img = document.getElementById('partner-img');
  if (p && p.avatar_url) {
    img.src = p.avatar_url;
    img.classList.remove('hidden');
    ini.classList.add('hidden');
  } else {
    ini.textContent = ((p && (p.display_name || p.email)) || '?').charAt(0).toUpperCase();
    img.classList.add('hidden');
    ini.classList.remove('hidden');
  }
}

// ─── Modal ───
function openAvatarModal() {
  document.getElementById('modal-avatar').classList.remove('hidden');
  document.getElementById('avatar-preview').classList.remove('hidden');
  document.getElementById('crop-container').classList.add('hidden');
  pendingCropDataUrl = null;

  var profile = window.authState.profile;
  var pi = document.getElementById('avatar-preview-initials');
  var pimg = document.getElementById('avatar-preview-img');
  if (profile && profile.avatar_url) {
    pimg.src = profile.avatar_url; pimg.classList.remove('hidden'); pi.classList.add('hidden');
  } else {
    pi.textContent = ((profile && (profile.display_name || profile.email)) || 'yo').charAt(0).toUpperCase();
    pimg.classList.add('hidden'); pi.classList.remove('hidden');
  }
}

function closeAvatarModal() {
  document.getElementById('modal-avatar').classList.add('hidden');
  document.getElementById('crop-container').classList.add('hidden');
  document.getElementById('avatar-preview').classList.remove('hidden');
  pendingCropDataUrl = null;
  document.getElementById('avatar-file-input').value = '';
}

// ─── Aplicar transform ───
function applyCropTransform() {
  var wrap = document.getElementById('crop-image-wrap');
  if (!wrap) return;
  var s = cropState;
  var tx = (VIEWPORT_SIZE - s.naturalW * s.scale) / 2 + s.offsetX;
  var ty = (VIEWPORT_SIZE - s.naturalH * s.scale) / 2 + s.offsetY;
  wrap.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s.scale + ')';
  wrap.style.transformOrigin = '0 0';
}

// ─── Clamp offsets ───
function clampOffsets() {
  var s = cropState;
  var maxX = Math.max(0, (s.naturalW * s.scale - VIEWPORT_SIZE) / 2);
  var maxY = Math.max(0, (s.naturalH * s.scale - VIEWPORT_SIZE) / 2);
  s.offsetX = Math.max(-maxX, Math.min(maxX, s.offsetX));
  s.offsetY = Math.max(-maxY, Math.min(maxY, s.offsetY));
}

// ─── Zoom slider ───
document.getElementById('crop-zoom').addEventListener('input', function() {
  cropState.scale = parseFloat(this.value);
  clampOffsets();
  applyCropTransform();
});

// ─── Cargar imagen ───
function loadImageIntoCrop(dataUrl) {
  var img = document.getElementById('crop-img');
  img.onload = function() {
    var s = cropState;
    s.naturalW = img.naturalWidth;
    s.naturalH = img.naturalHeight;
    s.offsetX = 0;
    s.offsetY = 0;

    // Escala mínima: imagen cubre todo el viewport
    s.minScale = Math.max(VIEWPORT_SIZE / s.naturalW, VIEWPORT_SIZE / s.naturalH);
    s.scale = s.minScale;

    var slider = document.getElementById('crop-zoom');
    slider.min   = s.minScale;
    slider.max   = s.minScale * 3;
    slider.step  = 0.001;
    slider.value = s.minScale;

    applyCropTransform();

    document.getElementById('avatar-preview').classList.add('hidden');
    document.getElementById('crop-container').classList.remove('hidden');
  };
  img.onerror = function() {
    console.error('Error cargando imagen en crop');
  };
  img.src = dataUrl;
}

// ─── Seleccionar archivo ───
document.getElementById('avatar-file-input').addEventListener('change', function(e) {
  var file = e.target.files && e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) { loadImageIntoCrop(ev.target.result); };
  reader.readAsDataURL(file);
});

// ─── Drag (mouse) ───
var vp = document.getElementById('crop-viewport');

vp.addEventListener('mousedown', function(e) {
  cropState.dragging = true;
  cropState.lastX = e.clientX;
  cropState.lastY = e.clientY;
  e.preventDefault();
});
document.addEventListener('mousemove', function(e) {
  if (!cropState.dragging) return;
  cropState.offsetX += e.clientX - cropState.lastX;
  cropState.offsetY += e.clientY - cropState.lastY;
  cropState.lastX = e.clientX;
  cropState.lastY = e.clientY;
  clampOffsets();
  applyCropTransform();
});
document.addEventListener('mouseup', function() { cropState.dragging = false; });

// ─── Touch (drag + pinch) ───
vp.addEventListener('touchstart', function(e) {
  if (e.touches.length === 1) {
    cropState.dragging = true;
    cropState.lastX = e.touches[0].clientX;
    cropState.lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    cropState.dragging = false;
    cropState.lastPinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
  e.preventDefault();
}, { passive: false });

vp.addEventListener('touchmove', function(e) {
  if (e.touches.length === 1 && cropState.dragging) {
    cropState.offsetX += e.touches[0].clientX - cropState.lastX;
    cropState.offsetY += e.touches[0].clientY - cropState.lastY;
    cropState.lastX = e.touches[0].clientX;
    cropState.lastY = e.touches[0].clientY;
    clampOffsets();
    applyCropTransform();
  } else if (e.touches.length === 2) {
    var dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    var newScale = Math.max(
      cropState.minScale,
      Math.min(cropState.minScale * 3, cropState.scale * (dist / cropState.lastPinchDist))
    );
    cropState.scale = newScale;
    cropState.lastPinchDist = dist;
    document.getElementById('crop-zoom').value = newScale;
    clampOffsets();
    applyCropTransform();
  }
  e.preventDefault();
}, { passive: false });

vp.addEventListener('touchend', function() { cropState.dragging = false; });

// ─── Extraer crop circular ───
function extractCrop() {
  var img = document.getElementById('crop-img');
  var SIZE = 300;
  var s = cropState;

  // Posición de la imagen dentro del viewport
  var imgLeft = (VIEWPORT_SIZE - s.naturalW * s.scale) / 2 + s.offsetX;
  var imgTop  = (VIEWPORT_SIZE - s.naturalH * s.scale) / 2 + s.offsetY;

  // Centro del viewport en coordenadas de imagen original
  var srcX = (VIEWPORT_SIZE / 2 - imgLeft) / s.scale;
  var srcY = (VIEWPORT_SIZE / 2 - imgTop)  / s.scale;
  var srcSize = VIEWPORT_SIZE / s.scale;

  var canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  var ctx = canvas.getContext('2d');

  // Clip circular
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    img,
    srcX - srcSize / 2, srcY - srcSize / 2, srcSize, srcSize,
    0, 0, SIZE, SIZE
  );

  return canvas.toDataURL('image/jpeg', 0.88);
}
// ─── Guardar ───
document.getElementById('btn-save-avatar').addEventListener('click', async function() {
  var userId = window.authState && window.authState.user && window.authState.user.id;
  if (!userId) return;

  var cropVisible = !document.getElementById('crop-container').classList.contains('hidden');

  // Si no hay crop activo, cerrar sin cambios
  if (!cropVisible) { closeAvatarModal(); return; }

  var dataUrl;
  try {
    dataUrl = extractCrop();
  } catch(err) {
    console.error('Error en extractCrop:', err);
    closeAvatarModal();
    return;
  }

  if (!dataUrl) { closeAvatarModal(); return; }

  // Convertir dataURL a Blob
  var res = await fetch(dataUrl);
  var blob = await res.blob();

  // Subir a Supabase Storage
  var filePath = userId + '/avatar.jpg';
  var { error: uploadError } = await sb.storage
    .from('avatars')
    .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

  if (uploadError) {
    console.error('Error subiendo avatar:', uploadError);
    closeAvatarModal();
    return;
  }

  // Obtener URL pública
  var { data: urlData } = sb.storage
    .from('avatars')
    .getPublicUrl(filePath);

  var publicUrl = urlData.publicUrl + '?t=' + Date.now(); // cache-bust

  // Guardar URL en el perfil (ya no base64)
  var { error: updateError } = await sb
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (!updateError) {
    window.authState.profile.avatar_url = publicUrl;
    renderMyAvatar(window.authState.profile);
  }

  closeAvatarModal();
});

// ─── Cancelar / cerrar ───
document.getElementById('btn-cancel-avatar').addEventListener('click', closeAvatarModal);
document.getElementById('modal-avatar').addEventListener('click', function(e) {
  if (e.target.id === 'modal-avatar') closeAvatarModal();
});

// ─── Clicks en avatares ───
document.getElementById('my-avatar-wrap').addEventListener('click', openAvatarModal);

document.getElementById('partner-avatar-wrap').addEventListener('click', function() {
  if (!window.authState || !window.authState.profile || !window.authState.profile.partner_id) return;
  window.realtimeModule && window.realtimeModule.sendEphemeralTouch();
  var myAvatar = document.getElementById('my-avatar');
  if (myAvatar) {
    myAvatar.style.borderColor = 'rgba(196,160,232,0.5)';
    setTimeout(function() { myAvatar.style.borderColor = ''; }, 1000);
  }
});

window.avatarModule = { renderMyAvatar: renderMyAvatar, renderPartnerAvatar: renderPartnerAvatar };
