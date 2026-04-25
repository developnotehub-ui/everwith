// ═══════════════════════════════════════════════════
// everwith — Avatares con Crop
// Drag + zoom slider + pinch-to-zoom (móvil)
// ═══════════════════════════════════════════════════

var pendingCropDataUrl = null; // resultado final del crop

// Estado del crop
var cropState = {
  naturalW: 0,
  naturalH: 0,
  scale: 1,
  minScale: 1,
  maxScale: 3,
  offsetX: 0,    // desplazamiento en px (coordenadas de la imagen escalada)
  offsetY: 0,
  dragging: false,
  lastX: 0,
  lastY: 0,
  // pinch
  lastPinchDist: 0,
};

var VIEWPORT_SIZE = 240; // px — debe coincidir con el CSS

// ─── Renderizar avatar propio ───
function renderMyAvatar(profile) {
  var initialsEl = document.getElementById('my-initials');
  var imgEl      = document.getElementById('my-img');
  if (profile && profile.avatar_url) {
    imgEl.src = profile.avatar_url;
    imgEl.classList.remove('hidden');
    initialsEl.classList.add('hidden');
  } else {
    initialsEl.textContent = ((profile && (profile.display_name || profile.email)) || 'yo').charAt(0).toUpperCase();
    imgEl.classList.add('hidden');
    initialsEl.classList.remove('hidden');
  }
}

// ─── Renderizar avatar de la pareja ───
function renderPartnerAvatar(partnerProfile) {
  if (partnerProfile) window.authState.partnerProfile = partnerProfile;
  var initialsEl = document.getElementById('partner-initials');
  var imgEl      = document.getElementById('partner-img');
  if (partnerProfile && partnerProfile.avatar_url) {
    imgEl.src = partnerProfile.avatar_url;
    imgEl.classList.remove('hidden');
    initialsEl.classList.add('hidden');
  } else {
    initialsEl.textContent = ((partnerProfile && (partnerProfile.display_name || partnerProfile.email)) || '?').charAt(0).toUpperCase();
    imgEl.classList.add('hidden');
    initialsEl.classList.remove('hidden');
  }
}

// ─── Abrir modal ───
function openAvatarModal() {
  var modal = document.getElementById('modal-avatar');
  modal.classList.remove('hidden');
  pendingCropDataUrl = null;

  // Mostrar preview, ocultar crop
  document.getElementById('avatar-preview').classList.remove('hidden');
  document.getElementById('crop-container').classList.add('hidden');

  var profile = window.authState.profile;
  var previewInitials = document.getElementById('avatar-preview-initials');
  var previewImg      = document.getElementById('avatar-preview-img');

  if (profile && profile.avatar_url) {
    previewImg.src = profile.avatar_url;
    previewImg.classList.remove('hidden');
    previewInitials.classList.add('hidden');
  } else {
    previewInitials.textContent = ((profile && (profile.display_name || profile.email)) || 'yo').charAt(0).toUpperCase();
    previewImg.classList.add('hidden');
    previewInitials.classList.remove('hidden');
  }
}

// ─── Cerrar modal ───
function closeAvatarModal() {
  document.getElementById('modal-avatar').classList.add('hidden');
  pendingCropDataUrl = null;
  document.getElementById('avatar-file-input').value = '';
  document.getElementById('crop-container').classList.add('hidden');
  document.getElementById('avatar-preview').classList.remove('hidden');
}

// ─── Aplicar transform al crop ───
function applyCropTransform() {
  var wrap = document.getElementById('crop-image-wrap');
  if (!wrap) return;
  // Centramos: el offset es relativo al centro del viewport
  var tx = VIEWPORT_SIZE / 2 - cropState.scale * cropState.naturalW / 2 + cropState.offsetX;
  var ty = VIEWPORT_SIZE / 2 - cropState.scale * cropState.naturalH / 2 + cropState.offsetY;
  wrap.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + cropState.scale + ')';
  wrap.style.transformOrigin = '0 0';
}

// ─── Clamp offsets para que la imagen no deje huecos ───
function clampOffsets() {
  var hw = cropState.scale * cropState.naturalW / 2;
  var hh = cropState.scale * cropState.naturalH / 2;
  var halfVP = VIEWPORT_SIZE / 2;
  // Máximo desplazamiento: que el borde de la imagen llegue al borde del viewport
  var maxX = hw - halfVP;
  var maxY = hh - halfVP;
  cropState.offsetX = Math.max(-maxX, Math.min(maxX, cropState.offsetX));
  cropState.offsetY = Math.max(-maxY, Math.min(maxY, cropState.offsetY));
}

// ─── Cambiar zoom desde slider ───
document.getElementById('crop-zoom').addEventListener('input', function() {
  var newScale = parseFloat(this.value);
  cropState.scale = newScale;
  clampOffsets();
  applyCropTransform();
});

// ─── Cargar imagen en el crop ───
function loadImageIntoCrop(dataUrl) {
  var img = document.getElementById('crop-img');
  img.onload = function() {
    cropState.naturalW  = img.naturalWidth;
    cropState.naturalH  = img.naturalHeight;
    cropState.offsetX   = 0;
    cropState.offsetY   = 0;

    // Escala mínima: la imagen cubre todo el viewport
    var minScale = Math.max(VIEWPORT_SIZE / img.naturalWidth, VIEWPORT_SIZE / img.naturalHeight);
    cropState.minScale = minScale;
    cropState.scale    = minScale;

    var slider = document.getElementById('crop-zoom');
    slider.min   = minScale;
    slider.max   = minScale * 3;
    slider.step  = minScale * 0.01;
    slider.value = minScale;

    applyCropTransform();

    // Mostrar crop, ocultar preview
    document.getElementById('avatar-preview').classList.add('hidden');
    document.getElementById('crop-container').classList.remove('hidden');
  };
  img.src = dataUrl;
}

