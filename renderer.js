const TO_RADIANS = Math.PI/180;
const TO_DEGREES = 180/Math.PI;
const D90 = Math.PI/2;
const D180 = Math.PI;
const D270 = Math.PI*1.5;
const D360 = Math.PI*2;
const PI = Math.PI;
const TAU = Math.PI*2;
const DIR_LEFT = D180;
const DIR_UP = D270;
const DIR_DOWN = D90;
const DIR_RIGHT = 0;

let canvas, ctx;

let earthViewRadius = 150;
let gpViewHeight = 300;
let verticalViewHeight = 150;
let horizontalWidth = 200;
let sightViewDistance = 300;
let viewArcRadius = 50;
let distanceGap = 15;
let fontSize = 16;
let flatViewSize = 400;
let starRad = 10;
let globeRadius = 3969;
let flatSize = 8000;

let starHeight = 3105;
let observerDistance = 69*45;
let dropAngle = 45*TO_RADIANS;

const thickWidth = 5;
const thinnWidth = 2;

const bgColor = '#222';
const textBgColor = `rgba(${0x22}, ${0x22}, ${0x22}, 0.5)`;
const starColor = '#ff0';
const verticalColor = '#ccc';
const sightColor = '#0bf';
const observerAngleColor = '#fb0';
const lineColor = '#777';
const distanceColor = '#f70';
const surfaceColor = '#ccc';
const elevationColor = '#fc0';

class Direction {
	constructor(radians = 0) {
		this.fromRadians(radians);
	}
	get degrees() {
		return this.radians*TO_DEGREES;
	}
	fromRadians(radians) {
		this.radians = radians;
		this.nx = Math.sin(radians);
		this.ny = - Math.cos(radians);
		this.global = D270 + radians;
		return this;
	}
	fromArray(x, y) {
		const length = Math.sqrt(x*x + y*y);
		const acos = Math.acos(-y/length);
		return this.fromRadians(x >= 0 ? acos : - acos);
	}
	fromDegrees(degrees) {
		return this.fromRadians(degrees*TO_RADIANS);
	}
	addRadians(radians) {
		return new Direction(this.radians + radians);
	}
	subRadians(radians) {
		return new Direction(this.radians - radians);
	}
	addDegrees(degrees) {
		return this.addRadians(degrees*TO_RADIANS);
	}
	subDegrees(degrees) {
		return this.subRadians(degrees*TO_RADIANS);
	}
	getTip(cx, cy, distance) {
		return [
			cx + this.nx*distance,
			cy + this.ny*distance,
		];
	}
}

const drawLine = (ax, ay, bx, by, color, lineWidth) => {
	if (color != null) {
		ctx.strokeStyle = color;
	}
	if (lineWidth != null) {
		ctx.lineWidth = lineWidth;
	}
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.lineTo(bx, by);
	ctx.stroke();
};

const drawArc = (x, y, angle0, angle1, color) => {
	const avrAngle = (angle0 + angle1)/2;
	const text = (Math.abs(angle0 - angle1)*TO_DEGREES).toFixed(1)*1 + '°';
	const { width } = ctx.measureText(text);
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, viewArcRadius, angle0, angle1);
	ctx.stroke();
	const tdx = Math.cos(avrAngle)*viewArcRadius;
	const tdy = Math.sin(avrAngle)*viewArcRadius;
	const tx = x + tdx;
	const ty = y + tdy;
	ctx.textBaseline = 'bottom';
	ctx.textAlign = tdx > 0 ? 'left' : 'right';
	ctx.fillStyle = textBgColor;
	ctx.fillStyle = color;
	ctx.fillText(text, tx, ty);
};

const drawStarAt = (cx, cy) => {
	ctx.fillStyle = starColor;
	ctx.beginPath();
	const r0 = starRad*0.3;
	const r1 = starRad;
	for (let i=0; i<10; ++i) {
		const rad = r0 + (r1 - r0)*(1 - i%2);
		const angle = i*D360/10;
		const x = cx + rad*Math.sin(angle);
		const y = cy - rad*Math.cos(angle);
		if (i) {
			ctx.lineTo(x, y);
		} else {
			ctx.moveTo(x, y);
		}
	}
	ctx.fill();
};

