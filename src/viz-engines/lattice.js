/* global window, performance  */
(function () {
  'use strict';

  angular
    .module('vizamp')
    .factory('lattice', lattice);

  /** @ngInject */
  function lattice(SoundService, VizPlayService, ColorManager, RenderManager, CanvasManager, $vizProperties) {

    var
      playing = false,

      canvas,
      ctx,

      viz,
      name,


      t = 0, _t, tP, delta = 0, _delta, deltaP, theta = 0, _theta, thetaP, w, h,

      points = 6,
      density = 6,
      spin = 4,
      breth = 4,
      curl = 2,
      colorScheme = 1,
      hue = Math.floor(Math.random() * 360), saturation, lightness,

      i, j, k, l, m,
      cx, cy, x, y, _x, _y, rads, radius, phase = false,

      colorformSoundVector,
      waveformSoundVector,
      waveformSoundByte,
      colorformSoundByte,

      draw,
      bgColorGen,

      waveForm = 1,
      colorForm = 1,
      ltime = 0, lvalue = 0.0, lcount = 0, lsample_size = 100
      ;

    var properties = [
      {
        key: 'drawMethod',
        title: 'Draw Method',
        description: 'How are the objects drawn for this viz',
        inputType: 'select',
        options: [
          'Nova',
          'Quasar',
          'Impact'
        ],
        combo: 'e',
        action: 'cycle',
        value: null,
        "default": 1,
        scriptable: true,
      },
      {
        key: 'radiusCenter',
        title: 'Draw Center',
        description: 'Determine the position from where to start drawing the viz segments',
        inputType: 'range',
        min: 1,
        max: 512,
        step: 1,
        combo: 'w',
        action: 'scroll',
        value: null,
        "default": 1,
        scriptable: true,
      }
    ];

    $vizProperties.include(properties, ['common', 'canvas2d', 'canvasFilter']);

    function latency() {
      lvalue -= ltime;
      ltime = performance.now();
      lvalue += ltime;
      if(++lcount === lsample_size) {
        lcount = lvalue = 0;
      }
    }

    function animLoop() {

      var td = SoundService.getTimeDomainData(),
        fd = SoundService.getByteFrequencyData(),
        soundByte = viz.timeOrFrequency
          ? fd
          : td
        ;
      var soundByteCount = soundByte ? soundByte.length : 0;

      RenderManager.processTriggerUpdates(viz, td, fd, updateScript);

      if(!playing) {
        return;
      }
      window.requestAnimationFrame(animLoop);
      latency();

      _t = t - viz.points * 0.002;
      t = performance.now() / 4000;
      delta = Math.sin(t);
      _delta = Math.sin(_t);
      theta = 1 - Math.abs(delta);
      _theta = 1 - Math.abs(_delta);

      if (phase !== _delta - delta > 0) {
        points = Math.floor(Math.random() * 3) + 3;
        density = Math.floor(Math.random() * 3) + 2;
        spin = Math.random() * 16 + 1;
        breth = Math.random() * 5 + 2;
        curl = Math.random() * 3 - 1.5;
        colorScheme = Math.floor(Math.random() * 3);
        phase = _delta - delta > 0;
        hue = Math.floor(Math.random() * 360);
      }
      else {

        VizPlayService.setVizProperty(viz);

        RenderManager.processTriggerUpdates(viz);

        if (!viz.freezeWaveformFactor) {
          waveformSoundByte = soundByte;
        }
        if (!viz.freezeColorformFactor) {
          colorformSoundByte = soundByte;
        }

        draw = drawMethods[viz.drawMethod];

        rads = Math.PI * 2 / points;
        radius = w / density;

        ctx.fillStyle = bgColorGen();
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';

        if (waveformSoundByte !== undefined) {
          waveformSoundVector = waveformSoundByte[k*m % soundByteCount] / 128;
          waveForm = waveformSoundVector + ((1 - waveformSoundVector) * viz.waveformFactor);
        }
        else {
          waveForm = 1;
        }
        if (colorformSoundByte !== undefined) {
          colorformSoundVector = colorformSoundByte[k*m % soundByteCount] / 128;
          colorForm = Math.abs(colorformSoundVector + ((1 - colorformSoundVector) * viz.colorformFactor));
        }
        else {
          colorForm = 1;
        }
        if(viz.thawWaveformFactor) {
          waveForm = ((10 * waveForm + colorForm) / 11);
        }

        for (i = 0; i < density + 1; i++) {
          for (j = 0; j < density; j++) {

            if (j % 2) {
              cx = w / density * i;
            }
            else {
              cx = w / density * i + (w / density / 2);
            }
            cy = w / density * j;

            for (k = 0; k < points; k++) {

              for (m = 0; m < viz.segments; m++) {

                deltaP = _delta + ((delta - _delta) / viz.segments * m);
                thetaP = _theta + ((theta - theta) / viz.segments * m);
                tP = _t + ((t - _t) / viz.segments * m);

                x = cx + Math.sin(rads * k + deltaP * curl) * deltaP * radius;
                y = cy + Math.cos(rads * k + deltaP * curl) * deltaP * radius;

                saturation = 100 + 100 * colorForm;
                lightness = (100 * colorForm) / 2;

                switch (colorScheme) {
                  case 0 :
                    ctx.strokeStyle = 'hsla(' + (hue + k * 20) + ',' + saturation + '%,' + lightness + '%,0.2)';
                    break;
                  case 1 :
                    ctx.strokeStyle = 'hsla(' + (hue + (180 * ((k % 2) + 1)) * deltaP) + ',' + saturation + '%,' + lightness + '%,0.2)';
                    break;
                  case 2 :
                    ctx.strokeStyle = 'hsla(' + (hue + (60 * (k % 3)) * thetaP) + ',' + saturation + '%,' + lightness + '%,0.2)';
                    break;
                  case 3 :
                    ctx.strokeStyle = 'hsla(' + (x + y) % 360 + ',' + saturation + '%,' + lightness + '%,0.2)';
                    break;
                  case 4 :
                    ctx.strokeStyle = 'hsla(' + (hue + Math.pow(k * deltaP, 3)) + ',' + saturation + '%,' + lightness + '%,0.2)';
                    break;
                }
                draw();
              }
            }
          }
        }
      }
      if(viz.shiftFilter) {
        RenderManager.shiftFilter(ctx, viz.shiftFilter);
      }
    }

    var drawMethods = [
      function() {
        ctx.beginPath();
        for (l = 0; l <= points; l++) {

          _x = x + Math.sin(rads * l + spin * tP) * thetaP * radius / breth * (j % 2 + 1) * viz.zoomFactor;
          _y = y + Math.cos(rads * l + spin * tP) * thetaP * radius / breth * (j % 2 + 1) * viz.zoomFactor;

          if (!l) {
            ctx.moveTo(_x, _y);
          }
          else {
            ctx.lineTo(_x, _y);
            ctx.stroke();
          }
        }
        ctx.closePath();
        ctx.fill();
      },
      function() {
        ctx.beginPath();
        for (l = 0; l <= points*2; l++) {

          _x = x + Math.sin(rads * l + spin * tP) * thetaP * (radius * (l % 2 ? viz.radiusCenter : 1)) / breth * (j % 2 + 1) * viz.zoomFactor;
          _y = y + Math.cos(rads * l + spin * tP) * thetaP * (radius * (l % 2 ? viz.radiusCenter : 1)) / breth * (j % 2 + 1) * viz.zoomFactor;

          if (!l) {
            ctx.moveTo(_x, _y);
          }
          else {
            ctx.lineTo(_x, _y);
            ctx.stroke();
          }
        }
        ctx.closePath();
        ctx.fill();
      },
      function() {
        for (l = 0; l < points; l++) {

          _x = x + Math.sin(rads * l + spin * tP) * thetaP * radius / breth * (j % 2 + 1) * viz.zoomFactor;
          _y = y + Math.cos(rads * l + spin * tP) * thetaP * radius / breth * (j % 2 + 1) * viz.zoomFactor;

          ctx.beginPath();
          ctx.arc(_x, _y, viz.radiusCenter * 5 * theta, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    ];

    function play(_viz) {
      viz = _viz.properties;
      name = _viz.name;
      $vizProperties.setDefaultVizPropValues(viz, properties);
      updateScript();
      playing = true;
      setCanvas(CanvasManager.refreshCanvas());
      reset();
      onResize();
      animLoop();
    }

    function updateScript(updates){
      if(!updates || updates.backgroundColor) {
        bgColorGen = ColorManager.getColorFunc(viz.backgroundColor);
      }
      if(!updates || updates.drawMethod) {
        viz.drawMethod %= drawMethods.length;
        draw = drawMethods[viz.drawMethod];
      }
      if(!updates || updates.filter) {
        ColorManager.applyFilter(viz);
      }
    }

    function reset() {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    function stop() {
      playing = false;
    }

    function getTitle() {
      return name;
    }

    function refresh() {
      if (viz.background) {
        //ctx.fillStyle = viz.background;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      reset();
    }

    function setCanvas(playerCanvas) {
      canvas = playerCanvas;
      ctx = canvas.getContext('2d');
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
    }

    function getCanvas() {
      return canvas;
    }

    function onResize() {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
      w = ctx.canvas.width > ctx.canvas.height
        ? ctx.canvas.width
        : ctx.canvas.height;
    }

    function pause(){
      playing = false;
    }

    function resume(){
      playing = true;
      animLoop();
    }

    function getProperties() {
      return properties;
    }

    function getVizProperties(){
      return viz;
    }

    return {
      is3D: false,
      play: play,
      stop: stop,
      reset: reset,
      pause: pause,
      getVizProperties: getVizProperties,
      resume: resume,
      refresh: refresh,
      getTitle: getTitle,
      setCanvas: setCanvas,
      getProperties: getProperties,
      updateScript: updateScript,
      getCanvas: getCanvas,
      onResize: onResize,
      details: {
        name: 'Lattice',
        type: 'lattice',
        description: '2D shapes spiralling in and out'
      }
    };
  }
})();
