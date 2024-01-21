const NORMAL = 0, MAGIC = 1;

import { RAINBOW, RGBtoInteger } from "@/assets/util";
import { GameScene } from "@/scenes/GameScene";
export class Footprint extends Phaser.GameObjects.Container {

    public scene: GameScene;
    public aliveTime: number;
    public index: number;
    public roomName: string | undefined;

	public sprite: Phaser.GameObjects.Sprite;
	private spriteSize: number;

    private _magical: boolean;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

        this.aliveTime = 0;
        this._magical = false;

		/* Sprite */
		this.spriteSize = 30;
		this.sprite = this.scene.add.sprite(0, 0, "footprint", NORMAL);
		this.sprite.setOrigin(0.5, 0.5);
		this.sprite.y += this.spriteSize / 2;
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.add(this.sprite);
	}

    update(time: number, delta: number) {
        this.aliveTime += delta;
        // if (this.aliveTime > 10_000) {this.destroy()}

        this.roomName = this.scene.getRoom(
            new Phaser.Geom.Rectangle(this.x, this.y, 1, 1)
        )

        if (this.magical) {
            this.rotation += (this.index % 5 - 2.5) * (delta*1e-3)
        }
    }

    
    public set magical(isMagical : boolean) {
        this._magical = isMagical;

        if (isMagical) {
            this.sprite.setFrame(MAGIC)
            this.sprite.setTint(0x606154)
            this.sprite.setAlpha(42/256)

            const tint = Phaser.Display.Color.IntegerToColor(Phaser.Math.RND.pick(RAINBOW)).brighten(10).desaturate(30)

            this.scene.tweens.add({
                targets: this.sprite,
                duration: 250,
                startDelay: this.index * (250/40),
                alpha: {from: 42/256, to: 1},
                onUpdate: (tween) => {
                    const now = Phaser.Display.Color.Interpolate.ColorWithRGB(tint, 96, 97, 84, 1, 1-tween.progress)
                    this.sprite.tint = RGBtoInteger(now.r, now.g, now.b)
                }
            })

        }
    }

    public get magical() : boolean { return this._magical }
    
    
}