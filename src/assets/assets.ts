import { Image, SpriteSheet, Audio, Level } from './util';
import { image, sound, music, level, loadFont, spritesheet } from './util';

/* Images */
const images: Image[] = [
	// Backgrounds
	image('backgrounds/background', 'background'),

	// Tilesets
	image('tilesets/debugtiles', 'debugtiles'),

	// Particles
	image('particles/snowflake', 'snowflake'),
	image('particles/sparkle', 'sparkle'),

	// UI
	image('ui/hud', 'hud'),

	// Titlescreen
	image('titlescreen/sky', 'title_sky'),
	image('titlescreen/background', 'title_background'),
	image('titlescreen/foreground', 'title_foreground'),
	image('titlescreen/character', 'title_character'),
];

/* Spritesheets */
const spritesheets: SpriteSheet[] = [
	spritesheet('characters/player', 'player', 380, 540),
	spritesheet('particles/footprint', 'footprint', 128, 128),

];

/* Audios */
const audios: Audio[] = [
	music('bgm', 'bgm'),
	// sound('tree/rustle', 't_rustle', 0.5),
];

/* Levels */
const levels: Level[] = [
	level('level', 'level'),
]

/* Fonts */
await loadFont('PlaypenSans-SemiBold', 'Game Font');

export {
	images,
	spritesheets,
	levels,
	audios
};