const drawFlatModelAt = (cx, cy) => {

	const scale = flatViewSize/flatSize;
	const starViewHeight = starHeight*scale;
	const sx = cx;
	const sy = cy - starViewHeight;
	const observerViewDistance = observerDistance*scale;
	const ox = cx + observerViewDistance;
	const oy = cy;
	const sightDir = new Direction().subRadians(dropAngle);

	// Draw vertical
	drawLine(ox, oy, ox, oy - verticalViewHeight, verticalColor, thinnWidth);

	// Draw surface
	drawLine(cx, cy, cx + flatViewSize, cy, surfaceColor, thickWidth);

	// Draw GP
	drawLine(cx, cy, cx, cy - sightViewDistance, lineColor, thinnWidth);

	// Draw star sight
	drawArc(ox, oy, DIR_LEFT, sightDir.global, elevationColor);
	drawArc(ox, oy, sightDir.global, DIR_UP, sightColor);
	drawLine(ox, oy, cx, cy - observerViewDistance*Math.tan(D90 - dropAngle));

	// Draw distance gap
	const dy = cy + distanceGap;
	drawLine(cx, dy, ox, dy, distanceColor);
	ctx.fillStyle = distanceColor;
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';
	ctx.fillText(`d = ${observerDistance.toFixed(1)*1}`, cx, dy + distanceGap);

	// Draw star height
	const dx = cx - distanceGap;
	drawLine(dx, cy, dx, cy - starViewHeight);
	ctx.textBaseline = 'bottom';
	ctx.textAlign = 'right';
	ctx.fillText(`h = ${starHeight}`, dx - distanceGap, cy);

	// Draw star
	drawStarAt(sx, sy);
};

const drawGlobeModelAt = (cx, cy) => {

	const upDir = new Direction();
	const observerDir = new Direction(observerDistance/globeRadius);
	const sightDir = observerDir.subRadians(dropAngle);
	const [ ox, oy ] = observerDir.getTip(cx, cy, earthViewRadius);

	// Draw vertical line
	drawLine(
		cx, cy,
		...observerDir.getTip(ox, oy, verticalViewHeight),
		verticalColor,
		thinnWidth,
	);
	drawArc(cx, cy, upDir.global, observerDir.global, verticalColor);

	// Draw horizon
	drawLine(
		... observerDir.subDegrees(90).getTip(ox, oy, horizontalWidth*0.5),
		... observerDir.addDegrees(90).getTip(ox, oy, horizontalWidth*0.5),
		lineColor,
		thinnWidth,
	);

	// Draw GP line
	drawLine(
		cx, cy,
		...upDir.getTip(cx, cy, earthViewRadius + gpViewHeight),
		lineColor, thinnWidth,
	);

	// Draw earth
	ctx.lineWidth = thickWidth;
	ctx.strokeStyle = surfaceColor;
	ctx.beginPath();
	ctx.arc(
		cx, cy, earthViewRadius,
		upDir.subDegrees(90).global,
		upDir.addDegrees(90).global,
	);
	ctx.stroke();
	ctx.beginPath();

	// Draw sight
	drawLine(ox, oy, ...sightDir.getTip(ox, oy, sightViewDistance), sightColor, thinnWidth);
	drawArc(ox, oy, sightDir.global, observerDir.global, sightColor);
	drawArc(ox, oy, observerDir.subDegrees(90).global, sightDir.global, elevationColor);

	// Draw distance
	const distRadius = earthViewRadius - distanceGap;
	const textDir = new Direction((upDir.radians + observerDir.radians)/2);
	ctx.fillStyle = distanceColor;
	ctx.strokeStyle = distanceColor;
	ctx.lineWidth = thinnWidth;
	ctx.beginPath();
	ctx.arc(
		cx, cy,
		distRadius,
		upDir.global,
		observerDir.global,
	);
	ctx.stroke();
	ctx.textBaseline = 'top';
	ctx.textAlign = 'right';
	ctx.fillText(`d = ${observerDistance.toFixed(1)*1}`, ...textDir.getTip(cx, cy, distRadius));

	// Draw radius
	drawLine(cx - earthViewRadius, cy + distanceGap, cx, cy + distanceGap, distanceColor);
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';
	ctx.fillStyle = distanceColor;
	ctx.fillText(
		`r = ${globeRadius.toFixed(1)*1}`,
		cx - earthViewRadius, 
		cy + distanceGap*2,
	);
};

const render = () => {
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.font = `${fontSize}px monospace`;
	let freeSpace = canvas.width - earthViewRadius*2 - flatViewSize;
	let midSpace = Math.max(220, freeSpace*0.2);
	let sideSpace = (freeSpace - midSpace)/2;
	let y = canvas.height - 100;
	drawGlobeModelAt(sideSpace + earthViewRadius, y);
	drawFlatModelAt(earthViewRadius*2 + sideSpace + midSpace, y);
};

export const resize = (width, height) => {
	canvas.width = width;
	canvas.height = height;
	render();
};

export const init = (domElement) => {
	canvas = domElement;
	ctx = canvas.getContext('2d');
	resize(1100, 600);
};

export const update = (config) => {
	if (config.starHeight != null) {
		starHeight = config.starHeight*1;
	}
	if (config.observerDistance != null) {
		observerDistance = config.observerDistance*1;
	}
	if (config.dropAngle != null) {
		dropAngle = config.dropAngle*TO_RADIANS;
	}
	render();
};
