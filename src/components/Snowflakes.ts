import { GameScene } from "@/scenes/GameScene"

export class Footprint extends Phaser.GameObjects.Container {
    public scene: GameScene

    constructor(scene: GameScene, x: number, y: number) {
        super(scene, x, y)
        scene.add.existing(this)
        this.scene = scene
    }
}
