
const buttonsDragged = [ false, false, false ];

let onDragCallback = function () {};
let onScrollCallback = function () {};
let onMouseOutCallback = function () {};
let onMoveCallback = function () {};
let onFullScreenChangeCallback = function () {};

function isFullScreen() {
    return document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
}

function mouseDownHandler(e) {
    buttonsDragged[e.button] = true;
}

function mouseUpHandler(e) {
    buttonsDragged[e.button] = false;
}

function mouseMoveHandler(e) {
    if (buttonsDragged[0]) {
        onDragCallback(0, e.movementX, e.movementY);
    }
    else if (buttonsDragged[1]) {
        onDragCallback(1, e.movementX, e.movementY);
    }
    else if (buttonsDragged[2]) {
        onDragCallback(2, e.movementX, e.movementY);
    }
    else {
        onMoveCallback();
    }
    e.stopPropagation();
}

function mouseOutHandler() {
    onMouseOutCallback();
}

function wheelHandler(e) {
    if (e.wheelDeltaX || e.wheelDeltaY) {
        onScrollCallback([e.wheelDeltaX, e.wheelDeltaY]);
    }
    e.stopPropagation();
}

class CanvasController {

    // fullScreen = false;

    initialize() {
        const original = document.getElementById('player-canvas');
        const canvas = original.cloneNode(false);
        original.parentNode.replaceChild(canvas, original);
        this.resizCanvas(canvas);
        canvas.addEventListener('dblclick', this.toggleFullScreen);
        canvas.addEventListener('mousedown', mouseDownHandler);
        canvas.addEventListener('mouseup', mouseUpHandler);
        canvas.addEventListener('mousemove', mouseMoveHandler);
        canvas.addEventListener('mouseout', mouseOutHandler);
        canvas.addEventListener('wheel', wheelHandler);
        canvas.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });
        window.addEventListener("resize", () => this.resizCanvas(canvas));
        return canvas;
    }

    resizCanvas(canvas) {
		const size = window.innerHeight;
		canvas.width = size;
		canvas.height = size;
		canvas.style.width = `${size}px`;
		canvas.style.height = `${size}px`;
		canvas.style.top = '0';
		canvas.style.left = '0';
		console.log((window.innerWidth - size) / 2);
    }

    toggleFullScreen() {
        if (isFullScreen()) {
            document.exitFullscreen();
            this.fullScreen = false;
        }
        else {
            document.documentElement.requestFullscreen();
            this.fullScreen = true;
        }
        onFullScreenChangeCallback(this.fullScreen);
        setTimeout(() => {
			const canvas = document.getElementById('player-canvas');
			this.resizCanvas(canvas);
        }, 100);

    }

    onFullscreenChange(callback) {
        onFullScreenChangeCallback = callback;
    }

    onDrag(callback) {
        onDragCallback = callback;
    }

    onScroll(callback) {
        onScrollCallback = callback;
    }

    onMouseOut(callback) {
        onMouseOutCallback = callback;
    }

    onMove(callback) {
        onMoveCallback = callback;
    }

    // delete if not needed
    getImageDataUrl() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Calculates css filter values and and applies them to the canvas
     * @param viz
     */
    applyFilter(viz) {

      const f = [];
      const canvas = document.getElementById('player-canvas');

      if (viz.brightness !== 1) {
          f.push(`brightness(${viz.brightness})`);
      }
      if (viz.contrast !== 1) {
          f.push(`contrast(${viz.contrast})`);
      }
      if (viz.blur > 0) {
          f.push(`blur(${viz.blur}px)`);
      }
      if (viz.grayscale > 0) {
          f.push(`grayscale(${viz.grayscale})`);
      }
      if (viz.sepia > 0) {
          f.push(`sepia(${viz.sepia})`);
      }
      if (viz.hue > 0) {
          f.push(`hue-rotate(${viz.hue}deg)`);
      }
      if (viz.invert) {
          f.push(`invert(1.0)`);
      }
      if (viz.saturate !== 1) {
          f.push(`saturate(${viz.saturate})`);
      }
      if (canvas) {
          canvas.style.filter = canvas.style.webkitFilter = f.join(' ');
      }
    }
}

const canvasController = new CanvasController();

export default canvasController;