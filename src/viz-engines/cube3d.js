/*global THREE, performance, window, requestAnimationFrame*/
(function() {
  'use strict';

  angular
    .module('vizamp')
      .factory('cube3d', cube3d);

  /** @ngInject */
  function cube3d(SoundService, VizPlayService, RenderManager, ColorManager, CanvasManager, $vizProperties) {

    var vertexShader = 'precision highp float; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; attribute vec3 position; attribute vec2 uv; attribute vec3 normal; attribute vec3 translate; attribute float scale; attribute vec3 color; varying vec2 vUv; varying vec3 vColor; void main() { vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 ); mvPosition.xyz += position * scale; vUv = uv; vColor = color; gl_Position = projectionMatrix * mvPosition; }';
    var fragmentShader = 'precision highp float; uniform sampler2D map; varying vec2 vUv; varying vec3 vColor; void main() { vec4 diffuseColor = texture2D( map, vUv ); gl_FragColor = vec4( diffuseColor.xyz * vColor, diffuseColor.w ); if ( diffuseColor.w < 0.5 ) discard; }';

    var
      playing = false,

      canvas, camera, scene, renderer,
      geometry, material, mesh,

      viz,
      name,

      time,
      start,
      waveForm = 1,
      colorForm = 1,
      colorformSoundVector,
      waveformSoundVector,
      waveformSoundByte,
      colorformSoundByte,

      translate,
      translateArray,
      scale,
      scaleArray,
      colors,
      colorsArray,

      height,
      width,

      grain = 128,

      scaleA = 10,
      scaleB = 10,
      scaleC = 5,
      scaleD = 100
      ;

    var properties = [
      {
        key: 'textureFile',
        title: 'Texture File',
        description: 'Upload a texture file to render the viz',
        inputType: 'file',
        fileTypes: 'image/*',
        script: true,
        value: null,
        "default": "",
        scriptable: false,
      },
      {
        key: 'texture',
        title: 'Texture',
        description: 'Which texture is used to render the viz',
        inputType: 'select',
        options: RenderManager.getDefaultTextures(),
        combo: 'e',
        action: 'cycle',
        value: null,
        "default": "",
        scriptable: false,
      }];

    $vizProperties.include(properties, ['common', 'threeJs', 'canvasFilter']);

    function init() {
      setCanvas(CanvasManager.refreshCanvas());
      var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        preserveDrawingBuffer: true
      });
      setRenderer(renderer);

      camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100000 );
      camera.position.z = 100;

      scene = new THREE.Scene();

      geometry = new THREE.InstancedBufferGeometry();
      geometry.copy( new THREE.CircleBufferGeometry( 1, 6 ) );

      var particleCount = Math.pow(grain, 2);

      translateArray = new Float32Array( particleCount * 3 );
      scaleArray = new Float32Array( particleCount );
      colorsArray = new Float32Array( particleCount * 3 );


      for ( var i = 0, i3 = 0, l = (2*Math.PI)/particleCount; i < (2*Math.PI); i+=l, i3 += 3 ) {
        translateArray[ i3 + 0 ] = Math.sin(i) * 1.5;
        translateArray[ i3 + 1 ] = Math.cos(i) * 1.5;
        translateArray[ i3 + 2 ] = ((i3/3%grain)/grain) * scaleD - 2;
      }

      geometry.addAttribute( "translate", new THREE.InstancedBufferAttribute( translateArray, 3, 1 ) );
      geometry.addAttribute( "scale", new THREE.InstancedBufferAttribute( scaleArray, 1, 1 ).setDynamic( true ) );
      geometry.addAttribute( "color", new THREE.InstancedBufferAttribute( colorsArray, 3, 1 ).setDynamic( true ) );

      material = new THREE.RawShaderMaterial( {
        uniforms: {
          map: { type: "t", value: new THREE.TextureLoader().load(RenderManager.spritePath(viz))}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        depthTest: true,
        depthWrite: true
      } );

      mesh = new THREE.Mesh( geometry, material );
      mesh.scale.set( 500, 500, 500 );
      scene.add( mesh );
      mesh.rotation.y = Math.PI;

      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );

      // initialise camera if required
      viz.cameraX = viz.cameraX || 0;
      viz.cameraY = viz.cameraY || 0;
      viz.cameraZ = viz.cameraZ || 0;
      viz.rotateX = viz.rotateX || 0;
      viz.rotateY = viz.rotateY || 0;
      viz.rotateZ = viz.rotateZ || 0;
      viz.pitch = viz.pitch || 0;
      viz.yaw = viz.yaw || 0;

      return true;
    }

    function animate() {
      if(playing) {
        requestAnimationFrame(animate);
        render();
      }
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

    function render() {

      VizPlayService.setVizProperty(viz);
      setCameraSate();

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
      if(!viz.freezeColorformFactor || viz.thawWaveformFactor) {
        colorformSoundByte = soundByte;
      }

      RenderManager.processTriggerUpdates(viz, td, fd, updateScript);

      viz.thawWaveformFactor = false;

      time = performance.now() * 0.0005;

      translate = geometry.getAttribute( 'translate' );
      translateArray = translate.array;

      scale = geometry.getAttribute( 'scale' );
      scaleArray = scale.array;

      colors = geometry.getAttribute( 'color' );
      colorsArray = colors.array;

      scaleA = 40 + 60 * Math.pow((Math.sin(time/8 % (2*Math.PI))+1)/2, 2);
      scaleB = scaleA / 2;
      scaleC = 10;
      scaleD = 20 + 100 * (Math.sin(time/12 % (2*Math.PI))+1)/2;

      mesh.rotation.set(
        viz.rotateX,
        viz.rotateY,
        viz.rotateZ
      );

      var color = new THREE.Color( 0xffffff );

      for (var i = 0; i < scaleArray.length; i ++) {

        if (waveformSoundByte !== undefined) {
          waveformSoundVector = waveformSoundByte[i % soundByteCount] / 128;
          waveForm = waveformSoundVector + ((1 - waveformSoundVector) * viz.waveformFactor);
        }
        else {
          waveForm = 1;
        }
        if (colorformSoundByte !== undefined) {
          colorformSoundVector = colorformSoundByte[i % soundByteCount] / 128;
          colorForm = colorformSoundVector + ((1 - colorformSoundVector) * viz.colorformFactor);
        }
        else {
          colorForm = 1;
        }

        var offset = Math.floor(i/grain),
            index = (i % grain) * grain + offset,
            i3 = index * 3;

        // todo: this section should be informed by a user composed ves script
        translateArray[ i3 + 0 ] = Math.sin(index) * 1.5 * waveForm;
        translateArray[ i3 + 1 ] = Math.cos(index) * (Math.cos(offset/time));
        translateArray[ i3 + 2 ] = ((i3/3%grain)/grain) * scaleD - 2;
        // end of scripted section

        var x = translateArray[ i3 + 0 ] + time;
        var y = translateArray[ i3 + 1 ] + time;
        var z = translateArray[ i3 + 2 ] + time;

        var scl = Math.sin( x * 2.1) + Math.cos( y * 3.2 ) + Math.sin( z * 4.3 );

        scaleArray[ index ] = scl * scaleA + scaleB;

        color.setHSL( scl / scaleC * Math.sin(time) , 1, 0.5 );

        colorsArray[ i3 ] = 0.3 + (colorForm * color.r * (Math.sin(time % (4*Math.PI)) + 1)/2) * 0.7;
        colorsArray[ i3 + 1 ] = color.g * Math.pow(colorForm, 3);
        colorsArray[ i3 + 2 ] = 0.3 + (10*colorForm * color.b * (Math.sin(time % (4*Math.PI)) + 1)/2) * 0.7;

      }

      translate.needsUpdate = true;
      scale.needsUpdate = true;
      colors.needsUpdate = true;

      renderer.render( scene, camera );

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

    function updateScript(updates){
      if (material && (!updates || updates.texture)) {
        material.uniforms.map.value = new THREE.TextureLoader().load(RenderManager.spritePath(viz));
        material.needsUpdate = true;
      }
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
      if ( init() ) {
        animate();
      }
    }

    function refresh() {
    }

    function setCanvas(playerCanvas) {
      canvas = playerCanvas;
    }

    function getCanvas() {
      return canvas;
    }

    function setRenderer(_renderer) {
      renderer = _renderer;
    }

    function onResize() {
      canvas.height = height = window.innerHeight;
      canvas.width = width = window.innerWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize( width, height );
    }

    function pause(){
      playing = false;
    }

    function resume(){
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
        name: 'Swarm',
        type: 'cube3d',
        description: '3D Colored textures moving in formation according to a scripted formula'
      }
    };
  }
})();
