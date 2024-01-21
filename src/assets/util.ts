export interface Image {
	key: string;
	path: string;
}

export interface SpriteSheet {
	key: string;
	path: string;
	width: number;
	height: number;
}

export interface Audio {
	key: string;
	path: string;
	volume?: number;
	rate?: number;
}

export interface Level {
	key: string;
	path: string;
}

const imageGlob = import.meta.glob('./images/**/*.png', {as: 'url', eager: true});
export const image = (path: string, key: string): Image => {
	return { key, path: imageGlob[`./images/${path}.png`] };
}

export const spritesheet = (path: string, key: string, width: number, height: number): SpriteSheet => {
	return { key, width, height, path: imageGlob[`./images/${path}.png`] };
}

const musicGlob = import.meta.glob('./music/**/*.ogg', {as: 'url', eager: true});
export const music = (path: string, key: string, volume?: number, rate?: number): Audio => {
	return { key, volume, rate, path: musicGlob[`./music/${path}.ogg`] };
}

const audioGlob = import.meta.glob('./sounds/**/*.ogg', {as: 'url', eager: true});
export const sound = (path: string, key: string, volume?: number, rate?: number): Audio => {
	return { key, volume, rate, path: audioGlob[`./sounds/${path}.ogg`] };
}

const levelGlob = import.meta.glob('./levels/**/*.json', {as: 'url', eager: true});
export const level = (path: string, key: string): Level => {
	return { key, path: levelGlob[`./levels/${path}.json`] };
}

const fontGlob = import.meta.glob('./fonts/**/*.ttf', {as: 'url', eager: true});
export const loadFont = async (path: string, name: string) => {
	const face = new FontFace(name, `url(${fontGlob[`./fonts/${path}.ttf`]})`, {style: 'normal', weight: '400'});
	await face.load();
	document.fonts.add(face);
}

export type ObjectWithRandomPoint = {
	getRandomPoint: (point?: any) => Phaser.Geom.Point;
}

export const randomZoneFromShape = (shape: ObjectWithRandomPoint) => new Phaser.GameObjects.Particles.Zones.RandomZone({
	getRandomPoint(point) {
		const newPoint = shape.getRandomPoint();
		point.x = newPoint.x;
		point.y = newPoint.y;
	},
})

export const clone = (source: any) => JSON.parse(JSON.stringify(source))

export const RGBtoInteger = (r: number, g: number, b: number) => (r << 16) + (g << 8) + (b << 0);

export const RAINBOW = [
    0xff3300,
    0xff6600,
    0xff9900,
    0xffbb00,
    0xffee00,
    0xffff00,
    0xaaff00,
    0x66ff00,
    0x22ff00,
    0x11ff66,
    0x00ffee,
    0x00ccff,
    0x0099ff,
    0x0066ff,
    0x6600ff,
    0xaa00aa,
    0xcc0066,
    0xff00aa,
]
