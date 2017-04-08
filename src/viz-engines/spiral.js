/* global window  */
(function() {
  'use strict';

  angular
    .module('vizamp')
      .factory('spiral', spiral);

  /** @ngInject */
  function spiral(SoundService, ColorManager, RenderManager, VizPlayService, CanvasManager, $vizProperties) {


    var
      playing = false,

      canvas,
      ctx,

      viz,
      name,

      r, radius,
      cx, cy,

      i, j, t = 0, e = 0, angle, deg,

      _x, _y, x, y,
      start,

      inc,
      words,

      calcPosition,
      draw,

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
        key: 'positionMethod',
        title: 'Position Method',
        description: 'Which method is used to determine the position of the lines drawn',
        inputType: 'select',
        options: [
          'Hendrix',
          'Stones',
          'Zeppelin',
          'Bowie',
          'Floyd'
        ],
        combo: 'r',
        action: 'cycle',
        value: null,
        "default": 1,
        scriptable: true,
      },
      {
        key: 'letterText',
        title: 'Letter Text',
        description: 'Specify a body of text that will be used in the rendering if the draw method collision is selected',
        inputType: 'text',
        value: null,
        "default": "",
        scriptable: true,
      },
      {
        key: 'drawMethod',
        title: 'Draw Method',
        description: 'How are the objects drawn for this viz',
        inputType: 'select',
        options: [
          'Nova',
          'Quasar',
          'Impact',
          'Collision'
        ],
        combo: 'e',
        action: 'cycle',
        value: null,
        "default": "",
        scriptable: true,
      },
      {
        key: 'spin',
        title: 'Spin',
        description: 'Specify the speed at which the viz spiral spins',
        inputType: 'range',
        min: 0.01,
        max: 5.0,
        step: 0.01,
        combo: 'w',
        action: 'scroll',
        value: null,
        "default": 1,
        scriptable: true,
      }
    ];

    $vizProperties.include(properties, ['common', 'canvas2d', 'canvasFilter']);

    function animLoop() {

      if(playing) {
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

      viz.thawWaveformFactor = false;

      _x = _y = null;

      if (viz.clearBackground) {
        ctx.fillStyle = bgColorGen();
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }

      calcPosition = positionMethods[viz.positionMethod];
      draw = drawMethods[viz.drawMethod];

      for (i = 0; i < viz.points; i++) {
        e += inc;

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

        calcPosition();
        draw();
      }
      t = (start - new Date().getTime()) / i * viz.spin + e;

      if(viz.shiftFilter) {
        RenderManager.shiftFilter(ctx, viz.shiftFilter);
      }
    }

    var positionMethods = [
      function() {
        x = cx + Math.sin(i + t) * (i/viz.points * r) * waveForm * viz.zoom;
        y = cy + Math.cos(i + t) * (i/viz.points * r) * waveForm * viz.zoom;
      },
      function() {
        x = cx + Math.sin(i * t / 1000) * (i/viz.points * r) * waveForm * viz.zoom;
        y = cy + Math.cos(i * t / 1000) * (i/viz.points * r) * waveForm * viz.zoom;
      },
      function() {
        x = cx + Math.sin(i + t) * (i/viz.points * r) * waveForm * viz.zoom;
        y = cy + Math.cos(i + t) * (i/viz.points * r) * waveForm * viz.zoom;
      },
      function() {
        x = cx + Math.sin(i * Math.log(t)) * (i/viz.points * r) * waveForm * viz.zoom;
        y = cy + Math.cos(i * Math.log(t)) * Math.log(i/viz.points) * (i/viz.points * r) * waveForm * viz.zoom;
      },
      function(){
        x = cx + Math.sin(i * Math.log(t)) * Math.log(i/viz.points) * (i/viz.points * r) * waveForm * viz.zoom;
        y = cy + Math.cos(i * Math.log(t)) * Math.log(i/viz.points) * (i/viz.points * r) * waveForm * viz.zoom;
      }
    ];

    var drawMethods = [
      function() {
        if(_x !== null) {
          ctx.lineWidth = (i / viz.points) * viz.lineWidth;
          ctx.strokeStyle = colorGen(
            ctx.canvas.width, ctx.canvas.height,
            x, y, _x, _y,
            colorForm, viz.lineOpacity,
            i, t, radius
          );

          ctx.beginPath();
          ctx.moveTo(_x, _y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        _x = x; _y = y;
      },
      function() {
        ctx.lineWidth = (i / viz.points) * viz.lineWidth;
        ctx.fillStyle = colorGen(
          ctx.canvas.width, ctx.canvas.height,
          x, y, x, y,
          colorForm, viz.lineOpacity,
          i, t, radius
        );

        radius = Math.abs(viz.radius * waveForm);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
      },
      function() {

        ctx.fillStyle = colorGen(
          ctx.canvas.width, ctx.canvas.height,
          x, y, x, y,
          colorForm, viz.lineOpacity,
          i, t, radius
        );
        ctx.strokeStyle = colorGen(
          ctx.canvas.width, ctx.canvas.height,
          x, y, x, y,
          colorForm, viz.lineOpacity,
          viz.points - i, t, radius
        );

        ctx.lineWidth = (i / viz.points) * viz.lineWidth;
        radius = viz.radius * waveForm * (i / viz.points);

        angle = 0;
        deg = (i % 3) + 3;
        ctx.beginPath();
        ctx.moveTo(x + Math.sin(angle) * radius, y + Math.cos(angle) * radius);

        for(j = 0; j < deg; j++) {
          angle += (Math.PI * 2) / deg;
          ctx.lineTo(x + Math.sin(angle) * radius, y + Math.cos(angle) * radius);
          ctx.stroke();
        }

        ctx.closePath();
        ctx.fill();
      },
      function() {
        ctx.strokeStyle = colorGen(
          ctx.canvas.width, ctx.canvas.height,
          x, y, x, y,
          colorForm, viz.lineOpacity,
          i, t, radius
        );

        ctx.font = (viz.radius * waveForm) + "px serif";

        ctx.strokeText(words[i%words.length], x, y);
      }
    ];

    function reset() {
      if (viz.background) {
        ctx.fillStyle = viz.background;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      words = viz.letterText.split(' ');
      x = y = _x = _y = 1;
      t = 0;
      start = new Date().getTime();
      inc = Math.PI * 1/viz.points;
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

    function updateScript(updates){
      if(!updates || updates.colorScheme) {
        colorGen = ColorManager.getColorFunc(viz.colorScheme);
      }
      if(!updates || updates.backgroundColor) {
        bgColorGen = ColorManager.getColorFunc(viz.backgroundColor);
      }
      if(!updates || updates.positionMethod) {
        viz.positionMethod %= positionMethods.length;
        calcPosition = positionMethods[viz.positionMethod];
      }
      if(!updates || updates.drawMethod) {
        viz.drawMethod %= drawMethods.length;
        draw = drawMethods[viz.drawMethod];
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

    function refresh() {
      // todo more stuff to reset
      reset();
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
        name: 'Spiral',
        type: 'spiral',
        description: 'A 2D spiral animation'
      }
    };
  }
})();
