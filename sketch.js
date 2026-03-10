let recognition;
let listening = false;
let letters = [];
let falling = false;

function setup() {
  createCanvas(400, 400);
  textSize(16);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const words = e.results[i][0].transcript.trim();
        for (let ch of words) {
          if (ch !== ' ') {
            letters.push(new Letter(ch));
          }
        }
      }
    }
  };

  recognition.onend = () => {
    if (listening) recognition.start();
  };
}

function draw() {
  background(220);

  // Update and display letters
  for (let l of letters) {
    l.update();
    l.display();
  }

  // Mic button
  fill(listening ? color(80, 180, 100) : color(180, 80, 80));
  noStroke();
  rect(10, 10, 150, 40, 8);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(listening ? 'Stop Mic' : 'Start Mic', 85, 30);

  // Fall button
  fill(falling ? color(80, 120, 200) : color(50, 80, 160));
  noStroke();
  rect(170, 10, 150, 40, 8);
  fill(255);
  textAlign(CENTER, CENTER);
  text(falling ? 'Floating' : 'Drop Letters', 245, 30);
}

function mousePressed() {
  // Mic toggle
  if (mouseX > 10 && mouseX < 160 && mouseY > 10 && mouseY < 50) {
    if (!listening) {
      recognition.start();
      listening = true;
    } else {
      recognition.stop();
      listening = false;
    }
  }

  // Fall toggle
  if (mouseX > 170 && mouseX < 320 && mouseY > 10 && mouseY < 50) {
    falling = !falling;
    for (let l of letters) {
      l.setFalling(falling);
    }
  }
}

// ── Letter class ──────────────────────────────────────────────────────────────
class Letter {
  constructor(ch) {
    this.ch  = ch;
    this.x   = random(20, width - 20);
    this.y   = random(70, height - 20);
    this.vx  = random(-1, 1);
    this.vy  = random(-1, 1);
    this.col = color(random(360), 80, 60);   // HSB-style via random RGB
    this.col = color(random(50,200), random(50,150), random(150,255));
    this.size = random(14, 28);
    this.falling = false;
    this.grounded = false;
    this.gravity = 0.3;
  }

  setFalling(f) {
    if (!this.grounded) {
      this.falling = f;
      if (!f) {
        // resume floating
        this.vy = random(-1, 1);
        this.vx = random(-1, 1);
        this.grounded = false;
      }
    }
  }

  update() {
    if (this.grounded) return;

    if (this.falling) {
      this.vy += this.gravity;
      this.x  += this.vx * 0.3;
      this.y  += this.vy;

      // Ground collision
      if (this.y >= height - this.size) {
        this.y = height - this.size;
        this.vy *= -0.3;           // small bounce
        this.vx *=  0.8;
        if (abs(this.vy) < 0.5) {
          this.vy = 0;
          this.vx = 0;
          this.grounded = true;
        }
      }
    } else {
      // Floating: bounce off walls
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 10 || this.x > width - 10)  this.vx *= -1;
      if (this.y < 60 || this.y > height - 10) this.vy *= -1;
    }
  }

  display() {
    fill(this.col);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.size);
    text(this.ch, this.x, this.y);
  }
}