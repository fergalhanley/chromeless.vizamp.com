
ColorManager, $vizEngines, hotkeys, WebAppService, CanvasManager

function noEasing(t, b, c, d) {
	t /= d;
	return b + c * (t);
}

function noEasing_inverse(t, b, c, d) {
	return ((t - b) / c) * d;
}

function action(property, shift) {

	switch (property.action) {
		case 'scrollx' :
			scrollMode[0] = property;
			analytics(GA_CAT.HOTKEY, GA_ACT.VIZ_SET_SCROLL_MODE, property.key);
			break;
		case 'scrolly' :
			scrollMode[1] = property;
			analytics(GA_CAT.HOTKEY, GA_ACT.VIZ_SET_SCROLL_MODE, property.key);
			break;
		case 'left_drag_x' :
			leftDragMode[0] = property;
			break;
		case 'left_drag_y' :
			leftDragMode[1] = property;
			break;
		case 'right_drag_x' :
			rightDragMode[0] = property;
			break;
		case 'right_drag_y' :
			rightDragMode[1] = property;
			break;
		case 'cycle' :
			property.value += shift ? property.value > 0 ? -1 : property.options.length - 1 : 1;
			property.value %= property.options.length;
			setVizProperty(property);
			break;
		case 'toggle' :
			property.value = !property.value;
			setVizProperty(property);
			analytics(GA_CAT.HOTKEY, GA_ACT.VIZ_TOGGLE_PROPERTY, property.key);
			break;
		case 'move3d' :
			var v = 100;
			switch (property.key) {
				case 'forward' :
					playingViz.properties.cameraX += Math.sin(playingViz.properties.yaw) * v;
					playingViz.properties.cameraY += Math.sin(playingViz.properties.pitch) * v;
					playingViz.properties.cameraZ += Math.cos(playingViz.properties.yaw) * v;
					break;
				case 'back' :
					playingViz.properties.cameraX -= Math.sin(playingViz.properties.yaw) * v;
					playingViz.properties.cameraY -= Math.sin(playingViz.properties.pitch) * v;
					playingViz.properties.cameraZ -= Math.cos(playingViz.properties.yaw) * v;
					break;
				case 'left' :
					playingViz.properties.cameraX += Math.sin(playingViz.properties.yaw + Math.PI / 2) * v;
					playingViz.properties.cameraZ += Math.cos(playingViz.properties.yaw + Math.PI / 2) * v;
					break;
				case 'right' :
					playingViz.properties.cameraX -= Math.sin(playingViz.properties.yaw + Math.PI / 2) * v;
					playingViz.properties.cameraZ -= Math.cos(playingViz.properties.yaw + Math.PI / 2) * v;
					break;
			}
			viz.properties.cameraX = playingViz.properties.cameraX;
			viz.properties.cameraY = playingViz.properties.cameraY;
			viz.properties.cameraZ = playingViz.properties.cameraZ;
			break;
	}
	updateGuiCallback(property.key);
}

class ControlManager() {

    var MB_LEFT = 0, MB_MIDDLE = 1, MB_RIGHT = 2;

    var
      viz = {},
      playingViz,
      scrollMode = new Array(2),
      leftDragMode = new Array(2),
      rightDragMode = new Array(2),
      properties,
      updateGuiCallback = _ef
      ;



    function initializeVizControls(_playingViz) {
      // the control manager keeps 2 copies of the viz. One for the playing viz which has properties that might be
      // changing as the viz plays and one copy of the viz as it copes from the server. Changes propagate from the
      // base viz to the playing viz and nevr the other way around.
      playingViz = _playingViz;
      var baseViz = _.find(WebAppService.vizList, {id: _playingViz.id});
      angular.copy(baseViz, viz);

      // initialise filter with saved values
      if(viz.type !== 'imageGlitcher'){
        ColorManager.applyFilter(viz.properties);
      }

      properties = $vizEngines.getProperties(viz.type);

      var comboActions = {};
      properties.forEach(function (property) {

        property.value = viz.properties[property.key];

        comboActions[property.combo] = comboActions[property.combo] || [];
        comboActions[property.combo].push(property);

        if (property.combo) {
          if (property.action === 'cycle') {
            hotkeys.add({
              combo: 'shift+' + property.combo,
              callback: function () {
                action(property, true);
              }
            });
          }
        }
      });

      for(var combo in comboActions) {
        createshorcutKey(combo, comboActions[combo])
      }
    }

