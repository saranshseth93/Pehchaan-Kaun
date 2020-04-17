const video = document.getElementById("video");
let predictedAges = [];
$('.loader').fadeIn();
$('video').fadeOut();
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models")
]
).then(startVideo);

function startVideo() {

  var constraints = {audio: false, video: true};
var video = document.querySelector("video");

function successCallback(stream) {

video.srcObject = stream;
$('.loader').fadeOut();
  $('video').fadeIn();
  video.play();
}

function errorCallback(error) {
  console.log("navigator.getUserMedia error: ", error);
}

navigator.mediaDevices.getUserMedia(constraints)
  .then(successCallback)
  .catch(errorCallback);

}

video.addEventListener("playing", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    console.log(resizedDetections);
    const age = resizedDetections[0].age;
    const interpolatedAge = interpolateAgePredictions(age);
    const bottomRight = {
      x: resizedDetections[0].detection.box.bottomRight.x - 50,
      y: resizedDetections[0].detection.box.bottomRight.y
    };
    const bottomRight1 = {
      x: (resizedDetections[0].detection.box.bottomRight.x - 50)-10,
      y: resizedDetections[0].detection.box.bottomRight.y + 20
    };

    new faceapi.draw.DrawTextField(
      [`${faceapi.utils.round(interpolatedAge, 0)} years`],
      bottomRight
    ).draw(canvas);

    new faceapi.draw.DrawTextField(
      ['Gender: '+resizedDetections[0].gender],
      bottomRight1
    ).draw(canvas);
  }, 100);
});

function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);
  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}
