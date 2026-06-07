// ─── Project C: Multi-tool Image Playground ───────────────────────────

let W = 640, H = 480;
let brushSize = 30;
let brushOpacity = 100;
let brushHardness = 100;
let isColor = true;
let isBlurColor = true;
let currentTool = 'blur';
let imgLoaded = false;
let originalImageData = null;
let flowers = [];
let cnv;


// Filter Brush
let filterType = 'invert';
let strokeSnapshot = null;

// Color Adjustment sliders
let colorHue = 0;
let colorSat = 0;
let colorExp = 0;
let colorContrast = 0;

let colorBaseImageData = null;  // snapshot do canvas ao entrar no Color Adjustment
let colorAdjustPending = false;
let applyColorAdjustment;
let scheduleColorAdjustment;

new p5(function(p) {

  p.setup = function() {
    cnv = p.createCanvas(W, H);
    p.drawingContext.canvas.getContext('2d', { willReadFrequently: true });
    cnv.parent('dropzone');
    cnv.elt.onmousedown = null;
    cnv.elt.onmousemove = null;
    cnv.elt.onmouseup = null;
    p.background('#e8e0f7');
    p.noLoop();
    // Expose drawing context globally for tool select
    window.p5DrawingContext = p.drawingContext;
    window.p5Instance = p;
  };

  p.draw = function() {};

  function resizeCanvasToImage(img) {
    const MAX_W = 700;
    const MAX_H = 500;
    let scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
    W = Math.floor(img.width * scale);
    H = Math.floor(img.height * scale);
    p.resizeCanvas(W, H);
  }

  function getCanvasMouse() {
    let canvasX = (p.mouseX / cnv.elt.offsetWidth) * W;
    let canvasY = (p.mouseY / cnv.elt.offsetHeight) * H;
    return {
      x: Math.round(Math.max(0, Math.min(W - 1, canvasX))),
      y: Math.round(Math.max(0, Math.min(H - 1, canvasY)))
    };
  }

  function isMouseOnCanvas() {
    let rect = cnv.elt.getBoundingClientRect();
    let mx = p.winMouseX || p.mouseX + rect.left;
    let my = p.winMouseY || p.mouseY + rect.top;
    return mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom;
  }

  function hardnessFactor(distance, radius) {
    if (brushHardness >= 100) return 1;
    let h = brushHardness / 100;
    let t = distance / radius;
    if (t <= h) return 1;
    if (t >= 1) return 0;
    return 1 - (t - h) / (1 - h);
  }

  // ── Eraser: restore original pixels ─────────────────────
  function erasePixels(cx, cy) {
    if (!imgLoaded || !originalImageData) return;
    let src = new Uint8ClampedArray(originalImageData.data);
    let dst = p.drawingContext.getImageData(0, 0, W, H);
    let dstPx = dst.data;
    let r = brushSize;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > r) continue;
        let tx = cx + dx, ty = cy + dy;
        if (tx < 0 || tx >= W || ty < 0 || ty >= H) continue;
        let hf = hardnessFactor(dist, r);
        if (hf <= 0) continue;

        let si = 4*(ty*W + tx);
        let a = (brushOpacity / 100) * hf;

        dstPx[si]   = dstPx[si]   * (1-a) + src[si]   * a;
        dstPx[si+1] = dstPx[si+1] * (1-a) + src[si+1] * a;
        dstPx[si+2] = dstPx[si+2] * (1-a) + src[si+2] * a;
      }
    }

    p.drawingContext.putImageData(dst, 0, 0);
  }

  // ── Color Adjustment ────────────────────────────────────
  scheduleColorAdjustment = function() {
    if (!colorAdjustPending) {
      colorAdjustPending = true;
      requestAnimationFrame(() => {
        colorAdjustPending = false;
        if (typeof applyColorAdjustment === 'function') {
          applyColorAdjustment();
        }
      });
    }
  };

  applyColorAdjustment = function() {
    if (!imgLoaded) return;
    // Use the snapshot taken when entering color mode, or original as fallback
    let base = colorBaseImageData || originalImageData;
    if (!base) return;

    let src = new Uint8ClampedArray(base.data);
    let dst = p.drawingContext.createImageData(W, H);
    let dstPx = dst.data;

    let hueShift = colorHue;
    let satMultiplier = 1 + (colorSat / 100);
    let expMultiplier = 1 + (colorExp / 100);
    let contrastFactor = (100 + colorContrast) / 100;
    contrastFactor = contrastFactor * contrastFactor;

    for (let i = 0; i < src.length; i += 4) {
      let r = src[i] / 255;
      let g = src[i+1] / 255;
      let b = src[i+2] / 255;

      if (hueShift !== 0) {
        let hsl = rgbToHsl(r, g, b);
        hsl.h = (hsl.h + hueShift / 360) % 1;
        if (hsl.h < 0) hsl.h += 1;
        let rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        r = rgb.r; g = rgb.g; b = rgb.b;
      }

      if (colorSat !== 0) {
        let hsl = rgbToHsl(r, g, b);
        hsl.s = Math.max(0, Math.min(1, hsl.s * satMultiplier));
        let rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        r = rgb.r; g = rgb.g; b = rgb.b;
      }

      if (colorExp !== 0) {
        let hsl = rgbToHsl(r, g, b);
        hsl.l = Math.max(0, Math.min(1, hsl.l * expMultiplier));
        let rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        r = rgb.r; g = rgb.g; b = rgb.b;
      }

      if (colorContrast !== 0) {
        let hsl = rgbToHsl(r, g, b);
        hsl.l = ((hsl.l - 0.5) * contrastFactor) + 0.5;
        hsl.l = Math.max(0, Math.min(1, hsl.l));
        let rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        r = rgb.r; g = rgb.g; b = rgb.b;
      }

      dstPx[i]   = Math.round(r * 255);
      dstPx[i+1] = Math.round(g * 255);
      dstPx[i+2] = Math.round(b * 255);
      dstPx[i+3] = src[i+3];
    }

    p.drawingContext.putImageData(dst, 0, 0);
  };

  // ── HSL helpers ─────────────────────────────────────────
  function rgbToHsl(r, g, b) {
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r, g, b };
  }

  // ── Filter Brush ────────────────────────────────────────
  function applyFilterBrush() {
    if (!strokeSnapshot) return;
    let src = new Uint8ClampedArray(strokeSnapshot.data);
    let dst = p.drawingContext.getImageData(0, 0, W, H);
    let dstPx = dst.data;
    let r = brushSize;
    let pos = getCanvasMouse();

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > r) continue;
        let tx = pos.x + dx, ty = pos.y + dy;
        if (tx < 0 || tx >= W || ty < 0 || ty >= H) continue;

        let si = 4*(ty*W + tx);
        let rVal = src[si], gVal = src[si+1], bVal = src[si+2];
        let fr = rVal, fg = gVal, fb = bVal;

        if (filterType === 'invert') {
          fr = 255 - rVal; fg = 255 - gVal; fb = 255 - bVal;
        } else if (filterType === 'sepia') {
          fr = Math.min(255, rVal * 0.393 + gVal * 0.769 + bVal * 0.189);
          fg = Math.min(255, rVal * 0.349 + gVal * 0.686 + bVal * 0.168);
          fb = Math.min(255, rVal * 0.272 + gVal * 0.534 + bVal * 0.131);
        } else if (filterType === 'bw') {
          let gray = 0.299*rVal + 0.587*gVal + 0.114*bVal;
          fr = fg = fb = gray;
        }

        dstPx[si]   = fr;
        dstPx[si+1] = fg;
        dstPx[si+2] = fb;
      }
    }
    p.drawingContext.putImageData(dst, 0, 0);
  }

  let lastFlowerTime = 0;
  // ── Flower Brush ────────────────────────────────────────
  function handleFlowerBrush() {
    // Throttle: add flower every ~80ms during drag to avoid flooding
    if (p.millis() - lastFlowerTime > 80) {
      let pos = getCanvasMouse();
      let sz = brushSize * 0.8;
      flowers.push({ x: pos.x, y: pos.y, size: sz, rot: p.random(p.TWO_PI) });
      drawViolet(p, pos.x, pos.y, sz, flowers[flowers.length-1].rot);
      lastFlowerTime = p.millis();
    }
  }


  // ── Mouse ──────────────────────────────────────────────
  function handleMouse() {
    if (!imgLoaded) return;
    if (!isMouseOnCanvas()) return;
    if (currentTool === 'noise')    distort();
    else if (currentTool === 'blur') blurAt();
    else if (currentTool === 'erase') erasePixels(getCanvasMouse().x, getCanvasMouse().y);
    else if (currentTool === 'filter') applyFilterBrush();
    else if (currentTool === 'flower') handleFlowerBrush();
  }

  p.mouseDragged = function() {
    if (['color'].includes(currentTool)) return false;
    if (currentTool === 'flower') handleFlowerBrush();
    else handleMouse();
    return false;
  };

  p.mousePressed = function() {
    if (!isMouseOnCanvas()) return;
    if (['filter'].includes(currentTool) && imgLoaded) {
      strokeSnapshot = p.drawingContext.getImageData(0, 0, W, H);
    }
    handleMouse();

    if (currentTool === 'flower' && imgLoaded && isMouseOnCanvas()) {
      let pos = getCanvasMouse();
      let sz = brushSize * 0.8;
      flowers.push({ x: pos.x, y: pos.y, size: sz, rot: p.random(p.TWO_PI) });
      drawViolet(p, pos.x, pos.y, sz, flowers[flowers.length-1].rot);
    }
  };

  p.mouseReleased = function() {
    strokeSnapshot = null;
  };

  // ── Noise Brush ─────────────────────────────────────────
  function distort() {
    let pos = getCanvasMouse();
    let id = p.drawingContext.getImageData(0, 0, W, H);
    let px = id.data;
    let r = brushSize;
    let half = Math.max(1, Math.floor(r / 2));
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > r) continue;
        let tx = pos.x + dx, ty = pos.y + dy;
        if (tx < 0 || tx >= W || ty < 0 || ty >= H) continue;
        let hf = hardnessFactor(dist, r);
        if (hf <= 0) continue;
        let sx = Math.min(W-1, Math.max(0, tx + Math.floor((Math.random()*2-1)*half)));
        let sy = Math.min(H-1, Math.max(0, ty + Math.floor((Math.random()*2-1)*half)));
        let si = 4*(sy*W + sx);
        let di = 4*(ty*W + tx);
        let red = px[si], green = px[si+1], blue = px[si+2];
        if (!isColor) {
          let gray = 0.299*red + 0.587*green + 0.114*blue;
          red = green = blue = gray;
        }
        let a = (brushOpacity / 100) * hf;
        px[di]   = px[di]   * (1-a) + red   * a;
        px[di+1] = px[di+1] * (1-a) + green * a;
        px[di+2] = px[di+2] * (1-a) + blue  * a;
      }
    }
    p.drawingContext.putImageData(id, 0, 0);
  }

  // ── Blur Brush ──────────────────────────────────────────
  function blurAt() {
    let pos = getCanvasMouse();
    let id = p.drawingContext.getImageData(0, 0, W, H);
    let px = id.data;
    let r = brushSize;
    let kernelSize = Math.max(2, Math.floor(r / 4));
    let original = new Uint8ClampedArray(px);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > r) continue;
        let tx = pos.x + dx, ty = pos.y + dy;
        if (tx < 0 || tx >= W || ty < 0 || ty >= H) continue;
        let hf = hardnessFactor(dist, r);
        if (hf <= 0) continue;
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let ky = -kernelSize; ky <= kernelSize; ky++) {
          for (let kx = -kernelSize; kx <= kernelSize; kx++) {
            let sx = Math.min(W-1, Math.max(0, tx + kx));
            let sy = Math.min(H-1, Math.max(0, ty + ky));
            let si = 4*(sy*W + sx);
            sumR += original[si];
            sumG += original[si+1];
            sumB += original[si+2];
            count++;
          }
        }
        let avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
        if (!isBlurColor) {
          let gray = 0.299*avgR + 0.587*avgG + 0.114*avgB;
          avgR = avgG = avgB = gray;
        }
        let di = 4*(ty*W + tx);
        let a = (brushOpacity / 100) * hf;
        px[di]   = original[di]   * (1-a) + avgR * a;
        px[di+1] = original[di+1] * (1-a) + avgG * a;
        px[di+2] = original[di+2] * (1-a) + avgB * a;
      }
    }
    p.drawingContext.putImageData(id, 0, 0);
  }

  // ── Redraw canvas ────────
  function redrawAll() {
    if (!imgLoaded || !originalImageData) return;
    p.drawingContext.putImageData(originalImageData, 0, 0);
    for (let f of flowers) drawViolet(p, f.x, f.y, f.size, f.rot);
  }

  // ── Image loading ───────────────────────────────────────
  function loadImg(file) {
    const url = URL.createObjectURL(file);
    const native = new Image();
    native.onload = function() {
      resizeCanvasToImage(native);
      let scale = Math.min(W / native.width, H / native.height);
      let w = native.width * scale;
      let h = native.height * scale;
      let x = (W - w) / 2;
      let y = (H - h) / 2;
      p.drawingContext.fillStyle = '#e8e0f7';
      p.drawingContext.fillRect(0, 0, W, H);
      p.drawingContext.drawImage(native, x, y, w, h);
      URL.revokeObjectURL(url);
      imgLoaded = true;
      flowers = [];
      colorHue = 0; colorSat = 0; colorExp = 0; colorContrast = 0;
      colorBaseImageData = null;
      buildToggles();
      originalImageData = p.drawingContext.getImageData(0, 0, W, H);
      document.getElementById('overlay').style.display = 'none';
      document.getElementById('dropzone').classList.add('has-image');
    };
    native.src = url;
  }

  window.resetImage = function() {
    if (!imgLoaded || !originalImageData) return;
    p.drawingContext.putImageData(originalImageData, 0, 0);
    flowers = [];
    colorHue = 0; colorSat = 0; colorExp = 0; colorContrast = 0;
    colorBaseImageData = null;
    buildToggles();
  };

  window.saveImage = function() {
    if (!imgLoaded) return;
    let tempData = p.drawingContext.getImageData(0, 0, W, H);
    for (let f of flowers) drawViolet(p, f.x, f.y, f.size, f.rot);
    p.saveCanvas('edited-image', 'png');
    p.drawingContext.putImageData(tempData, 0, 0);
  };

  window.triggerNewImage = function() {
    document.getElementById('newImageInput').click();
  };

  document.getElementById('fileBtn').onclick = () =>
    document.getElementById('fileInput').click();
  document.getElementById('fileInput').onchange = e => {
    if (e.target.files[0]) loadImg(e.target.files[0]);
  };
  document.getElementById('newImageInput').onchange = e => {
    if (e.target.files[0]) loadImg(e.target.files[0]);
  };

  const dz = document.getElementById('dropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = '#7b5ea7'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = '#7b5ea7'; });
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.style.borderColor = '#7b5ea7';
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadImg(f);
  });

});

