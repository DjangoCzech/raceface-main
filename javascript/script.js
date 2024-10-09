const video = document.querySelector("video");
const divText = document.getElementById("divText");
const divCanvas = document.getElementById("divCanvas");
var faceDirection = "";

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("../../models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("../../models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("../../models"),
  faceapi.nets.faceExpressionNet.loadFromUri("../../models"),
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  divCanvas.append(canvas);
  //document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    //console.log(detections);
    // const landmarks = await faceapi.detectFaceLandmarks(video);
    // const nose = landmarks.getRefPointsForAlignment();
    //console.log("Pozice nosu ===>" + JSON.stringify(nose));
    //divText.innerHTML = nose[0].x;
    //console.log("Pozice nosu ===>" + JSON.stringify(nose));
    function getMeanPosition(l) {
      return l
        .map((a) => [a.x, a.y])
        .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
        .map((a) => a / l.length);
    }
    function getTop(l) {
      return l.map((a) => a.y).reduce((a, b) => Math.min(a, b));
    }

    const detectionsFace = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions();
    var eye_right = getMeanPosition(detectionsFace.landmarks.getRightEye());
    var eye_left = getMeanPosition(detectionsFace.landmarks.getLeftEye());
    var nose = getMeanPosition(detectionsFace.landmarks.getNose());
    var mouth = getTop(detectionsFace.landmarks.getMouth());
    var jaw = getTop(detectionsFace.landmarks.getJawOutline());

    //console.log(detectionsFace[480]);
    var rx = (jaw - mouth) / 480;
    //console.log(rx);

    var ry = (eye_left[0] + (eye_right[0] - eye_left[0]) / 2 - nose[0]) / 640;
    var face_val = ry.toFixed(3);
    console.log(face_val);
    if (face_val < -0.01) {
      console.log("Face is left");
      divText.innerHTML = "Díváte se vlevo";
      faceDirection = "LEFT";
    } else if (face_val >= 0.009) {
      console.log("Face is right");
      divText.innerHTML = "Díváte se vpravo";
      faceDirection = "RIGHT";
    } else {
      console.log("Face is center");
      divText.innerHTML = "Díváte se rovně";
      faceDirection = "STRAIGHT";
    }

    //console.log(ry);

    //console.log("Pozice praveho oka ===>" + JSON.stringify(eye_right));

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 300);

  async function getNose() {
    const landmarks = await faceapi.detectFaceLandmarks(video);
    const nose = landmarks.getNose();
    console.log("Pozice nosu ===>" + JSON.stringify(nose));
  }
});
