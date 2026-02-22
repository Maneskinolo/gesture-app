const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gestureText = document.getElementById("gestureText");

let lastX = null;
let lastY = null;

// ===== Kamera =====
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  });

// ===== FACE DETECTION =====
const faceMesh = new FaceMesh({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(results => {
  drawResults(results);
});

// ===== HAND DETECTION =====
const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  detectGesture(results);
});

// ===== Kamera loop =====
const camera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({ image: video });
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();

// ===== Vykreslovanie =====
function drawResults(results) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      for (const point of landmarks) {
        ctx.fillStyle = "lime";
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

// ===== GESTO SWIPE =====
function detectGesture(results) {
  if (results.multiHandLandmarks) {
    const hand = results.multiHandLandmarks[0];
    const indexFinger = hand[8]; // špička ukazováka

    const x = indexFinger.x;
    const y = indexFinger.y;

    if (lastX && lastY) {
      let dx = x - lastX;
      let dy = y - lastY;

      if (Math.abs(dx) > 0.05) {
        if (dx > 0) {
          gestureText.innerText = "Gesture: Swipe Right";
        } else {
          gestureText.innerText = "Gesture: Swipe Left";
        }
      }

      if (Math.abs(dy) > 0.05) {
        if (dy > 0) {
          gestureText.innerText = "Gesture: Swipe Down";
        } else {
          gestureText.innerText = "Gesture: Swipe Up";
        }
      }
    }

    lastX = x;
    lastY = y;
  }
}
