import {
	WebGLRenderer,
	PerspectiveCamera,
	Scene,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	CircleBufferGeometry,
	RawShaderMaterial,
	TextureLoader,
	Mesh,
	Color,
	Group
} from 'three';
import {load3dModel} from './services/load-3d-model.js';
import CanvasController from './controllers/canvas-controller.js';
import config from './core/config.js';
// import SoundService from './services/sound-service.js';

const vertexShader = 'precision highp float; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; attribute vec3 position; attribute vec2 uv; attribute vec3 normal; attribute vec3 translate; attribute float scale; attribute vec3 color; varying vec2 vUv; varying vec3 vColor; void main() { vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 ); mvPosition.xyz += position * scale; vUv = uv; vColor = color; gl_Position = projectionMatrix * mvPosition; }';
const fragmentShader = 'precision highp float; uniform sampler2D map; varying vec2 vUv; varying vec3 vColor; void main() { vec4 diffuseColor = texture2D( map, vUv ); gl_FragColor = vec4( diffuseColor.xyz * vColor, diffuseColor.w ); if ( diffuseColor.w < 0.5 ) discard; }';

const DEFAULT_FIELD_LENGTH = 1300;
let fieldLength = DEFAULT_FIELD_LENGTH;

const MAX_PARTICLE_SIZE = 5;
let particleSize = 1;

const sprites = [
	'vizamp',
	'ant',
	'ball',
	'cactus',
	'circle',
	'cube',
	'face',
	'face2',
	'flower',
	'pattern',
	'shark-teeth',
	'snowflake'
];
let currentSprite = 0;

const views = [
	{	/* bottom left */
		left: 0,
		bottom: 0,
		width: 0.5,
		height: 0.5,
		background: new Color().setRGB(0, 0, 0),
		eye: [ fieldLength, 0, 0 ],
		up: [ 0, 0, 1 ],
		fov: 60,
		rotation: [ -Math.PI/4, Math.PI/2, 0 ],
		updateEye: view => {
			view.eye = [ fieldLength, 0, 0 ];
		}
	},
	{	/* bottom right */
		left: 0.5,
		bottom: 0,
		width: 0.5,
		height: 0.5,
		background: new Color().setRGB(0, 0, 0),
		eye: [ 0, fieldLength, 0 ],
		up: [ 0, 0, 1 ],
		fov: 60,
		rotation: [ -Math.PI/2, 0, -Math.PI/4 ],
		updateEye: view => {
			view.eye = [ 0, fieldLength, 0 ];
		}
	},
	{	/* top right */
		left: 0.5,
		bottom: 0.5,
		width: 0.5,
		height: 0.5,
		background: new Color().setRGB(0, 0, 0),
		eye: [ -fieldLength, 0, 0 ],
		up: [ 0, 0, 1 ],
		fov: 60,
		rotation: [ Math.PI/2, -Math.PI/2, Math.PI/4 ],
		updateEye: view => {
			view.eye = [ -fieldLength, 0, 0 ];
		}
	},
	{	/* top left */
		left: 0,
		bottom: 0.5,
		width: 0.5,
		height: 0.5,
		background: new Color().setRGB(0, 0, 0),
		eye: [ 0, -fieldLength, 0 ],
		up: [ 0, 0, 1 ],
		fov: 60,
		rotation: [ Math.PI/2, 0, -Math.PI/4 ],
		updateEye: view => {
			view.eye = [ 0, -fieldLength, 0 ];
		}
	}
];

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let
	canvas, scene, renderer,
	geometry, material, pivot,

	properties,

	vo = 0, vs = 1, vc = 20,
	time,
	waveForm = 1,
	colorForm = 1,
	colorformSoundVector,
	waveformSoundVector,
	waveformSoundByte,
	colorformSoundByte,

	vertices,
	translate,
	translateArray,
	scale,
	scaleArray,
	colors,
	colorsArray,
	spinRate = 0.01
	;

