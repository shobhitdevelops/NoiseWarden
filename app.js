// ////////////////////////perlinNoise//////////////////////////////////////////////
// let vec = [];
// const num = 500;
let mapP5;
function setup() {

    mapP5 = map;
    var canvas2 = createCanvas(document.documentElement.clientWidth-17, document.documentElement.clientHeight, WEBGL)
    canvas2.parent("sinwave")
}

// const noiseScale = 0.005;

function draw() {
    angleMode(DEGREES);
    background('#2D2D2D')
    rotateX(-60)
    noFill()
    stroke(255)
    for(var i = 0; i < 50; i++){
        var r = mapP5(sin(frameCount / 2), -1, 1 ,100, 200)
        var g = mapP5(i, 0, 50, 100, 200)
        var b = mapP5(cos(frameCount), -1, 1, 200, 100)
        stroke(r,g,b)
        rotate(frameCount / 20)
        beginShape()
        for(var j = 0; j < 360; j += 60){
            var rad = i * 6;
            var x = rad * cos(j)
            var y = rad * sin(j)
            var z = sin(frameCount * 2 + i * 5) * 50
            vertex(x,y,z)
        }
        endShape(CLOSE)
    }
    angleMode(RADIANS);
}
// function mouseReleased() {
//     noiseSeed(millis());
// }
// function onScreen(vector) {
//     return vector.x >= 0 && vector.x <= width && vector.y >= 0
//         && vector.y <= height;
// }
// ////////////////////////scroll//////////////////////////////////////////////
// // var lastScrollTop = 0;
// // navbar = document.getElementById("navbar");
// // window.addEventListener("scroll", function () {
// //     var scrollTop = window.scrollY
// //         || document.documentElement.scrollTop;
// //     if (scrollTop > lastScrollTop) {
// //         navbar.style.top = "-60px";
// //     }
// //     else {
// //         navbar.style.top = "0";
// //     }
// //     lastScrollTop = scrollTop;
// // })
 // JavaScript code for geolocation and map
