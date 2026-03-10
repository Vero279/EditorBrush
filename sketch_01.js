//Mouse->image

let img;
let colorMode = true;
let brushSize = 30;

function preload() {
  img = loadImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQh1IbMLAoE3ibrK0LsEWOuKSaV9NiGqeuQSQ&s');
}

function setup() {
  createCanvas(800, 600);
  
  // Brush size slider
  let sliderLabel = createP('Brush Size:');
  sliderLabel.position(10, height + 10);
  
  let slider = createSlider(5, 100, 30, 1);
  slider.position(10, height + 40);
  slider.input(() => brushSize = slider.value());

  // Color/BW switch
  let switchLabel = createP('Color / B&W:');
  switchLabel.position(220, height + 10);

  let toggleColor = createCheckbox('Color mode', true);
  toggleColor.position(220, height + 45);
  toggleColor.changed(() => colorMode = toggleColor.checked());
  
  image(img, 0, 0, width, height);
}

function draw() {
  if (mouseIsPressed) {
    distortRegion(mouseX, mouseY, brushSize);
  }
}

function distortRegion(cx, cy, radius) {
  let half = radius / 2;
  
  loadPixels();
  
  for (let x = cx - radius; x < cx + radius; x++) {
    for (let y = cy - radius; y < cy + radius; y++) {
      let dx = x - cx;
      let dy = y - cy;
      if (dx * dx + dy * dy > radius * radius) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      // Source pixel with distortion offset
      let srcX = constrain(x + floor(random(-half, half)), 0, width - 1);
      let srcY = constrain(y + floor(random(-half, half)), 0, height - 1);

      let srcIdx = 4 * (srcY * width + srcX);
      let dstIdx = 4 * (y * width + x);

      let r = pixels[srcIdx];
      let g = pixels[srcIdx + 1];
      let b = pixels[srcIdx + 2];
      let a = pixels[srcIdx + 3];

      if (!colorMode) {
        // Desaturate to grayscale
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }

      pixels[dstIdx]     = r;
      pixels[dstIdx + 1] = g;
      pixels[dstIdx + 2] = b;
      pixels[dstIdx + 3] = a;
    }
  }
  
  updatePixels();
}