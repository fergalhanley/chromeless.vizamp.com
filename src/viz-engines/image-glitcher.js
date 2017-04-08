/*global THREE, performance, window, requestAnimationFrame, Float32Array*/
(function () {
  'use strict';

  angular
    .module('vizamp')
    .factory('imageGlitcher', imageGlitcher);

  /** @ngInject */
  function imageGlitcher(SoundService, RenderManager, CanvasManager, $config, $vizProperties) {

    var
      playing = false,
      canvas,
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

      width,
      height,
      scaledWidth,
      scaledHeight,

      texture,
      imageAspect,
      currentTexture,
      nextTextureTime
      ;

    var properties = [
      {
        key: 'textures',
        description: 'Provide textures for rendering',
        inputType: 'textures',
        value: [],
        "default": [],
        scriptable: true,
      }
    ];

    $vizProperties.include(properties, ['common', 'glfx']);

    function init() {

      canvas = CanvasManager.refreshCanvas();

      fx.canvas({
        canvas : canvas,
        preserveDrawingBuffer: true
      });

      if(viz.textures && viz.textures[0]) {
        setTexture(0, function(){
          animate();
        });
      }
      else {
        currentTexture = -1;
        nextTextureTime = null;
        loadTexture('/assets/images/cheshire.jpg', function(){
          animate();
        });
      }
    }

    function animate() {
      if (playing) {
        requestAnimationFrame(animate);
        render();
      }
    }

    function setTexture(index, cb) {
      currentTexture = index % viz.textures.length;
      nextTextureTime = new Date().getTime() + viz.textures[currentTexture].duration * 1000;
      loadTexture($config.uploadImagePath + '/' + viz.textures[currentTexture].path + '.png', cb);
    }

    // todo: preload images
    function loadTexture(imgPath, cb){
      var image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = function() {
        width = image.width;
        height = image.height;
        onResize();
        texture = canvas.texture(image);
        if(cb) cb();
      };
      image.src = imgPath;
    }

    function checkNextTexture(){
      if(nextTextureTime && nextTextureTime < new Date().getTime()) {
        setTexture(currentTexture + 1);
      }
    }

    function render() {

      checkNextTexture();

      var td = SoundService.getTimeDomainData(),
        fd = SoundService.getByteFrequencyData(),
        soundByte = viz.timeOrFrequency
          ? fd
          : td
        ;

      if(!viz.freezeWaveformFactor || viz.thawWaveformFactor) {
        waveformSoundByte = soundByte;
      }
      if(!viz.freezeColorformFactor || viz.thawWaveformFactor) {
        colorformSoundByte = soundByte;
      }

      RenderManager.processTriggerUpdates(viz, td, fd, updateScript);

      viz.thawWaveformFactor = false;

      time = performance.now() * 0.0005;

      var textureUpdate = canvas.draw(texture, scaledWidth, scaledHeight);
      var done = {};

      for (var i = 0; i < properties.length; i++) {

        switch(properties[i].key){

          case 'hexagonalPixelate_Scale' :

              if(done.hp) break; else done.hp = true;

              if(viz.hexagonalPixelate_Scale > 0) {
                textureUpdate = textureUpdate.hexagonalPixelate(
                  viz.hexagonalPixelateCenter_X || 0,
                  viz.hexagonalPixelateCenter_Y || 0,
                  viz.hexagonalPixelate_Scale);
              }
              break;

          case 'zoom' :
          case 'offsetX' :
          case 'offsetY' :
          case 'rotation' :

            if(done.tr) break; else done.tr = true;

              textureUpdate = textureUpdate.transform(
                -1 * viz.offsetX || 0 ,
                -1 * viz.offsetY || 0 ,
                viz.zoom || 1 ,
                viz.rotation || 0
              );
            break;

          case 'bgZoom' :
          case 'bgOffsetX' :
          case 'bgOffsetY' :
          case 'bgRotation' :

            if(done.btr) break; else done.btr = true;

            textureUpdate = textureUpdate.transform(
              -1 * viz.bgOffsetX || 0 ,
              -1 * viz.bgOffsetY || 0 ,
              viz.bgZoom || 1 ,
              viz.bgRotation || 0
            );
            break;

          case 'brightness' :
          case 'contrast' :

            if(done.bc) break; else done.bc = true;

            if(viz.brightness || viz.contrast) {
              textureUpdate = textureUpdate.brightnessContrast(
                viz.brightness || 0,
                viz.contrast || 0
              );
            }
            break;

          case 'hue' :
          case 'saturation' :

            if(done.hs) break; else done.hs = true;

            if(viz.hue || viz.saturation) {
              textureUpdate = textureUpdate.hueSaturation(
                viz.hue || 0,
                viz.saturation || 0
              );
            }
            break;

          case 'colorHalftone_X' :
          case 'colorHalftone_Y' :
          case 'colorHalftone_Angle' :
          case 'colorHalftone_Size' :

            if(done.cht) break; else done.cht = true;

            if(viz.colorHalftone_Size) {
              textureUpdate = textureUpdate.colorHalftone(
                viz.colorHalftone_X || 0,
                viz.colorHalftone_Y || 0,
                viz.colorHalftone_Angle || 0,
                viz.colorHalftone_Size || 0
              );
            }
            break;

          case 'triangleBlur' :
            if(viz.triangleBlur) {
              textureUpdate = textureUpdate.triangleBlur(viz.triangleBlur);
            }
            break;

          case 'fastBlur' :
            if(viz.fastBlur) {
              textureUpdate = textureUpdate.fastBlur(viz.fastBlur);
            }
            break;

          case 'unsharpMask_Radius' :
          case 'unsharpMask_Strength' :

            if(done.um) break; else done.um = true;

            if(viz.unsharpMask_Strength && viz.unsharpMask_Radius) {
              textureUpdate = textureUpdate.unsharpMask(viz.unsharpMask_Strength, viz.unsharpMask_Radius);
            }
            break;

          case 'perspective_X1' :
          case 'perspective_X2' :
          case 'perspective_X3' :
          case 'perspective_X4' :
          case 'perspective_Y1' :
          case 'perspective_Y2' :
          case 'perspective_Y3' :
          case 'perspective_Y4' :
            if(done.p) break; else done.p = true;

            var
              X1 = canvas.width/3,
              X2 = X1,
              X3 = X1 + X1,
              X4 = X1 + X1,
              Y1 = canvas.height/3,
              Y2 = Y1 + Y1,
              Y3 = Y1,
              Y4 = Y1 + Y1;

              textureUpdate = textureUpdate.perspective(
                [X1, Y1, X2, Y2, X3, Y3, X4, Y4],
                [
                  viz.perspective_X1 || X1, viz.perspective_Y1 || Y1,
                  viz.perspective_X2 || X2, viz.perspective_Y2 || Y2,
                  viz.perspective_X3 || X3, viz.perspective_Y3 || Y3,
                  viz.perspective_X4 || X4, viz.perspective_Y4 || Y4
                ]
              );
            break;

          case 'bulgePinch_X' :
          case 'bulgePinch_Y' :
          case 'bulgePinch_Radius' :
          case 'bulgePinch_Strength' :
            if(done.bp) break; else done.bp = true;

            if(viz.bulgePinch_Strength && viz.bulgePinch_Radius) {
              textureUpdate = textureUpdate.bulgePinch(
                viz.bulgePinch_X,
                viz.bulgePinch_Y,
                viz.bulgePinch_Radius,
                viz.bulgePinch_Strength
              );
            }
            break;

          case 'tiltShift_StartX' :
          case 'tiltShift_StartY' :
          case 'tiltShift_EndX' :
          case 'tiltShift_EndY' :
          case 'tiltShift_BlurRadius' :
          case 'tiltShift_GradientRadius' :
            if(done.ts) break; else done.ts = true;

            if(viz.tiltShift_BlurRadius && viz.tiltShift_GradientRadius) {
              textureUpdate = textureUpdate.tiltShift(
                viz.tiltShift_StartX ,
                viz.tiltShift_StartY ,
                viz.tiltShift_EndX ,
                viz.tiltShift_EndY ,
                viz.tiltShift_BlurRadius ,
                viz.tiltShift_GradientRadius
              );
            }
            break;

          case 'dotScreen_X' :
          case 'dotScreen_Y' :
          case 'dotScreen_Angle' :
          case 'dotScreen_Size' :
            if(done.ds) break; else done.ds = true;

            if(viz.dotScreen_Angle && viz.dotScreen_Size) {
              textureUpdate = textureUpdate.dotScreen(
                viz.dotScreen_X ,
                viz.dotScreen_Y ,
                viz.dotScreen_Angle ,
                viz.dotScreen_Size
              );
            }
            break;

          case 'edgeWork' :
            if(viz.edgeWork)
              textureUpdate = textureUpdate.edgeWork(viz.edgeWork);
            break;

          case 'lensBlur_Radius' :
          case 'lensBlur_Brightness' :
          case 'lensBlur_Angle' :
            if(done.lb) break; else done.lb = true;

            if(viz.lensBlur_Radius && viz.lensBlur_Brightness) {
              textureUpdate = textureUpdate.lensBlur(
                viz.lensBlur_Radius ,
                viz.lensBlur_Brightness ,
                viz.lensBlur_Angle
              );
            }
            break;

          case 'erode' :
            if(viz.erode)
              textureUpdate = textureUpdate.erode(viz.erode);
            break;

          case 'dilate' :
            if(viz.dilate)
              textureUpdate = textureUpdate.dilate(viz.dilate);
            break;

          case 'zoomBlur_X' :
          case 'zoomBlur_Y' :
          case 'zoomBlur_Strength' :
            if(done.zb) break; else done.zb = true;

            if(viz.zoomBlur_Strength) {
              textureUpdate = textureUpdate.zoomBlur(
                viz.zoomBlur_X ,
                viz.zoomBlur_Y ,
                viz.zoomBlur_Strength
              );
            }
            break;

          case 'noise' :
            if(viz.noise) {
              textureUpdate = textureUpdate.noise(viz.noise);
            }
            break;

          case 'denoise' :
            if(viz.denoise) {
              textureUpdate = textureUpdate.denoise(viz.denoise);
            }
            break;

          case 'swirl_X' :
          case 'swirl_Y' :
          case 'swirl_Radius' :
          case 'swirl_Angle' :

            if(done.sw) break; else done.sw = true;

            if(viz.swirl_Radius && viz.swirl_Angle) {
              textureUpdate = textureUpdate.swirl(
                viz.swirl_X ,
                viz.swirl_Y ,
                viz.swirl_Radius ,
                viz.swirl_Angle
              );
            }
            break;

          case 'ink' :
            if(viz.ink) {
              textureUpdate = textureUpdate.ink(viz.ink);
            }
            break;


          case 'vignette_Size' :
          case 'vignette_Amount' :

            if(done.v) break; else done.v = true;

            if(viz.vignette_Size && viz.vignette_Amount) {
              textureUpdate = textureUpdate.vignette(viz.vignette_Size , viz.vignette_Amount);
            }

            break;

          case 'sepia' :
            if(viz.sepia) {
              textureUpdate = textureUpdate.sepia(viz.sepia);
            }
            break;

          case 'posterize' :
            if(viz.posterize) {
              textureUpdate = textureUpdate.posterize(viz.posterize);
            }
            break;

          case 'kaleidoscope_Sides' :
          case 'kaleidoscope_Angle' :
          case 'kaleidoscope_Angle2' :

            if(done.kl) break; else done.kl = true;
            if(viz.kaleidoscope_Sides) {
              textureUpdate = textureUpdate.kaleidoscope(
                viz.kaleidoscope_Sides ,
                viz.kaleidoscope_Angle ,
                viz.kaleidoscope_Angle2
              );
            }
            break;

          case 'ripple_X' :
          case 'ripple_Y' :
          case 'ripple_Angle' :
          case 'ripple_Amplitude' :

            if(done.rp) break; else done.rp = true;

            if(viz.ripple_Amplitude) {
              textureUpdate = textureUpdate.ripple(
                viz.ripple_X,
                viz.ripple_Y,
                viz.ripple_Angle,
                viz.ripple_Amplitude
              );
            }
            break;


          case 'colorDisplacement_Angle' :
          case 'colorDisplacement_Amplitude' :

            if(done.cd) break; else done.cd = true;

            if(viz.colorDisplacement_Amplitude) {
              textureUpdate = textureUpdate.colorDisplacement(
                viz.colorDisplacement_Angle ,
                viz.colorDisplacement_Amplitude
              );
            }
            break;

          case 'color_Red' :
          case 'color_Green' :
          case 'color_Blue' :
          case 'color_Alpha' :

            if(done.col) break; else done.col = true;

            if(viz.color_Red || viz.color_Green || viz.color_Blue || viz.color_Alpha) {
              textureUpdate = textureUpdate.color(
                viz.color_Alpha,
                viz.color_Red,
                viz.color_Green,
                viz.color_Blue
              );
            }
            break;


          case 'sobel_Primary' :
          case 'sobel_Secondary' :
          case 'sobel_Tertiary' :
          case 'sobel_RedLine' :
          case 'sobel_GreenLine' :
          case 'sobel_BlueLine' :
          case 'sobel_AlphaLine' :
          case 'sobel_RedArea' :
          case 'sobel_GreenArea' :
          case 'sobel_BlueArea' :
          case 'sobel_AlphaArea' :

            if(done.col) break; else done.col = true;

            if(viz.sobel_Primary ||
              viz.sobel_Secondary ||
              viz.sobel_Tertiary ||
              viz.sobel_RedLine ||
              viz.sobel_GreenLine ||
              viz.sobel_BlueLine ||
              viz.sobel_AlphaLine ||
              viz.sobel_RedArea ||
              viz.sobel_GreenArea ||
              viz.sobel_BlueArea ||
              viz.sobel_AlphaArea) {

              textureUpdate = textureUpdate.sobel(
                viz.sobel_Primary,
                viz.sobel_Secondary,
                viz.sobel_Tertiary,
                viz.sobel_RedLine,
                viz.sobel_GreenLine,
                viz.sobel_BlueLine,
                viz.sobel_AlphaLine,
                viz.sobel_RedArea,
                viz.sobel_GreenArea,
                viz.sobel_BlueArea,
                viz.sobel_AlphaArea
              );
            }
            break;
        }
      }
      textureUpdate.update();
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
        //ColorManager.clearFilter(Zviz);
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
      setTimeout(function(){
        canvas.style.filter = canvas.style.webkitFilter = '';
      });
    }

    function refresh() {
    }

    function setCanvas(playerCanvas) {
      canvas = playerCanvas;
    }

    function getCanvas() {
      return canvas;
    }

    function setRenderer() {
      // stub
    }

    function onResize() {
      if(width/height > window.innerWidth/window.innerHeight) { // image is wider
        scaledHeight = window.innerHeight;
        scaledWidth = scaledHeight * width/height;
        if(scaledWidth && scaledHeight) {
          canvas.style.width = scaledWidth + 'px';
          canvas.style.height = scaledHeight + 'px';
          canvas.style.top = '0';
          canvas.style.left = -(scaledWidth - window.innerWidth) / 2;
        }
      }
      else { // image is narrower
        scaledWidth = window.innerWidth;
        scaledHeight = scaledWidth * height/width;
        if(scaledWidth && scaledHeight) {
          canvas.style.width = scaledWidth + 'px';
          canvas.style.height = scaledHeight + 'px';
          canvas.style.left = '0';
          canvas.style.top = -(scaledHeight - window.innerHeight) / 2;
        }
      }
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
      is3D: undefined,
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
      setTexture: setTexture,
      details: {
        name: 'Image Player',
        type: 'imageGlitcher',
        description: 'Present images and apply affects to them'
      }
    };
  }
})();
