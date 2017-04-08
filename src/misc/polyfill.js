let requestAnimationTimeout;

window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        requestAnimationTimeout = window.setTimeout(callback, 1000 / 60);
    };

window.cancelAnimationFrame =
    window.cancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    function () {
        window.clearTimeout(requestAnimationTimeout);
    };

document.
    documentElement.requestFullscreen =
    document.documentElement.requestFullscreen ||
    document.documentElement.msRequestFullscreen ||
    document.documentElement.mozRequestFullScreen ||
    document.documentElement.webkitRequestFullscreen;

document.exitFullscreen =
    document.exitFullscreen ||
    document.msExitFullscreen ||
    document.mozCancelFullScreen ||
    document.webkitExitFullscreen;


window.AudioContext =
    window.AudioContext ||
    window.webkitAudioContext;

window.Audio =
    window.Audio ||
    window.webkitAudio;

navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

