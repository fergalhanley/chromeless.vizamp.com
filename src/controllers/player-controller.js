
import VizEngines from '../viz-engines/viz-engines.js';

class PlayerController {

	currentSet;

	playById(id) {
		return new Promise( resolve => {
			const index = _.findIndex(WebAppService.vizList, {id: id});
			if (index === -1) {
				WebAppService.getViz(id).then( viz => {

					this.currentSet = VizEngines.get(viz.type);

					this.currentSet.play(viz);

					ColorController.initialize(this.currentSet.getCanvas(), viz.properties);
					ControlManager.initializeVizControls(viz);

					WebAppService.viewViz(viz.id);
					RenderManager.vizStart(viz);
					resolve();
				});
			}
			else {
				this.playIndex = index;
				play();
				resolve();
			}
		});
	}

	reset() {

	}

	getCurrentSet() {
		return currentSet;
	}
}

const playerController = new PlayerController();

export default playerController;