navigator.geolocation.getCurrentPosition(showMap);
function showMap(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const LeafletMap = L.map('map').setView([latitude, longitude], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(LeafletMap);

  L.marker([latitude, longitude], {
      icon: L.divIcon({
          className: 'custom-marker',
          html: '<i class="fas fa-map-marker-alt"></i>',
          iconSize: [30, 42],
          iconAnchor: [15, 42],
          popupAnchor: [0, -42]
      })
  }).addTo(LeafletMap).bindPopup('Selected Location').openPopup();
  
  const radius = 1000; // in meters
  L.circle([latitude, longitude], {
    color: 'red',     // Circle border color
    fillColor: 'red', // Circle fill color
    fillOpacity: 0.2,  // Opacity of the fill color
    radius: radius
}).addTo(LeafletMap);

}
 ///////////////////////////////analyzeAudio////////////////////////////////////
 const audioInput = document.getElementById("audio");
 let noise = new SimplexNoise();
 const area = document.getElementById("visualiser");
 const label = document.getElementById("label");
 audioInput.addEventListener("change", setAudio, false);
 let audio = new Audio("Still.mp3");
 function setAudio() {
   audio.pause()
   const audioFile = this.files[0];
   if(audioFile.name.includes(".mp3")) {
     const audioURL = URL.createObjectURL(audioFile);
     audio = new Audio(audioURL);
     clearScene();
     startVis()
     
   }else{
     alert("Invalid File Type!")
   }
   
 }
 
area.addEventListener('click', () => {
  console.log(audio)
  if(audio.paused) {
    audio.play()
    label.style.display = "none"
  } else {
    audio.pause()
    label.style.display = "flex"
  }
})
 
startVis()
 
function clearScene(){
  const canvas = area.firstElementChild;
  area.removeChild(canvas);
}
let MainDataArray = [];
function startVis() {
  getLocation();
  const context = new AudioContext();
  const src = context.createMediaElementSource(audio);
  const analyser = context.createAnalyser();
  src.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 512;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, (window.innerWidth-17) / 600, 0.1, 1000);
  camera.position.z = 100;
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth-17, 600);
  renderer.setClearColor("#ffffff");

  area.appendChild(renderer.domElement);
  const geometry = new THREE.IcosahedronGeometry(20,3);
  const material = new THREE.MeshLambertMaterial({
  color: "#696969",
  wireframe: true
});
   const sphere = new THREE.Mesh(geometry, material);
 
   const light = new THREE.DirectionalLight("#ffffff", 0.8);
   light.position.set(0,50,100);
   scene.add(light)
   scene.add(sphere)
 
   window.addEventListener('resize', () => {
     renderer.setSize(window.innerWidth - 17, window.innerHeight);
     camera.aspect = (window.innerWidth - 17) / window.innerHeight;
     camera.updateProjectionMatrix();
   });
 
  function render() {
    
    analyser.getByteFrequencyData(dataArray);

    const averageAmplitude = calculateAverageAmplitude(dataArray);
    const safeLevel = 40;
    const nvm = 10;
    if(averageAmplitude>safeLevel){
      material.color.set(0xff0000);
    }
    else{
      if(averageAmplitude<nvm){
        material.color.set(0x000000);
      }
      else{
        material.color.set(0x00ff00);
      }
    }
    const lowerHalf = dataArray.slice(0, (dataArray.length / 2) - 1);
    const upperHalf = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);
    const lowerMax = maxmy(lowerHalf);
    const upperAvg = avg(upperHalf);

    const lowerMaxFr = lowerMax / lowerHalf.length;
    const upperAvgFr = upperAvg / upperHalf.length;



    sphere.rotation.x += 0.001;
    sphere.rotation.y += 0.003;
    sphere.rotation.z += 0.005;

    WarpSphere(sphere, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
    requestAnimationFrame(render);
    renderer.render(scene,camera)
    }
 
  function WarpSphere(mesh, bassFr, treFr) {
    mesh.geometry.vertices.forEach(function (vertex, i) {
      var offset = mesh.geometry.parameters.radius;
      var amp = 5;
      var time = window.performance.now();
      vertex.normalize();
      var rf = 0.00001;
      var distance = (offset + bassFr) + noise.noise3D(vertex.x + time * rf * 4, vertex.y + time * rf * 6, vertex.z + time * rf * 7) * amp * treFr *2;
      vertex.multiplyScalar(distance);
    });
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeFaceNormals();
  }
  render()
}
 

function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}
 
function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + (fr * delta);
}
 
function avg(arr) {
  var total = arr.reduce(function (sum, b) { return sum + b; });
  return (total / arr.length);
}
 
function maxmy(arr) {
  return arr.reduce(function (a, b) { return Math.max(a, b); })
}
function calculateAverageAmplitude(dataArray){
  const array = Array.from(dataArray);
  const sum = array.reduce((acc, value)=> acc + value, 0);
  const average = sum / array.length;
  return average;
}

function getLocation(){
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        MainDataArray.push(locationData); // Store location data in the array
        console.log('Location:', locationData);
      },
      function (error) {
        console.error('Error getting location:', error.message);
      }
    );
  } 
  else {
    console.error('Geolocation is not supported by this browser.');
  }
}
let locationDataArray = [];
function handleAudioUpload() {
  const fileInput = document.getElementById('audio');
  const file = fileInput.files[0];

  if (file) {
    // You can access the file data here
    console.log('File Name:', file.name);
    console.log('File Size:', file.size);

    // Assume you have a function to calculate average amplitude
    const averageAmplitude = calculateAverageAmplitude(file);

    // Get the current time
    const currentTime = new Date().toLocaleString();

    // Get the location data (assuming locationDataArray is already populated)
    const currentLocation = locationDataArray[locationDataArray.length - 1];

    // Save the data to your array or perform any other actions
    const audioData = {
      fileName: file.name,
      fileSize: file.size,
      averageAmplitude: averageAmplitude,
      time: currentTime,
      location: currentLocation,
    };

    console.log('Audio Data:', audioData);
    // Add your logic to store or process the audio data as needed
  } else {
    console.error('No file selected.');

  }
}
document.getElementById('audio').addEventListener('change', () => {
  handleAudioUpload();
});