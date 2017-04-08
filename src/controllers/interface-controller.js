import RenderController from './render-controller.js';
import PlayerController from './player-controller.js';
import SoundService from '../services/sound-service.js';
import WebService from '../services/web-service.js';
import CanvasController from './canvas-controller.js';
import AudioController from './audio-controller.js';
import when from '../misc/when.js';

let sourceWindow = null;

function getProperties() {
	return new Promise(resolve => {
		when(() => PlayerController.getCurrentSet() !== undefined,
			resolve(PlayerController.getCurrentSet().getProperties()))
	});
}

window.addEventListener('message', function (event) {

	// TODO check origin
	switch (event.data.operation) {

		case 'ping' :
			event.source.postMessage({operation: 'pong'}, '*');
			window.onbeforeunload = function (e) {
				event.source.postMessage({
					operation: 'unloadingVizWindow'
				}, '*');
			};
			break;

		case 'playViz' :
			PlayerController
				.playById(event.data.value)
				.then(() => getProperties()
					.then(currentVizProperties =>
						event.source.postMessage({
							operation: 'currentVizProperties',
							value: currentVizProperties
						}, '*')));
			break;

		case 'setTrackPosition' :
			AudioController.setTime(event.data.value);
			break;

		case 'playTrack':
			SoundService.playTrack(event.data.value.track, event.data.value.time);
			SoundService.addTimeupdateCallbacks(function (time, duration) {
				event.source.postMessage({
					operation: 'trackProgress',
					value: {
						time: time,
						duration: duration
					}
				}, '*');
			});
			break;

		case 'pauseTrack':
			SoundService.pause();
			break;
		case 'resumeTrack':
			SoundService.resume();
			break;
		case 'close':
			window.close();
			break;
		case 'toggleMic':
			if (event.data.value) {
				SoundService.startAudioCapture(
					function () {
						console.log('connected');
					},
					function (e) {
						console.log(e)
					}
				);
			}
			else {
				SoundService.closeMic();
			}
			break;

		case 'setMute':
			AudioController.setMuted(event.data.value);
			break;

		case 'toggleFullScreen':
			CanvasController.toggleFullScreen();
			break;

		case 'updateVizProperty':
			const vizProperties = PlayerController.getCurrentSet().getVizProperties();
			vizProperties[event.data.value.key] = event.data.value.value;
			if (event.data.value.filter || event.data.value.script) {
				PlayerController.getCurrentSet().updateScript();
			}
			break;

		case 'playTexture':
			PlayerController.getCurrentSet().setTexture(event.data.value);
			break;

		case 'resetViz':
			PlayerController.reset();
			break;

		case 'updatePropertyScripts':
			var vizProperties = PlayerController.getCurrentSet().getProperties();
			console.log(event.data.value);
			RenderController.updatePropertyScripts(event.data.value, vizProperties);
			break;

		case 'getPreviewImage':
			event.source.postMessage({
				operation: 'getPreviewImage',
				value: WebService.getImageDataUrl()
			}, '*');

			break;


		default :
			console.error('Uncaught message' + JSON.stringify(event.data));
	}

}, false);

window.onclose = function () {
	if (sourceWindow) {
		sourceWindow.postMessage('close', '*');
	}
};
