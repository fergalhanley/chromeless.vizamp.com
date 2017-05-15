
import config from '../core/config.js';

const process3dDataWorker = function () {

	function getDistance(x1, y1, z1, x2, y2, z2) {
		const dx = x1 - x2;
		const dy = y1 - y2;
		const dz = z1 - z2;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	onmessage = function (e) {
		//convert the 3d vertices to a Float32Array
		const vertices = [];
		e.data.split('\n').forEach(function (line) {
			if (line.startsWith('v ')) {
				var vertex = line.split(' ');
				vertices.push({
					x: parseFloat(vertex[1]), // that's right... 1
					y: parseFloat(vertex[2]),
					z: parseFloat(vertex[3])
				});
			}
		});
		//vertices.sort(function compare(a,b) { return a.y < b.y ? -1 : a.y > b.y ? 1 : 0; });
		// sort vertices in order of the next closest
		let lastVertex = vertices[0];
		vertices.splice(0, 1);
		const verticesArray = [lastVertex.x, lastVertex.y, lastVertex.z];
		do {
			let _i, d, _d = 9999;
			for (let i = 0; i < vertices.length; i++) {
				d = getDistance(lastVertex.x, lastVertex.y, lastVertex.z,
					vertices[i].x, vertices[i].y, vertices[i].z);
				if (d < _d) {
					_d = d;
					_i = i;
				}
			}

			verticesArray.push(vertices[_i].x, vertices[_i].y, vertices[_i].z);
			lastVertex = vertices[_i];
			vertices.splice(_i, 1);

		} while (vertices.length);

		postMessage(verticesArray);
	}
};

const blobURL = URL.createObjectURL(new Blob(
	['(', process3dDataWorker.toString(), ')()'],
	{type: 'application/javascript'}
));

const worker = new Worker(blobURL);

URL.revokeObjectURL(blobURL);

export function load3dModel(name, callback) {
	return new Promise( resolve => {
		fetch(`${config.base}assets/3d-models/${name}.obj`, { method: 'GET'})
			.then( res => res.text() )
			.then( data => worker.postMessage(data) );

		worker.onmessage = function (event) {
			resolve(event.data);
		};
	});
}