// ── Draw violet ────────────────────────────────────────────
function drawViolet(p, x, y, sz, rot = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(rot);
  p.fill(120, 100, 220, 230);
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    p.push();
    p.rotate(i * p.TWO_PI / 5);
    p.ellipse(0, -sz * 0.55, sz * 0.45, sz * 0.8);
    p.pop();
  }
  p.fill(160, 140, 240, 220);
  p.circle(0, 0, sz * 0.45);
  p.fill(255, 255, 255, 200);
  p.circle(0, 0, sz * 0.2);
  p.pop();
}

// ── GUI ────────────────────────────────────────────────────
function buildToggles() {
  const container = document.getElementById('dynamicToggles');
  container.innerHTML = '';

  if (currentTool === 'noise') {
    const row = document.createElement('div');
    row.className = 'toggle-row';
    row.innerHTML = `
      <span>B&amp;W</span>
      <label class="switch">
        <input type="checkbox" id="colorToggle" ${isColor ? 'checked' : ''} />
        <span class="slider-sw"></span>
      </label>
      <span>Color</span>
    `;
    container.appendChild(row);
    document.getElementById('colorToggle').addEventListener('change', function() {
      isColor = this.checked;
    });
  }

  if (currentTool === 'blur') {
    const row = document.createElement('div');
    row.className = 'toggle-row';
    row.innerHTML = `
      <span>B&amp;W</span>
      <label class="switch">
        <input type="checkbox" id="blurColorToggle" ${isBlurColor ? 'checked' : ''} />
        <span class="slider-sw"></span>
      </label>
      <span>Color</span>
    `;
    container.appendChild(row);
    document.getElementById('blurColorToggle').addEventListener('change', function() {
      isBlurColor = this.checked;
    });
  }

  if (currentTool === 'flower') {
  }

  if (currentTool === 'color') {
    const div = document.createElement('div');
    div.className = 'color-slider-group';
    div.innerHTML = `
      <label>Hue: <span id="hueVal">${colorHue}</span>°
        <input type="range" id="hueSlider" min="-180" max="180" value="${colorHue}" />
      </label>
      <label>Sat: <span id="satVal">${colorSat}</span>%
        <input type="range" id="satSlider" min="-100" max="100" value="${colorSat}" />
      </label>
      <label>Exp: <span id="expVal">${colorExp}</span>%
        <input type="range" id="expSlider" min="-100" max="100" value="${colorExp}" />
      </label>
      <label>Contrast: <span id="contrastVal">${colorContrast}</span>%
        <input type="range" id="contrastSlider" min="-100" max="100" value="${colorContrast}" />
      </label>
    `;
    container.appendChild(div);

    function onHueChange() {
      colorHue = parseInt(this.value);
      document.getElementById('hueVal').textContent = colorHue;
      if (typeof scheduleColorAdjustment === 'function') scheduleColorAdjustment();
    }
    function onSatChange() {
      colorSat = parseInt(this.value);
      document.getElementById('satVal').textContent = colorSat;
      if (typeof scheduleColorAdjustment === 'function') scheduleColorAdjustment();
    }
    function onExpChange() {
      colorExp = parseInt(this.value);
      document.getElementById('expVal').textContent = colorExp;
      if (typeof scheduleColorAdjustment === 'function') scheduleColorAdjustment();
    }
    function onContrastChange() {
      colorContrast = parseInt(this.value);
      document.getElementById('contrastVal').textContent = colorContrast;
      if (typeof scheduleColorAdjustment === 'function') scheduleColorAdjustment();
    }

    const hueSlider = document.getElementById('hueSlider');
    const satSlider = document.getElementById('satSlider');
    const expSlider = document.getElementById('expSlider');
    const contrastSlider = document.getElementById('contrastSlider');

    hueSlider.addEventListener('input', onHueChange);
    satSlider.addEventListener('input', onSatChange);
    expSlider.addEventListener('input', onExpChange);
    contrastSlider.addEventListener('input', onContrastChange);

    [hueSlider, satSlider, expSlider, contrastSlider].forEach(slider => {
      slider.addEventListener('mousedown', e => e.stopPropagation());
      slider.addEventListener('touchstart', e => e.stopPropagation());
    });
  }

  if (currentTool === 'filter') {
    const div = document.createElement('div');
    div.className = 'radio-group';
    div.innerHTML = `
      <label><input type="radio" name="filterType" value="invert" ${filterType==='invert'?'checked':''} /> Invert</label>
      <label><input type="radio" name="filterType" value="sepia" ${filterType==='sepia'?'checked':''} /> Sepia</label>
      <label><input type="radio" name="filterType" value="bw" ${filterType==='bw'?'checked':''} /> Black &amp; White</label>
    `;
    container.appendChild(div);
    document.querySelectorAll('input[name="filterType"]').forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) filterType = this.value;
      });
    });
  }
}