// ─── Seleccionar archivo ───
document.getElementById('avatar-file-input').addEventListener('change', function(e) {
  var file = e.target.files && e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(ev) {
    loadImageIntoCrop(ev.target.result);
  };
  reader.readAsDataURL(file);
});

// ─── Drag en el viewport (mouse) ───
var viewport = document.getElementById('crop-viewport');

viewport.addEventListener('mousedown', function(e) {
  cropState.dragging = true;
  cropState.lastX = e.clientX;
  cropState.lastY = e.clientY;
  e.preventDefault();
});
document.addEventListener('mousemove', function(e) {
  if (!cropState.dragging) return;
  var dx = e.clientX - cropState.lastX;
  var dy = e.clientY - cropState.lastY;
  cropState.offsetX += dx;
  cropState.offsetY += dy;
  cropState.lastX = e.clientX;
  cropState.lastY = e.clientY;
  clampOffsets();
  applyCropTransform();
});
document.addEventListener('mouseup', function() { cropState.dragging = false; });

// ─── Touch: drag + pinch ───
viewport.addEventListener('touchstart', function(e) {
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

viewport.addEventListener('touchmove', function(e) {
  if (e.touches.length === 1 && cropState.dragging) {
    var dx = e.touches[0].clientX - cropState.lastX;
    var dy = e.touches[0].clientY - cropState.lastY;
    cropState.offsetX += dx;
    cropState.offsetY += dy;
    cropState.lastX = e.touches[0].clientX;
    cropState.lastY = e.touches[0].clientY;
    clampOffsets();
    applyCropTransform();
  } else if (e.touches.length === 2) {
    var dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    var delta = dist - cropState.lastPinchDist;
    cropState.lastPinchDist = dist;
    var newScale = Math.max(cropState.minScale, Math.min(cropState.minScale * 3, cropState.scale + delta * 0.01));
    cropState.scale = newScale;
    document.getElementById('crop-zoom').value = newScale;
    clampOffsets();
    applyCropTransform();
  }
  e.preventDefault();
}, { passive: false });

viewport.addEventListener('touchend', function() { cropState.dragging = false; });

// ─── Extraer canvas circular del crop ───
function extractCrop() {
  var img = document.getElementById('crop-img');
  var SIZE = 300; // tamaño de salida en px
  var canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  var ctx = canvas.getContext('2d');

  // Clip circular
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
  ctx.clip();

  // Calcular qué parte de la imagen original está visible en el viewport
  var scale      = cropState.scale;
  var imgW       = cropState.naturalW;
  var imgH       = cropState.naturalH;
  var halfVP     = VIEWPORT_SIZE / 2;

  // Centro de la imagen en coordenadas del viewport
  var imgCenterX = halfVP + cropState.offsetX; // donde está el centro de la img en viewport px
  var imgCenterY = halfVP + cropState.offsetY;

  // Coordenada en la imagen original que corresponde al centro del viewport
  var srcCX = (halfVP - imgCenterX + halfVP) / scale + imgW / 2 - imgW / 2;
  // Simplificado:
  var srcX = (halfVP - (halfVP + cropState.offsetX)) / scale + imgW / 2 - halfVP / scale;
  var srcY = (halfVP - (halfVP + cropState.offsetY)) / scale + imgH / 2 - halfVP / scale;
  var srcSize = VIEWPORT_SIZE / scale;

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);

  return canvas.toDataURL('image/jpeg', 0.88);
}

// ─── Guardar avatar ───
document.getElementById('btn-save-avatar').addEventListener('click', async function() {
  var userId = window.authState && window.authState.user && window.authState.user.id;
  if (!userId) return;

  var avatarUrl;
  var cropVisible = !document.getElementById('crop-container').classList.contains('hidden');

  if (cropVisible) {
    // Extraer el recorte
    avatarUrl = extractCrop();
  } else {
    // Sin imagen nueva seleccionada — mantener la actual
    avatarUrl = window.authState.profile && window.authState.profile.avatar_url;
  }

  if (!avatarUrl) { closeAvatarModal(); return; }

  var result = await sb.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);

  if (!result.error) {
    window.authState.profile.avatar_url = avatarUrl;
    renderMyAvatar(window.authState.profile);
  }

  closeAvatarModal();
});

// ─── Cancelar ───
document.getElementById('btn-cancel-avatar').addEventListener('click', closeAvatarModal);

// ─── Cerrar al clic fuera ───
document.getElementById('modal-avatar').addEventListener('click', function(e) {
  if (e.target.id === 'modal-avatar') closeAvatarModal();
});

// ─── Clic en avatar propio → modal ───
document.getElementById('my-avatar-wrap').addEventListener('click', openAvatarModal);

// ─── Clic en avatar pareja → toque efímero ───
document.getElementById('partner-avatar-wrap').addEventListener('click', function() {
  if (!window.authState || !window.authState.profile || !window.authState.profile.partner_id) return;
  window.realtimeModule && window.realtimeModule.sendEphemeralTouch();
  // Feedback suave en mi avatar
  var myAvatar = document.getElementById('my-avatar');
  if (myAvatar) {
    myAvatar.style.borderColor = 'rgba(196,160,232,0.5)';
    setTimeout(function() { myAvatar.style.borderColor = ''; }, 1000);
  }
});

window.avatarModule = { renderMyAvatar: renderMyAvatar, renderPartnerAvatar: renderPartnerAvatar };
