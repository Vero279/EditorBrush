 // ── Config ──────────────────────────────────────────────
  const W = 640, H = 480;
  let brushSize = 30;
  let isColor   = true;
  let imgLoaded = false;

  // ── p5 sketch ───────────────────────────────────────────
  new p5(function(p) {

    p.setup = function() {
      let cnv = p.createCanvas(W, H);
      cnv.parent('dropzone');
      p.background(26);
      p.noLoop();  // only redraw when needed
    };

    p.draw = function() {};  // manual control

    // Called every frame when mouse is held
    function tryDistort() {
      if (!imgLoaded) return;
      if (p.mouseX < 0 || p.mouseX >= W || p.mouseY < 0 || p.mouseY >= H) return;
      distort(Math.round(p.mouseX), Math.round(p.mouseY));
    }

    p.mouseDragged = tryDistort;
    p.mousePressed = tryDistort;

    function distort(cx, cy) {
      // Read ALL pixels from canvas
      let id = p.drawingContext.getImageData(0, 0, W, H);
      let px = id.data;
      let r  = brushSize;
      let half = Math.max(1, Math.floor(r / 2));
      let updates = [];

      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (dx*dx + dy*dy > r*r) continue;
          let tx = cx + dx;
          let ty = cy + dy;
          if (tx < 0 || tx >= W || ty < 0 || ty >= H) continue;

          // Source: random offset within brush
          let sx = Math.min(W-1, Math.max(0, tx + Math.floor((Math.random()*2-1)*half)));
          let sy = Math.min(H-1, Math.max(0, ty + Math.floor((Math.random()*2-1)*half)));

          let si =  4*(sy*W + sx);
          let di =  4*(ty*W + tx);

          let red   = px[si];
          let green = px[si+1];
          let blue  = px[si+2];
          let alpha = px[si+3];

          if (!isColor) {
            let gray = 0.299*red + 0.587*green + 0.114*blue;
            red = green = blue = gray;
          }

          updates.push(di, red, green, blue, alpha);
        }
      }

      // Write back
      for (let i = 0; i < updates.length; i += 5) {
        let idx = updates[i];
        px[idx]   = updates[i+1];
        px[idx+1] = updates[i+2];
        px[idx+2] = updates[i+3];
        px[idx+3] = updates[i+4];
      }

      p.drawingContext.putImageData(id, 0, 0);
    }

    // ── Image loading ──────────────────────────────────────
    function loadImg(file) {
      const url = URL.createObjectURL(file);
      const native = new Image();
      native.onload = function() {
        let scale = Math.min(W / native.width, H / native.height);
        let w = native.width  * scale;
        let h = native.height * scale;
        let x = (W - w) / 2;
        let y = (H - h) / 2;
        p.drawingContext.fillStyle = '#1a1a1a';
        p.drawingContext.fillRect(0, 0, W, H);
        p.drawingContext.drawImage(native, x, y, w, h);
        URL.revokeObjectURL(url);
        imgLoaded = true;
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('dropzone').classList.add('has-image');
      };
      native.src = url;  // blob URL = same origin, no CORS issue
    }

    // File input
    document.getElementById('fileBtn').onclick = () =>
      document.getElementById('fileInput').click();

    document.getElementById('fileInput').onchange = e => {
      if (e.target.files[0]) loadImg(e.target.files[0]);
    };

    // Drag & drop
    const dz = document.getElementById('dropzone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = '#4a9eff'; });
    dz.addEventListener('dragleave', () => { dz.style.borderColor = '#444'; });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.style.borderColor = '#444';
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) loadImg(f);
    });

  });

  // ── Controls ─────────────────────────────────────────────
  const slider = document.getElementById('brushSlider');
  const sizeVal = document.getElementById('sizeVal');
  slider.addEventListener('input', () => {
    brushSize = parseInt(slider.value);
    sizeVal.textContent = brushSize;
  });

  document.getElementById('colorToggle').addEventListener('change', function() {
    isColor = this.checked;
  });