function updateSlidersVisibility() {
  const sizeLabel = document.getElementById('sizeLabel');
  const opacityLabel = document.getElementById('opacityLabel');
  const hardnessLabel = document.getElementById('hardnessLabel');

  if (currentTool === 'flower') {
    sizeLabel.style.display = 'flex';
    opacityLabel.style.display = 'none';
    hardnessLabel.style.display = 'none';
  } else if (currentTool === 'color') {
    sizeLabel.style.display = 'none';
    opacityLabel.style.display = 'none';
    hardnessLabel.style.display = 'none';
  } else if (currentTool === 'filter') {
    sizeLabel.style.display = 'flex';
    opacityLabel.style.display = 'none';
    hardnessLabel.style.display = 'none';
  } else {
    sizeLabel.style.display = 'flex';
    opacityLabel.style.display = 'flex';
    hardnessLabel.style.display = 'flex';
  }
}

// ── Prevent p5 from intercepting sidebar events ───────────
document.getElementById('sidebar').addEventListener('mousedown', e => e.stopPropagation());
document.getElementById('sidebar').addEventListener('mouseup', e => e.stopPropagation());
document.getElementById('sidebar').addEventListener('mousemove', e => e.stopPropagation());
document.getElementById('sidebar').addEventListener('touchstart', e => e.stopPropagation());
document.getElementById('sidebar').addEventListener('touchmove', e => e.stopPropagation());
document.getElementById('sidebar').addEventListener('touchend', e => e.stopPropagation());

