import { Image, SpriteSheet, Audio, Level } from './util';
import { image, sound, music, level, loadFont, spritesheet } from './util';

/* Images */
const images: Image[] = [
	// Backgrounds
	image('backgrounds/background', 'background'),

	// Tilesets
	image('tilesets/debugtiles', 'debugtiles'),

	// Particles
	image('particles/footprint', 'footprint'),
	image('particles/snowflake', 'snowflake'),

	// Items
	image('items/coin', 'coin'),

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

];

/* Audios */
const audios: Audio[] = [
	music('title', 'm_main_menu'),
	music('first', 'm_first'),
	sound('tree/rustle', 't_rustle', 0.5),
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