
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
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.addEventListener('dblclick', this.toggleFullScreen);
        canvas.addEventListener('mousedown', mouseDownHandler);
        canvas.addEventListener('mouseup', mouseUpHandler);
        canvas.addEventListener('mousemove', mouseMoveHandler);
        canvas.addEventListener('mouseout', mouseOutHandler);
        canvas.addEventListener('wheel', wheelHandler);
        canvas.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        return canvas;
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
}

const canvasController = new CanvasController();

export default canvasController;