// ── Sliders (general) ────────────────────────────────────
document.getElementById('brushSlider').addEventListener('input', function() {
  brushSize = parseInt(this.value);
  document.getElementById('sizeVal').textContent = brushSize;
});
document.getElementById('opacitySlider').addEventListener('input', function() {
  brushOpacity = parseInt(this.value);
  document.getElementById('opacityVal').textContent = brushOpacity;
});
document.getElementById('hardnessSlider').addEventListener('input', function() {
  brushHardness = parseInt(this.value);
  document.getElementById('hardnessVal').textContent = brushHardness;
});

document.querySelectorAll('#slidersContainer input[type=range]').forEach(slider => {
  slider.addEventListener('mousedown', e => e.stopPropagation());
  slider.addEventListener('touchstart', e => e.stopPropagation());
});

// ── Tool select ───────────────────────────────────────────
document.getElementById('toolSelect').addEventListener('change', function() {
  let previousTool = currentTool;
  currentTool = this.value;
  buildToggles();
  updateSlidersVisibility();
  
  // When leaving color adjustment, clean up
  if (previousTool === 'color' && currentTool !== 'color') {
    colorBaseImageData = null;
  }
  
  if (currentTool === 'color') {
    // Take snapshot of current canvas state (preserving all previous edits)
    if (imgLoaded && window.p5DrawingContext) {
      colorBaseImageData = window.p5DrawingContext.getImageData(0, 0, W, H);
    }
    // Reset sliders to zero when entering color mode (fresh start)
    colorHue = 0; 
    colorSat = 0; 
    colorExp = 0; 
    colorContrast = 0;
    buildToggles();
    if (typeof applyColorAdjustment === 'function') {
      applyColorAdjustment();
    }
  }
});

// ── Buttons ───────────────────────────────────────────────
document.getElementById('resetBtn').addEventListener('click', () => {
  if (typeof resetImage === 'function') resetImage();
});
document.getElementById('newImageBtn').addEventListener('click', () => {
  if (typeof triggerNewImage === 'function') triggerNewImage();
});
document.getElementById('saveBtn').addEventListener('click', () => {
  if (typeof saveImage === 'function') saveImage();
});

['resetBtn', 'newImageBtn', 'saveBtn', 'toolSelect'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('mousedown', e => e.stopPropagation());
    el.addEventListener('touchstart', e => e.stopPropagation());
  }
});

// ── Init ──────────────────────────────────────────────────
buildToggles();
updateSlidersVisibility();