    function createshorcutKey(combo, properties){
      hotkeys.add({
        combo: combo,
        callback: function () {
          properties.forEach(function(property){
            action(property);
          });
        }
      });
    }

    CanvasManager.onScroll(function(deltas) {

      analytics(GA_CAT.MOUSE, GA_ACT.SCROLL_CANVAS);

      for (var i = 0; i < deltas.length; i++) {
        var delta = deltas[i];
        if(scrollMode[i] && delta) {
          var value = viz.properties[scrollMode[i].key] || scrollMode[i].default;

          value += (scrollMode[i].linear ? scrollMode[i].step : value / 50) * (delta > 0 ? 1 : -1);

          if (scrollMode[i].wrap) {
            value = value > scrollMode[i].max ? scrollMode[i].min : value;
            value = value < scrollMode[i].min ? scrollMode[i].max : value;
          }
          else {
            value = value > scrollMode[i].max ? scrollMode[i].max : value;
            value = value < scrollMode[i].min ? scrollMode[i].min : value;
          }

          setProperty(scrollMode[i].key, value);

          if (scrollMode[i].filter) {
            ColorManager.applyFilter(viz.properties);
          }
          updateGuiCallback(scrollMode[i].key);
        }
      }
    });

    CanvasManager.onDrag(function(button, movementX, movementY) {
      switch(button){
        case MB_LEFT :
          if(leftDragMode[0]) {
            addToProperty(leftDragMode[0], movementX);
          }
          if(leftDragMode[1]) {
            addToProperty(leftDragMode[1], movementY);
          }
          break;
        case MB_RIGHT :
          if(rightDragMode[0]){
            addToProperty(rightDragMode[0], movementX);
          }
          if(rightDragMode[1]){
            addToProperty(rightDragMode[1], movementY);
          }
          break;
      }
    });

    function addToProperty(prop, value) {
      var moveFactor = prop.step === 1
          ? 1
          : prop.step / 60 * (prop.max - prop.min) // calibrated value
        ;
      if(viz.properties[prop.key] === null || viz.properties[prop.key] === undefined){
        viz.properties[prop.key] = prop.default;
      }
      viz.properties[prop.key] = playingViz.properties[prop.key] += value * moveFactor;
      updateGuiCallback(prop.key);
    }

    function setVizProperty(property) {
      var value = property.value;
      if (isNaN(value) || typeof value === 'boolean') {
        setProperty(property.key, value);
      }
      else {
        if (property.valueMap) {
          value = valueMap(property.valueMap, value, property.min, property.max);
        }
        setProperty(property.key, parseFloat(value));
      }
      if (property.filter) {
        ColorManager.applyFilter(viz.properties);
      }
      if (property.script || property.key === 'texture') {
        $vizEngines.updateScript(viz.type, property.key);
      }
    }

    function setProperty(key, value) {
      playingViz.properties[key] = viz.properties[key] = value;
    }

    function valueMap(map, val, min, max) {
      switch (map) {
        case 'no-easing' :
          return noEasing(val, min, 1, max / 4);
      }
    }

    function inverseValueMap(map, val, min, max) {
      switch (map) {
        case 'no-easing' :
          return noEasing_inverse(val, min, 1, max / 4);
      }
    }

    function updateGui(callback) {
      updateGuiCallback = callback;
    }

    function getViz() {
      return viz;
    }

    return {
      scroll: scroll,
      getViz: getViz,
      setVizProperty: setVizProperty,
      updateGui: updateGui,
      initializeVizControls: initializeVizControls,
      inverseValueMap: inverseValueMap
    };
  }
})();
