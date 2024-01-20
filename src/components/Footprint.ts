import { GameScene } from "@/scenes/GameScene";
export class Footprint extends Phaser.GameObjects.Container {

    public scene: GameScene;
    public alive: boolean;
    public aliveTime: number;

	private sprite: Phaser.GameObjects.Sprite;
	private spriteSize: number;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

        this.aliveTime = 0;

		/* Sprite */
		this.spriteSize = 30;
		this.sprite = this.scene.add.sprite(0, 0, "footprint");
		this.sprite.setOrigin(0.5, 0.5);
		this.sprite.y += this.spriteSize / 2;
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.add(this.sprite);
	}

    update(time: number, delta: number) {
        this.aliveTime += delta;

        if (this.aliveTime > 10_000) {this.destroy()}
    }
}