export function play(_properties) {

	canvas = CanvasController.initialize();
	properties = _properties;
	renderer = new WebGLRenderer({
		canvas: canvas,
		preserveDrawingBuffer: true
	});

	scene = new Scene();

	for (let ii =  0; ii < views.length; ++ii ) {
		const view = views[ii];
		const camera = new PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.up.x = view.up[ 0 ];
		camera.up.y = view.up[ 1 ];
		camera.up.z = view.up[ 2 ];
		camera.lookAt( scene.position );
		view.camera = camera;
	}

	geometry = new InstancedBufferGeometry();
	geometry.copy(new CircleBufferGeometry(1, 6));

	load3dModel(properties.model).then(verticesArray => {

		vertices = new Float32Array(verticesArray);
		const vCount = verticesArray.length / 3;
		translateArray = new Float32Array(verticesArray);
		scaleArray = new Float32Array(vCount);
		colorsArray = new Float32Array(vCount * 3);

		geometry.addAttribute("translate", new InstancedBufferAttribute(translateArray, 3, 1));
		geometry.addAttribute("scale", new InstancedBufferAttribute(scaleArray, 1, 1).setDynamic(true));
		geometry.addAttribute("color", new InstancedBufferAttribute(colorsArray, 3, 1).setDynamic(true));

		material = new RawShaderMaterial({
			uniforms: {
				map: {
					type: "t",
					value: new TextureLoader().load(getSprite())
				}
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			depthTest: true,
			depthWrite: true
		});

		const mesh = new Mesh(geometry, material);
		mesh.scale.set(500, 500, 500);
		pivot = new Group();
		scene.add(pivot);

		mesh.rotation.set( Math.PI/2, 0, 0);

		pivot.add(mesh);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(windowWidth, windowHeight);

		animate();
	});
}

export function getSprite() {
	const sprite = `${config.base}/assets/images/sprites/${sprites[currentSprite]}.png`;
	currentSprite++;
	currentSprite %= sprites.length;
	return sprite;
}


function animate() {
	requestAnimationFrame(animate);
	render();
}

window.twirl = function(){
	let theta = 0.01;
	const twirlInterval = setInterval(() => {
		theta += 0.1;
		spinRate = Math.sin(theta) / 2;
		if(theta >= Math.PI){
			clearInterval(twirlInterval);
			spinRate = 0.01;
		}
	}, 16)
};

window.zoomOut = function(){
	let theta = 0;
	const popInterval = setInterval(() => {
		theta += 0.1;
		fieldLength = DEFAULT_FIELD_LENGTH + Math.sin(theta) * 8000;
		if(theta >= Math.PI){
			clearInterval(popInterval);
			fieldLength = DEFAULT_FIELD_LENGTH;
		}
	}, 16)
};

window.zoomIn = function(){
	let theta = 0;
	const popInterval = setInterval(() => {
		theta += 0.05;
		fieldLength = DEFAULT_FIELD_LENGTH - Math.sin(theta) * 1500;
		if(theta >= Math.PI){
			clearInterval(popInterval);
			fieldLength = DEFAULT_FIELD_LENGTH;
		}
	}, 16)
};

window.changeTexture = function(){
	material.uniforms.map.value = new TextureLoader().load(getSprite());
	material.needsUpdate = true;
};

window.changeParticleSize = function(){
	particleSize = (particleSize % MAX_PARTICLE_SIZE) + 1;
};

window.changeColor = function(){
	particleSize = (particleSize % MAX_PARTICLE_SIZE) + 1;
};

function render() {

	// const td = SoundService.getTimeDomainData();
	// const soundByte = properties.timeOrFrequency ? fd : td;
	//
	// const soundByteCount = soundByte ? soundByte.length : 0;

	// RenderController.processTriggerUpdates(properties, td, fd, updateScript);

	time = performance.now() * 0.0005;

	properties.rotateZ += spinRate;

	pivot.rotation.set(
		properties.rotateX,
		properties.rotateY,
		properties.rotateZ
	);

	translate = geometry.getAttribute('translate');
	translateArray = translate.array;

	scale = geometry.getAttribute('scale');
	scaleArray = scale.array;

	colors = geometry.getAttribute('color');
	colorsArray = colors.array;

	const color = new Color(0xffffff);

	vs++;
	if (vs % vc === 0) {
		vs = 0;
		vo++;
		vo %= scaleArray.length;
	}

	for (let i = 0; i < scaleArray.length; i++) {

		if (waveformSoundByte !== undefined) {
			waveformSoundVector = waveformSoundByte[i % soundByteCount] / 128;
			waveForm = waveformSoundVector + ((1 - waveformSoundVector) * properties.waveformFactor);
		}
		else {
			waveForm = 1;
		}
		if (colorformSoundByte !== undefined) {
			colorformSoundVector = colorformSoundByte[i % soundByteCount] / 128;
			colorForm = colorformSoundVector + ((1 - colorformSoundVector) * properties.colorformFactor);
		}
		else {
			colorForm = 1;
		}

		const i3 = i * 3;
		const ii3 = ((i + vo) % scaleArray.length) * 3;
		const vt = 1 / vc * vs;

		translateArray[i3] = vertices[ii3] + (vertices[ii3 + 3] - vertices[ii3]) * vt;
		translateArray[i3 + 1] = vertices[ii3 + 1] + (vertices[ii3 + 4] - vertices[ii3 + 1]) * vt;
		translateArray[i3 + 2] = vertices[ii3 + 2] + (vertices[ii3 + 5] - vertices[ii3 + 2]) * vt;

		const x = translateArray[i3] + time;
		const y = translateArray[i3 + 1] + time;
		const z = translateArray[i3 + 2] + time;
		const scl = Math.abs(Math.sin(x * 2.1) + Math.cos(y * 3.2) + Math.sin(z * 4.3));

		scaleArray[i] = scl * 20 * waveForm * properties.radius * particleSize;

		color.setHSL(Math.sin(i / scaleArray.length), 1, 0.5);

		colorsArray[i3] = 0.3 + (colorForm * color.r * (Math.sin(time % (4 * Math.PI)) + 1) / 2) * 0.7;
		colorsArray[i3 + 1] = color.g * Math.pow(colorForm, 3);
		colorsArray[i3 + 2] = 0.3 + (10 * colorForm * color.b * (Math.sin(time % (4 * Math.PI)) + 1) / 2) * 0.7;
	}

	translate.needsUpdate = true;
	scale.needsUpdate = true;
	colors.needsUpdate = true;

	for (let ii = 0; ii < views.length; ++ii) {
		const view = views[ii];
		const camera = view.camera;
		// view.updateCamera( camera, scene );
		const left   = Math.floor( windowWidth  * view.left );
		const bottom = Math.floor( windowHeight * view.bottom );
		const width  = Math.floor( windowWidth  * view.width );
		const height = Math.floor( windowHeight * view.height );
		renderer.setViewport( left, bottom, width, height );
		renderer.setScissor( left, bottom, width, height );
		renderer.setScissorTest( true );
		renderer.setClearColor( view.background );
		view.updateEye(view);
		camera.position.x = view.eye[ 0 ];
		camera.position.y = view.eye[ 1 ];
		camera.position.z = view.eye[ 2 ];
		camera.rotation.x = view.rotation[ 0 ];
		camera.rotation.y = view.rotation[ 1 ];
		camera.rotation.z = view.rotation[ 2 ];

		camera.updateProjectionMatrix();

		renderer.render(scene, camera );
	}
}
