const Data = {
	"bgm": {
		offset: 0,
		bpm: 169,
		loop: true,
		start: 11.360,
		end: 79.427,
	},
};

export type MusicKey = keyof typeof Data;
export type MusicDataType = {
	[K in MusicKey]: {
		offset: number;
		bpm: number;
		loop: boolean;
		start: number;
		end: number;
	};
};

export default Data as MusicDataType;
