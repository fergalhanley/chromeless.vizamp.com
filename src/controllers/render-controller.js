  // function RenderManager($config) {
  //
  //   var
  //     beatIndex = 0,
  //     propertyUpdates = [],
  //     vizStartTime,
  //     propertyUpdateParameters = [
  //       {variable: 't', description: 'Viz time: milliseconds since start of Viz playing'},
  //       {variable: 'p', description: 'Audio track progress percentage 0..100'},
  //       {variable: 'b', description: 'Beat: true if beat detected, false otherwise'},
  //       {variable: 'bi', description: 'Beat index: sequential number of last beat detected'},
  //       {variable: 'width', description: 'Width od screen in pixels'},
  //       {variable: 'height', description: 'Height of screen in pixels'},
  //       {variable: 'td', description: 'The time domain value'},
  //       {variable: 'fd', description: 'The frequency value'}
  //     ]
  //     ;
  //
  //   function getPropertyUpdateParameters() {
  //     return propertyUpdateParameters;
  //   }
  //
  //   function buildPositionFunction(script) {
  //     var calcPosScript = 'var x = 0, y = 0;' + script +
  //       '; return { x: x, y: y };';
  //     try {
  //       return new Function('w', 'h', 'circleIndex', 'chronometer', 'cx', 'cy', 'r', 'seq', 'index', 'i', calcPosScript);
  //     }
  //     catch (e) {
  //       console.error('calcPos Error');
  //     }
  //   }
  //
  //   function buildStartPositionFunction(script) {
  //     var calcStartPosScript = 'var x = 0, y = 0;' + script +
  //       '; return { x: x, y: y };';
  //     try {
  //       return new Function('w', 'h', 'circleIndex', 'chronometer', calcStartPosScript);
  //     }
  //     catch (e) {
  //       console.error('calcStartPos Error');
  //     }
  //   }
  //
  //   var shiftFilters = [
  //     'None',
  //     'Hydrogen',
  //     'Helium',
  //     'Lithium',
  //     'Beryllium',
  //     'Boron',
  //     'Carbon',
  //     'Nitrogen',
  //     'Oxygen',
  //     'Fluorine',
  //     'Neon',
  //     'Sodium',
  //     'Magnesium',
  //     'Aluminium',
  //     'Silicon',
  //     'Phosphorus',
  //     'Sulfur',
  //     'Chlorine',
  //     'Argon',
  //     'Potassium'
  //   ];
  //
  //   function getShiftFilters() {
  //     return shiftFilters;
  //   }
  //
  //   function shiftFilter(ctx, type) {
  //
  //     var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  //     /* jshint ignore:start */
  //     switch (type) {
  //       case 1 :
  //         pshift({Math: Math}, {
  //             r: -100, g: 100, b: 0, a: 3,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 24)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 2 :
  //         pshift({Math: Math}, {
  //             r: 4, g: 1, b: -2, a: 3,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 3 : // simple drift upwards
  //         pshift({Math: Math}, {
  //             r: 4, g: 5, b: 6, a: 7,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 4 : // tripp flash and drift up
  //         pshift({Math: Math}, {
  //             r: 6, g: 4, b: 5, a: 7,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 5 : // tripp flash and drift up/right
  //         pshift({Math: Math}, {
  //             r: 2, g: 0, b: 1, a: 3,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 6 : // crazy red shift to left
  //         pshift({Math: Math}, {
  //             r: 55, g: 1, b: 77, a: 36,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 20)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 7 : // fast drift to the left
  //         pshift({Math: Math}, {
  //             r: 20, g: 21, b: 22, a: 23,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 11)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 8 : // creepy dark shift right
  //         pshift({Math: Math}, {
  //             r: -23, g: -22, b: -21, a: -20,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 9 : // fast drift right
  //         pshift({Math: Math}, {
  //             r: -24, g: -23, b: -22, a: -21,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 10 : // fast RGB split (red/blue dominant)
  //         pshift({Math: Math}, {
  //             r: 20, g: 1, b: -22, a: 3,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 5)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 11 : // fast RGB split (green/blue dominant)
  //         pshift({Math: Math}, {
  //             r: 4, g: 21, b: -22, a: 3,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 5)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 12 : // glitchy as fuck
  //         pshift({Math: Math}, {
  //             r: Math.floor(Math.random() * 100 - 50),
  //             g: Math.floor(Math.random() * 100 - 50),
  //             b: Math.floor(Math.random() * 100 - 50),
  //             a: Math.floor(Math.random() * 100 - 50),
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 12)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 13 : // spooky yellowish ghost
  //         pshift({Math: Math}, {
  //             r: 27, g: -29, b: 44, a: 2,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 12)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 14 : // another spooky yellowish ghost
  //         pshift({Math: Math}, {
  //             r: -9, g: -36, b: 11, a: 20,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 12)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 15 : // black and white, yellow and violet
  //         pshift({Math: Math}, {
  //             r: 32, g: 48, b: -40, a: 43,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 12)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 16 : // bright and trippy
  //         pshift({Math: Math}, {
  //             r: -47, g: 22, b: 19, a: 26,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 12)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 17 : // strange glitchy
  //         pshift({Math: Math}, {
  //             r: -72, g: -33, b: -5, a: -100,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 12)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 18 : // RGB color split and drift fast
  //         pshift({Math: Math}, {
  //             r: 49, g: -88, b: 52, a: 31,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 12)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //       case 19 : // todo more of these
  //         gshift({Math: Math}, {
  //             r1: 20, g1: 21, b1: 22, a1: 23,
  //             r2: -24, g2: -23, b2: -22, a2: -21,
  //             w: ctx.canvas.width * 4 - 4,
  //             max: imageData.data.length - (ctx.canvas.width * 4 * 11)
  //           },
  //           imageData.data);
  //         ctx.putImageData(imageData, 0, 0);
  //         break;
  //     }
  //     /* jshint ignore:end */
  //   }
  //
  //
  //
  //   /* jshint ignore:start */
  //   function pshift(stdlib, foreign, heap) {
  //     'use asm';
  //     var w = foreign.w | 0,
  //       max = foreign.max | 0,
  //       r = foreign.r | 0,
  //       g = foreign.g | 0,
  //       b = foreign.b | 0,
  //       a = foreign.a | 0,
  //       i = 0, f = 0;
  //
  //     for (i = w | 0; (i | 0) < (max | 0); i = (i + 4) | 0) {
  //       f = (i + w) | 0;
  //       heap[i << 2 >> 2] = heap[(f + r) | 0 << 2 >> 2];
  //       heap[((i | 0) + 1) | 0 << 2 >> 2] = heap[(f + g) | 0 << 2 >> 2];
  //       heap[((i | 0) + 2) | 0 << 2 >> 2] = heap[(f + b) | 0 << 2 >> 2];
  //       heap[((i | 0) + 3) | 0 << 2 >> 2] = heap[(f + a) | 0 << 2 >> 2];
  //     }
  //   }
  //
  //   function gshift(stdlib, foreign, heap) {
  //     'use asm';
  //     var w = foreign.w | 0,
  //       max = foreign.max | 0,
  //       r1 = foreign.r | 0,
  //       g1 = foreign.g | 0,
  //       b1 = foreign.b | 0,
  //       a1 = foreign.a | 0,
  //       r2 = foreign.r2 | 0,
  //       g2 = foreign.g2 | 0,
  //       b2 = foreign.b2 | 0,
  //       a2 = foreign.a2 | 0,
  //       i = 0, f = 0;
  //
  //     for (i = w | 0; (i | 0) < (max | 0); i = (i + 8) | 0) {
  //       f = (i + w) | 0;
  //       heap[i << 2 >> 2] = heap[(f + r1) | 0 << 2 >> 2];
  //       heap[((i | 0) + 1) | 0 << 2 >> 2] = heap[(f + g1) | 0 << 2 >> 2];
  //       heap[((i | 0) + 2) | 0 << 2 >> 2] = heap[(f + b1) | 0 << 2 >> 2];
  //       heap[((i | 0) + 3) | 0 << 2 >> 2] = heap[(f + a1) | 0 << 2 >> 2];
  //       heap[((i | 0) + 4) | 0 << 2 >> 2] = heap[(f + r2) | 0 << 2 >> 2];
  //       heap[((i | 0) + 5) | 0 << 2 >> 2] = heap[(f + g2) | 0 << 2 >> 2];
  //       heap[((i | 0) + 6) | 0 << 2 >> 2] = heap[(f + b2) | 0 << 2 >> 2];
  //       heap[((i | 0) + 7) | 0 << 2 >> 2] = heap[(f + a2) | 0 << 2 >> 2];
  //     }
  //   }
  //
  //   /* jshint ignore:end */
  //
  //
  //   var updateType = {
  //     brightness: 'filter',
  //     contrast: 'filter',
  //     blur: 'filter',
  //     grayscale: 'filter',
  //     sepia: 'filter',
  //     hue: 'filter',
  //     invert: 'filter',
  //     saturate: 'filter',
  //     texture: 'texture',
  //     textureFile: 'texture',
  //     colorScheme: 'colorScheme',
  //     backgroundColor: 'backgroundColor',
  //     calcPos: 'calcPos',
  //     calcStartPos: 'calcStartPos',
  //     drawMethod: 'drawMethod',
  //     positionMethod: 'positionMethod'
  //   };
  //
  //   function getDefaultTextures() {
  //     return defaultTextures;
  //   }
  //
  //   function killPropertyUpdate(index) {
  //     propertyUpdates.splice(index, 1);
  //   }
  //
  //   var threshold = 0, timeAtBeat = 0, THRESHOLD_MIN = 230;
  //
  //   function beatDetected(soundByte, now){
  //
  //     if(now - timeAtBeat < 200) { // time buffer between beet detections
  //       return false;
  //     }
  //
  //     // drop the sensitivity of the threshold when a beat is not detected for an extended period
  //     if(threshold > THRESHOLD_MIN) {
  //       threshold -= 0.01;
  //     }
  //
  //     var sample = checkIfBeat({}, {
  //       threshold: threshold,
  //       len: soundByte ? soundByte.length : 0
  //     }, soundByte);
  //     if(sample) {
  //       timeAtBeat = now;
  //       threshold = sample - 1;
  //       return true;
  //     }
  //     return false;
  //   }
  //
  //   function checkIfBeat(stdlib, foreign, heap) {
  //     'use asm';
  //     var threshold = foreign.threshold|0;
  //     var len = foreign.len|0;
  //     var max = 0;
  //     var i = 0;
  //     for (i = 0; (i | 0) < (len | 0); i = (i + 1) | 0) {
  //       if(heap[i << 2 >> 2] > (max | 0)) {
  //         max = heap[i << 2 >> 2] | 0;
  //       }
  //     }
  //     if(max >= threshold) {
  //       return max;
  //     }
  //     return 0;
  //   }
  //
  //   function processTriggerUpdates(viz, td, fd, updateScript) {
  //     if (propertyUpdates.length) {
  //       var
  //         now = new Date().getTime(),
  //         beat = beatDetected(td, now),
  //         vizTime = now - vizStartTime,
  //         audioTime = WebAudioPlayer.getTime() * 1000,
  //         updates = {}
  //         ;
  //
  //       if(beat) {
  //         // todo reset beatIndex upon new song or starting mic
  //         beatIndex++;
  //       }
  //
  //       propertyUpdates.forEach(function(propertyUpdate){
  //
  //         var val = propertyUpdate.call(viz, vizTime, audioTime, beat, beatIndex, window.innerWidth, window.innerHeight, td ? td[0] : 128, fd ? fd[0] : 128);
  //         if (val !== viz[propertyUpdate.property]) {
  //           viz[propertyUpdate.property] = val;
  //           updates[updateType[propertyUpdate.property]] = true;
  //         }
  //         if (Object.keys(updates).length) {
  //           updateScript(updates);
  //         }
  //       });
  //     }
  //   }
  //
  //   function updatePropertyScripts(propertyScripts, vizProperties) {
  //     propertyUpdates.length = 0;
  //     for(var i = 0; i < propertyScripts.length; i++){
  //       var propertyScript = propertyScripts[i];
  //       var parameters = _.map(propertyUpdateParameters, function (n) {
  //         return n.variable;
  //       });
  //       var propKeys = vizProperties.map( function(vizProperty){
  //         return vizProperty.key;
  //       });
  //       propertyUpdates.push({
  //         property: propertyScript.property,
  //         call: ves.buildFunc(propertyScript.script, parameters, propKeys)
  //       });
  //     }
  //   }
  //
  //   function vizStart(viz) {
  //
  //     propertyUpdates = [];
  //     if (viz.propertyScripts) {
  //       viz.propertyScripts.forEach(function(propertyScript){
  //
  //         var call = ves.buildFunc(
  //           propertyScript.script,
  //           _.map(propertyUpdateParameters, function (n) {
  //             return n.variable;
  //           }),
  //           Object.keys(viz.properties)
  //         );
  //         propertyUpdates.push({
  //           call: call,
  //           property: propertyScript.property
  //         });
  //       });
  //     }
  //     vizStartTime = new Date().getTime();
  //   }


import config from '../core/config.js';

const defaultTextures = [
  'vizamp',
  'ant',
  'ball',
  'bear',
  'bernie',
  'cactus',
  'circle',
  'cube',
  'diamond',
  'eye',
  'face',
  'face2',
  'flower',
  'pattern',
  'shark-teeth',
  'snowflake'
];

export function getSprite(properties) {
  properties.texture = properties.texture || 0;
  return `${config.base}/assets/images/sprites/${defaultTextures[properties.texture]}.png`;
}
