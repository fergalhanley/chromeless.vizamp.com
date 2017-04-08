/* global window */
(function () {
  'use strict';

  angular
    .module('vizamp')
    .factory('logo', logo);

  /** @ngInject */
  function logo(SoundService, ColorManager, RenderManager, VizPlayService, CanvasManager, $vizProperties) {

    var
      playing = false,

      canvas,
      ctx,

      viz,
      name,
      bgColorGen,

      circleGroups = [],

      colorformSoundVector,
      waveformSoundVector,
      waveformSoundByte,
      colorformSoundByte,

      radius = 128, r = 8, rads = Math.PI / 3, ra = Math.PI / 2,

      w, h,
      cx, cy,

      x1, y1, x2, y2, tx1, ty1, tx2, ty2, theta,
      t = 0,
      gradient, hue = 0,
      offsetY,
      waveForm = 1,
      colorForm = 1
      ;

    var properties = [];// none yet
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

      if(!viz.freezeWaveformFactor || viz.thawWaveformFactor) {
        waveformSoundByte = soundByte;
      }
      if(!viz.freezeColorformFactor || viz.thawWaveformFactor) {
        colorformSoundByte = soundByte;
      }

      RenderManager.processTriggerUpdates(viz, td, fd, updateScript);

      r = viz.lineWidth;

      if (waveformSoundByte !== undefined) {
        waveformSoundVector = waveformSoundByte[0] / 128;
        waveForm = waveformSoundVector + ((1 - waveformSoundVector) * viz.waveformFactor);
        if (viz.drawMethod === 'disco') {
          waveForm = Math.abs(waveForm);
        }
      }
      else {
        waveForm = 1;
      }
      if (colorformSoundByte !== undefined) {
        colorformSoundVector = colorformSoundByte[0] / 128;
        colorForm = colorformSoundVector + ((1 - colorformSoundVector) * viz.colorformFactor);
      }
      else {
        colorForm = 1;
      }
      if (viz.thawWaveformFactor) {
        waveForm = ((10 * waveForm + colorForm) / 11);
      }

      if (viz.clearBackground) {
        ctx.fillStyle = bgColorGen();
        ctx.fillRect(0, 0, w, h);
      }

      t += 0.005;

      [
        {colorSequence: 3, from: 3, to: 1, offset: 4},
        {colorSequence: 2, from: 5, to: 3, offset: 4},
        {colorSequence: 5, from: 4, to: 0, offset: -4},
        {colorSequence: 0, from: 0, to: 2, offset: -4}

      ].forEach(function (l) {

        offsetY = radius / l.offset;

        x1 = cx + viz.offsetX + Math.sin(rads * l.from) * radius * viz.zoom;
        y1 = cy + viz.offsetY + Math.cos(rads * l.from) * radius * viz.zoom + offsetY;
        x2 = cx + viz.offsetX + Math.sin(rads * l.to) * radius * viz.zoom;
        y2 = cy + viz.offsetY + Math.cos(rads * l.to) * radius * viz.zoom + offsetY;

        theta = Math.atan((x2 - x1) / (y2 - y1));

        tx1 = Math.sin(theta + ra) * r * viz.zoom * waveForm;
        ty1 = Math.cos(theta + ra) * r * viz.zoom * waveForm;
        tx2 = Math.sin(theta - ra) * r * viz.zoom * waveForm;
        ty2 = Math.cos(theta - ra) * r * viz.zoom * waveForm;

        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'hsla(' + (hue + l.colorSequence * 60 * Math.abs(colorForm)) + ', 100%, 50%, ' + viz.lineOpacity + ')');
        gradient.addColorStop(1, 'hsla(' + (hue + l.colorSequence * 60 * Math.abs(colorForm) + 60) + ', 100%, 50%, ' + viz.lineOpacity + ')');
        ctx.fillStyle = gradient;
        ctx.strokeStyle = gradient;

        ctx.beginPath();

        // first line
        ctx.moveTo(x1 + tx1, y1 + ty1);
        ctx.lineTo(x2 - tx2, y2 - ty2);
        ctx.lineTo(x2 + tx2, y2 + ty2);
        ctx.lineTo(x1 - tx1, y1 - ty1);
        ctx.lineTo(x1 + tx1, y1 + ty1);

        ctx.fill();

        ctx.arc(x2, y2, r * viz.zoom * waveForm, 0, 2 * Math.PI);
        ctx.arc(x1, y1, r * viz.zoom * waveForm, 0, 2 * Math.PI);

        ctx.stroke();

        ctx.fill();
      });
      if (viz.shiftFilter) {
        RenderManager.shiftFilter(ctx, viz.shiftFilter);
      }
    }

    function play(_viz) {
      viz = _viz.properties;
      name = _viz.name;
      $vizProperties.setDefaultVizPropValues(viz, properties);
      setCanvas(CanvasManager.refreshCanvas());
      updateScript();
      onResize();
      reset();
      animLoop();
    }

    function updateScript(updates) {
      if (!updates || updates.backgroundColor) {
        bgColorGen = ColorManager.getColorFunc(viz.backgroundColor);
      }
      if (!updates || updates.filter) {
        ColorManager.applyFilter(viz);
      }
    }

    function reset() {
      playing = true;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      circleGroups = [];
      r = viz.lineWidth;
      rads = Math.PI / 3;
      ra = Math.PI / 2;
      ctx.lineWidth = 0.1;
      ctx.imageSmoothingEnabled = true;
    }

    function stop() {
      playing = false;
    }

    function getTitle() {
      return name;
    }

    function refresh() {
      if (viz.background) {
        ctx.fillStyle = viz.background;
        ctx.fillRect(0, 0, w, h);
      }
      reset();
    }

    function setCanvas(playerCanvas) {
      canvas = playerCanvas;
      ctx = canvas.getContext('2d');
    }

    function getCanvas() {
      return canvas;
    }

    function onResize() {
      w = ctx.canvas.width = window.innerWidth;
      h = ctx.canvas.height = window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      radius = Math.min(cy, cx) - 40;
    }

    function pause() {
      playing = false;
    }

    function resume() {
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
        name: 'Logomation',
        type: 'logo',
        description: 'Render a logo in 2D and animate'
      }
    };
  }
})();
