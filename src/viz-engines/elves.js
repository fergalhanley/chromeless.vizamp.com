/* global window  */
(function () {
  'use strict';

  angular
    .module('vizamp')
    .factory('elves', elves);

  /** @ngInject */
  function elves(SoundService, ColorManager, RenderManager, VizPlayService, CanvasManager, $vizProperties) {

    var
      playing = false,

      canvas,
      ctx,

      viz,
      name,
      colorGen,
      bgColorGen,
      color,
      drawMethod,

      circleGroups = [],
      chronometer = 0,

      i, j, k,
      circleIndex,
      layerOpacity,
      pos, angle,
      x1, x2, y1, y2,
      deg, circles,

      colorformSoundVector,
      waveformSoundVector,
      waveformSoundByte,
      colorformSoundByte,

      calcStartPos, calcPos,

      waveForm = 1,
      colorForm = 1
      ;

    var properties = [
      {
        key: 'points',
        title: 'Points',
        description: 'How many points the viz renders to',
        inputType: 'range',
        min: 1,
        max: 1024,
        step: 1,
        combo: 'q',
        action: 'scroll',
        "default": 1,
        scriptable: true,
      },
      // todo: expose this when there is validation
      //{
      //  key: 'calcPos',
      //  title: 'Calculated Position',
      //  description: 'Script to calculate the position of each line drawn',
      //  inputType: 'text'
      //},
      {
        key: 'innerRadius',
        title: 'Inner Radius',
        description: 'How big the inner radius of the viz lines are compared to the radius',
        inputType: 'range',
        min: 0.01,
        max: 5.0,
        step: 0.01,
        combo: 'w',
        action: 'scroll',
        "default": 1,
        scriptable: true,
      },
      {
        key: 'radius',
        title: 'Radius',
        description: 'Used to determine how far apart the lines are drawn for each layer',
        inputType: 'range',
        min: 1,
        max: 512,
        step: 1,
        linear: true,
        combo: 'r',
        action: 'scroll',
        "default": 1,
        scriptable: true,
      },
      // todo: render manager options select
      //{
      //  key: 'calcStartPos',
      //  title: 'Calculate Start Position',
      //  description: 'Calculate when to start drawing the viz lines from',
      //  inputType: 'text'
      //},
      {
        key: 'drawMethod',
        title: 'Draw Method',
        description: 'The method used to draw the at each point calculated',
        inputType: 'select',
        script: true,
        options: [
          'Machine',
          'Disco'
        ],
        combo: 'e',
        action: 'cycle',
        value: null,
        "default": 1,
        scriptable: true,
      },
      {
        key: 'maxCircles',
        title: 'Max Circles',
        description: 'The upper limit on the number of layered circles drawn for the viz',
        inputType: 'range',
        min: 1,
        max: 512,
        step: 1,
        linear: true,
        combo: 't',
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

      if (viz.clearBackground) {
        ctx.fillStyle = bgColorGen();
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }

      chronometer++;

      for (circleIndex = 0; circleIndex < viz.circleCount; circleIndex++) {

        circles = circleGroups[circleIndex];

        if (chronometer % 20 === 0) {
          pos = calcStartPos(ctx.canvas.width, ctx.canvas.height, circleIndex, chronometer);
          circles.push({
            cx: pos.x,
            cy: pos.y,
            r: 0,
            seq: circles.length > 0 ? circles[circles.length - 1].seq + 1 : 0,
            index: circles.length
          });
        }
        if (circles.length >= viz.maxCircles) {
          circles.shift();
        }

        k = 0;

        for (i = 0; i < circles.length; i++) {

          circles[i].r += viz.r;
          pos = calcPos(
            ctx.canvas.width,
            ctx.canvas.height,
            circleIndex,
            chronometer,
            circles[i].cx,
            circles[i].cy,
            circles[i].r,
            circles[i].seq,
            circles[i].index,
            i
          );
          circles[i].cx = pos.x;
          circles[i].cy = pos.y;

          deg = 2 * Math.PI;
          angle = deg / viz.points;

          layerOpacity = ColorManager.calcOpacityCurve(i, viz.maxCircles) * 2 * viz.lineOpacity;

          for (j = 0; j < viz.points; j++) {

            k++;
            if (waveformSoundByte !== undefined) {
              waveformSoundVector = waveformSoundByte[i % soundByteCount] / 128;
              waveForm = waveformSoundVector + ((1 - waveformSoundVector) * viz.waveformFactor);
              if(viz.drawMethod === 'disco') {
                waveForm = Math.abs(waveForm);
              }
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
            if(viz.thawWaveformFactor) {
              waveForm = ((10 * waveForm + colorForm) / 11);
            }

            color = colorGen(
              ctx.canvas.width, ctx.canvas.height,
              x1, y1, x2, y2,
              colorForm, layerOpacity,
              circles[i].seq, chronometer, circles[i].r
            );
            viz.ranges.forEach(drawMethod);
            deg -= angle;
          }
        }
      }

      if(viz.shiftFilter) {
        RenderManager.shiftFilter(ctx, viz.shiftFilter);
      }
    }

    var drawMethods = [
      function draw(range) {
        ctx.strokeStyle = color;
        x1 = viz.offsetX + circles[i].cx + (circles[i].r * waveForm * viz.zoom * Math.cos(deg));
        y1 = viz.offsetY + circles[i].cy + (circles[i].r * waveForm * viz.zoom * Math.sin(deg));
        x2 = viz.offsetX + circles[i].cx + ((circles[i].r * waveForm * viz.zoom * viz.innerRadius) * Math.cos(deg + angle / 2 * range));
        y2 = viz.offsetY + circles[i].cy + ((circles[i].r * waveForm * viz.zoom * viz.innerRadius) * Math.sin(deg + angle / 2 * range));
        ctx.lineWidth = viz.lineWidth;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      },
      function(range){
        ctx.fillStyle = color;
        x1 = viz.offsetX + circles[i].cx + (circles[i].r * viz.zoom * Math.cos(deg));
        y1 = viz.offsetY + circles[i].cy + (circles[i].r * viz.zoom * Math.sin(deg));
        x2 = viz.offsetX + circles[i].cx + ((circles[i].r * viz.zoom * viz.innerRadius) * Math.cos(deg + angle / 2 * range));
        y2 = viz.offsetY + circles[i].cy + ((circles[i].r * viz.zoom * viz.innerRadius) * Math.sin(deg + angle / 2 * range));
        ctx.beginPath();
        ctx.arc(x1, y1, Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2)) * viz.radius * waveForm, 0, 2 * Math.PI, false);
        ctx.fill();
      }
    ];

    function play(_viz) {
      viz = _viz.properties;
      name = _viz.name;
      $vizProperties.setDefaultVizPropValues(viz, properties);
      setCanvas(CanvasManager.refreshCanvas());
      updateScript();
      playing = true;
      reset();
      onResize();
      animLoop();
    }

    function updateScript(updates) {
      if(!updates || updates.colorScheme) {
        colorGen = ColorManager.getColorFunc(viz.colorScheme);
      }
      if(!updates || updates.backgroundColor) {
        bgColorGen = ColorManager.getColorFunc(viz.backgroundColor);
      }
      if(!updates || updates.calcPos) {
        calcPos = RenderManager.buildPositionFunction(viz.calcPos);
      }
      if(!updates || updates.calcStartPos) {
        calcStartPos = RenderManager.buildStartPositionFunction(viz.calcStartPos);
      }
      if(!updates || updates.drawMethod) {
        viz.drawMethod %= drawMethods.length;
        drawMethod = drawMethods[viz.drawMethod];
      }
      if(!updates || updates.filter) {
        ColorManager.applyFilter(viz);
      }
    }

    function reset() {
      ctx.fillStyle = colorGen();
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      circleGroups = [];
      var cindex;
      if (viz.circleCount > circleGroups.length) {
        for (cindex = circleGroups.length; cindex < viz.circleCount; cindex++) {
          circleGroups.push([]);
        }
      }
      else if (viz.circleCount > circleGroups.length) {
        for (cindex = viz.circleCount; cindex > circleGroups.length; cindex--) {
          circleGroups.pop();
        }
      }
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
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      circleGroups = [];
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
      getProperties: getProperties,
      updateScript: updateScript,
      setCanvas: setCanvas,
      getCanvas: getCanvas,
      onResize: onResize,
      details: {
        name: 'Grapher',
        type: 'elves',
        description: 'Draws or circles in a 2D rendering'
      }
    };
  }
})();
