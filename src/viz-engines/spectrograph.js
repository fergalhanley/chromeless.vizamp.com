/*global THREE, performance, window, requestAnimationFrame, Float32Array*/
(function () {
  'use strict';

  angular
    .module('vizamp')
    .factory('spectrograph', spectrograph);

  /** @ngInject */
  function spectrograph(SoundService, VizPlayService, RenderManager, ColorManager, CanvasManager, $vizProperties) {

    var
      playing = false,

      canvas, camera, scene, renderer,
      geometry, mesh,

      viz,
      name,

      time,
      start,
      waveformSoundByte,
      colorFormArray,

      position,
      positionArray,
      color,
      colorArray,
      colorSetArray,

      height,
      width,

      worldWidth = 256,
      worldDepth = 256,
      vcount = worldWidth * worldDepth * 3,
      vcap = vcount - worldWidth * 3
      ;

    var properties = [
      {
        key: 'radius',
        title: 'Radius',
        description: 'Set the radius of each particle',
        inputType: 'range',
        min: 0.1,
        max: 10.0,
        step: 0.1,
        combo: 'r',
        action: 'scroll',
        value: null,
        "default": 1,
        scriptable: true,
      }
    ];

    $vizProperties.include(properties, ['common', 'threeJs', 'canvasFilter']);

    function init() {
      setCanvas(CanvasManager.refreshCanvas());
      var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        preserveDrawingBuffer: true
      });
      setRenderer(renderer);

      camera = new THREE.PerspectiveCamera(140, window.innerWidth / window.innerHeight, 0.1, 20000);

      scene = new THREE.Scene();

      camera.position.y = 600;

      colorArray = new Float32Array(vcount);
      colorSetArray = new Float32Array(vcount);
      colorFormArray = new Float32Array(worldDepth);

      geometry = new THREE.PlaneBufferGeometry(7500, 7500, worldWidth - 1, worldDepth - 1);
      geometry.rotateX(-Math.PI / 2);

      geometry.addAttribute( "color", new THREE.BufferAttribute( colorArray, 3, 1 ).setDynamic( true ) );

      mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: 0xf0f0f0,
        shading: THREE.FlatShading,
        vertexColors: THREE.VertexColors
      }));
      scene.add(mesh);
      mesh.rotation.y = Math.PI;

      // initialise camera if required
      viz.cameraX = viz.cameraX || 0;
      viz.cameraY = viz.cameraY || 0;
      viz.cameraZ = viz.cameraZ || 0;
      viz.rotateX = viz.rotateX || 0;
      viz.rotateY = viz.rotateY || 0;
      viz.rotateZ = viz.rotateZ || 0;
      viz.pitch = viz.pitch || 0;
      viz.yaw = viz.yaw || 0;

      animate();
    }

    function setCameraSate(){
      if(camera.fov !== viz.fov) {
        camera.fov = viz.fov;
        camera.updateProjectionMatrix();
      }
      camera.position.x += (viz.cameraX - camera.position.x) / 10;
      camera.position.y += (viz.cameraY - camera.position.y) / 10;
      camera.position.z += (viz.cameraZ - camera.position.z) / 10;
      camera.lookAt(new THREE.Vector3(
        camera.position.x + Math.sin(viz.yaw),
        camera.position.y + Math.sin(viz.pitch),
        camera.position.z + Math.cos(viz.yaw)
      ));
    }

    function animate() {
      if (playing) {
        requestAnimationFrame(animate);
        render();
      }
    }

    function render() {

      VizPlayService.setVizProperty(viz);
      var td = SoundService.getTimeDomainData(),
        fd = SoundService.getByteFrequencyData(),
        soundByte = viz.timeOrFrequency
          ? fd
          : td
        ;
      var soundByteCount = soundByte ? soundByte.length : 0;

      if(!viz.freezeWaveformFactor || viz.thawWaveformFactor) {
        waveformSoundByte = soundByte;
      }

      RenderManager.processTriggerUpdates(viz, td, fd, updateScript);

      setCameraSate();

      time = performance.now() * 0.0005;

      var i, j, s, col, l, k = 0;

      position = geometry.getAttribute('position');
      positionArray = position.array;

      color = geometry.getAttribute('color');
      colorArray = color.array;

      for (i = 0; i < positionArray.length; i+=3) {
        if (i >= vcap) {
          s = waveformSoundByte ? waveformSoundByte[(i - worldWidth * 3) % soundByteCount] : 1;
          l = Math.floor(s / 50 + 25);
          col = new THREE.Color('hsl(' + s + ', 100%, ' + l + '%)');
          positionArray[i + 1] = (s - 128) * 20 * (viz.waveformFactor - 0.9);
          colorSetArray[i] = col.r;
          colorSetArray[i + 1] = col.g;
          colorSetArray[i + 2] = col.b;
          colorArray[i] = col.r;
          colorArray[i + 1] = col.g;
          colorArray[i + 2] = col.b;
          colorFormArray[k++] = (waveformSoundByte ? waveformSoundByte[k] / 256 : 0) * viz.colorformFactor/10;
        }
        else {
          j = i + worldWidth * 3;
          positionArray[i + 1] = positionArray[j + 1] * 0.98;
          colorSetArray[i] = colorSetArray[j];
          colorSetArray[i + 1] = colorSetArray[j + 1];
          colorSetArray[i + 2] = colorSetArray[i + 2];

          colorArray[i] = colorSetArray[i] + colorFormArray[i % worldDepth];
          colorArray[i + 1] = colorArray[j + 1];
          colorArray[i + 2] = colorArray[j + 2];
        }
      }

      color.needsUpdate = true;
      position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    function play(_viz) {
      viz = _viz.properties;
      name = _viz.name;
      $vizProperties.setDefaultVizPropValues(viz, properties);
      updateScript();
      playing = true;
      reset();
      onResize();
    }

    function updateScript(updates) {
      if(!updates || updates.filter) {
        ColorManager.applyFilter(viz);
      }
    }

    function stop() {
      playing = false;
    }

    function getTitle() {
      return name;
    }

    function reset() {
      start = new Date().getTime();
      playing = true;
      init();
    }

    function refresh() {
    }

    function setCanvas(_canvas) {
      canvas = _canvas;
    }

    function setRenderer(_renderer) {
      renderer = _renderer;
    }

    function getCanvas() {
      return canvas;
    }

    function onResize() {
      canvas.height = height = window.innerHeight;
      canvas.width = width = window.innerWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    function pause() {
      playing = false;
    }

    function resume() {
      playing = true;
      animate();
    }

    function getProperties() {
      return properties;
    }

    function getVizProperties(){
      return viz;
    }

    return {
      is3D: true,
      play: play,
      stop: stop,
      reset: reset,
      pause: pause,
      getVizProperties: getVizProperties,
      resume: resume,
      refresh: refresh,
      getTitle: getTitle,
      setCanvas: setCanvas,
      setRenderer: setRenderer,
      getProperties: getProperties,
      updateScript: updateScript,
      getCanvas: getCanvas,
      onResize: onResize,
      details: {
        name: 'Spectrograph',
        type: 'spectrograph',
        description: 'A 3D plane graph of the playing music'
      }
    };
  }
})();
