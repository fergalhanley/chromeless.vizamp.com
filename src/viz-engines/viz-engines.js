/* global THREE */
/**
 * Created by fergalhanley on 17/03/2016.
 */
(function () {
  'use strict';
  angular
    .module('vizamp')
    .factory('$vizEngines', $vizEngines);

  /** @ngInject */
  function $vizEngines(elves, epicycloid, spiral, lattice, cube3d, logo, model3d, spectrograph, imageGlitcher, $vizProperties) {

    // todo: these property definitions should be pulled into the database and used as for server side validation

    var engines = {
      epicycloid: epicycloid,
      lattice: lattice,
      spiral: spiral,
      elves: elves,
      logo: logo,
      cube3d: cube3d,
      model3d: model3d,
      spectrograph: spectrograph,
      imageGlitcher: imageGlitcher
    };

    return {
      get: function (type) {
        return engines[type];
      },

      getProperties: function (type) {
        var retval = [];
        angular.copy(engines[type].getProperties(), retval);
        return retval;
      },

      setCanvases: function (canvas) {
        for (var key in engines) {
          //engines[key].setCanvas(canvas);
        }
      },
      updateScript: function(type, key){
        if(engines[type].updateScript) {
          var updates = {};
          updates[key] = true;
          engines[type].updateScript(updates);
        }
      },
      getDetails: function(){
        return _.map(engines, function(engine){
          return engine.details;
        });
      }
    };
  }
})();
