/* global window, performance */
(function () {
  'use strict';

  angular
    .module('vizamp')
    .factory('epicycloid', epicycloid);

  /** @ngInject */
  function epicycloid(SoundService, ColorManager, VizPlayService, RenderManager, CanvasManager, $vizProperties) {

    var
      playing = false,

      canvas,
      ctx,

      viz,
      name,

      r,
      cx, cy,
      t, ocil, theta,
      deg,
      inc,
      x1, y1, x2, y2, i,
      grad,

      waveForm = 1,
      colorForm = 1,
      colorformSoundVector,
      waveformSoundVector,
      waveformSoundByte,
      colorformSoundByte,

      colorGen,
      bgColorGen
      ;

    var properties = [
      {
        key: 'lineWidthOuter',
        title: 'Outer Line',
        description: 'Specify the width of the outer rendering lines',
        inputType: 'range',
        min: 0,
        max: 512,
        step: 1,
        combo: ';',
        action: 'scroll',
        value: null,
        "default": 1,
        scriptable: true,
      },
      {
        key: 'externalRender',
        title: 'External Render',
        description: 'Choose the style that the outer lines render in',
        inputType: 'select',
        options: [
          'Superbeam',
          'Movement',
          'Beam',
          'Complex',
          'None'
        ],
        combo: 'e',
        action: 'cycle',
        value: null,
        "default": 1,
        scriptable: true,
      }
    ];

    $vizProperties.include(properties, ['common', 'canvas2d', 'canvasFilter']);

    function animLoop() {

      if (playing) {
        window.requestAnimationFrame(animLoop);
      }
      else {
        return;
      }

      VizPlayService.setVizProperty(viz);

      var td = SoundService.getTimeDomainData(),
          fd = SoundService.getByteFrequencyData(),
          soundByte = viz.timeOrFrequency
          ? fd
          : td
        ;
      var soundByteCount = soundByte ? soundByte.length : 0;

      if (!viz.freezeWaveformFactor) {
        waveformSoundByte = soundByte;
      }
      if (!viz.freezeColorformFactor) {
        colorformSoundByte = soundByte;
      }

      RenderManager.processTriggerUpdates(viz, td, fd, updateScript);

      t = performance.now() * 0.00005;
      theta = t % Math.PI * 2;
      ocil = Math.sin(t) * 10;

      if (viz.clearBackground) {
        if (bgColorGen) {
          ctx.fillStyle = bgColorGen(ctx.canvas.width, ctx.canvas.height, 0, 0, 0, 0, colorForm, viz.lineOpacity, ocil);
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        }
        else {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      }

      for (i = 0; i < Math.abs(viz.points * ocil); i++) {

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
        if (viz.thawWaveformFactor) {
          waveForm = ((10 * waveForm + colorForm) / 11);
        }

        x1 = x2 = y1 = y2 = r * waveForm * viz.zoom;

        x1 *= Math.cos(deg * i + theta);
        y1 *= Math.sin(deg * i + theta);
        x2 *= Math.cos(deg / ocil * i + theta);
        y2 *= Math.sin(deg / ocil * i + theta);

        x1 += cx + viz.offsetX;
        y1 += cy + viz.offsetY;
        x2 += cx + viz.offsetX;
        y2 += cy + viz.offsetY;

        ctx.strokeStyle = colorGen(
          ctx.canvas.width, ctx.canvas.height,
          x1, y1, x2, y2,
          colorForm, viz.lineOpacity,
          i, ocil/* t */, grad/* r */
        );

        ctx.lineWidth = viz.lineWidth * viz.zoom;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        externalRenderFunctions[viz.externalRender](i);
      }
      if (viz.shiftFilter) {
        RenderManager.shiftFilter(ctx, viz.shiftFilter);
      }
    }

    var externalRenderFunctions = [
      function (i) {
        x2 = cx + viz.offsetX + (r * waveForm * viz.zoom * 4 * Math.cos(deg / ocil * i));
        y2 = cy + viz.offsetY + (r * waveForm * viz.zoom * 4 * Math.sin(deg / ocil * i));
        drawExRen();
      },
      function (i) {
        x2 = cx + viz.offsetX + (r * waveForm * viz.zoom * 4 * Math.cos(deg * i));
        y2 = cy + viz.offsetY + (r * waveForm * viz.zoom * 4 * Math.sin(deg * i));
        drawExRen();
      },
      function (i) {
        x1 = cx + viz.offsetX + (r * waveForm * viz.zoom * 4 * Math.cos(deg * i));
        y1 = cy + viz.offsetY + (r * waveForm * viz.zoom * 4 * Math.sin(deg * i));
        drawExRen();
      },
      function (i) {
        x1 = cx + viz.offsetX + (r * waveForm * viz.zoom * 4 * Math.cos(deg / ocil * i));
        y1 = cy + viz.offsetY + (r * waveForm * viz.zoom * 4 * Math.sin(deg / ocil * i));
        drawExRen();
      },
      function () {
      }
    ];

    function drawExRen() {
      ctx.lineWidth = viz.lineWidthOuter * viz.zoom;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    function reset() {
      if (viz.background) {
        ctx.fillStyle = viz.background;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      deg = 2 * Math.PI / viz.points;
      inc = viz.speed;
    }

    function play(_viz) {
      viz = _viz.properties;
      name = _viz.name;
      $vizProperties.setDefaultVizPropValues(viz, properties);
      updateScript();
      setCanvas(CanvasManager.refreshCanvas());
      playing = true;
      reset();
      onResize();
      animLoop();
    }

    function stop() {
      playing = false;
    }

    function getTitle() {
      return name;
    }

    function refresh() {
      // todo more stuff to reset
      t = 1;
    }

    function setCanvas(playerCanvas) {
      canvas = playerCanvas;
      ctx = canvas.getContext('2d');
      onResize();
    }

    function getCanvas() {
      return canvas;
    }

    function onResize() {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
      r = (window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 2;
      cx = ctx.canvas.width / 2;
      cy = ctx.canvas.height / 2;
    }

    function pause() {
      playing = false;
    }

    function resume() {
      playing = true;
      animLoop();
    }

    function updateScript(updates) {
      if(!updates || updates.colorScheme) {
        colorGen = ColorManager.getColorFunc(viz.colorScheme);
      }
      if(!updates || updates.backgroundColor) {
        bgColorGen = ColorManager.getColorFunc(viz.backgroundColor, ['t']);
      }
      if(!updates || updates.filter) {
        ColorManager.applyFilter(viz);
      }
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
      onResize: onResize,
      getCanvas: getCanvas,
      setCanvas: setCanvas,
      getProperties: getProperties,
      updateScript: updateScript,
      details: {
        name: 'Epicycloid',
        type: 'epicycloid',
        description: 'A 2D rendering of lines in a circle formation'
      }
    };
  }
})();
