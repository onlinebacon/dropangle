import * as Renderer from './renderer.js';

const canvas = document.querySelector('canvas');
Renderer.init(canvas);

const setterMap = {};
const config = {};
const inputs = [...document.querySelectorAll('input[type="range"]')];

let mode;

for (let input of inputs) {
	const name = input.getAttribute('name');
	const valueDiv = input.parentElement.querySelector('div.value');
	const setter = (value) => {
		valueDiv.innerText = (value*1).toFixed(1)*1;
		input.value = value;
		config[name] = value;
		Renderer.update(config);
	};
	setterMap[name] = setter;
	input.addEventListener('input', () => {
		setter(input.value);
		mode(name);
	});
	setter(input.value);
}

const modeInputs = [...document.querySelectorAll('[name="mode"]')];
const modeMap = {
	free: () => {},
	trig: (field = 'observerDistance') => {
		const updateDrop = () => {
			const { observerDistance, starHeight } = config;
			const tan = observerDistance/starHeight;
			const radians = Math.atan(tan);
			const angle = radians/Math.PI*180;
			setterMap.dropAngle(angle);
		};
		const updateDistance = () => {
			const { dropAngle, starHeight } = config;
			const angle = dropAngle/180*Math.PI;
			const slope = Math.tan(angle);
			const distance = starHeight*slope;
			setterMap.observerDistance(distance);
		};
		if (field === 'observerDistance') updateDrop();
		if (field === 'dropAngle') updateDistance();
		if (field === 'starHeight') updateDrop();
 	},
	linear: (field = 'observerDistance') => {
		const factor = 69;
		const updateDrop = () => {
			setterMap.dropAngle(config.observerDistance/factor);
		};
		const updateDistance = () => {
			setterMap.observerDistance(config.dropAngle*factor);
		};
		if (field === 'observerDistance') updateDrop();
		if (field === 'dropAngle') updateDistance();
		if (field === 'starHeight') updateDrop();
 	},
};

const updateMode = () => {
	const name = modeInputs.find(input => input.checked).value;
	mode = modeMap[name];
	mode();
};

for (const input of modeInputs) {
	const modeName = input.getAttribute('value');
	input.addEventListener('input', updateMode);
}

updateMode();
