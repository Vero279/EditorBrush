// Microphone -> Text
let recognition;
let transcript = '';
let listening = false;

function setup() {
  createCanvas(400, 400);
  textSize(16);
  textWrap(WORD);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (e) => {
    transcript = '';
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript + ' ';
    }
  };
}

function draw() {
  background(220);

  // Button
  fill(listening ? color(80, 180, 100) : color(180, 80, 80));
  noStroke();
  rect(10, 10, 150, 40, 8);
  fill(255);
  textAlign(CENTER, CENTER);
  text(listening ? 'Stop' : 'Start Listening', 85, 30);

  // Transcript
  fill(0);
  textAlign(LEFT, TOP);
  text(transcript, 10, 70, width - 20, height - 80);
}

function mousePressed() {
  if (mouseX > 10 && mouseX < 160 && mouseY > 10 && mouseY < 50) {
    if (!listening) {
      recognition.start();
      listening = true;
    } else {
      recognition.stop();
      listening = false;
    }
  }
}