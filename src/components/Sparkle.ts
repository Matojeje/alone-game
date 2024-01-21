import { GameScene } from "@/scenes/GameScene";
import { Player } from "@/components/Player";
import { randomZoneFromShape } from '../assets/util';

export class Sparkle extends Phaser.GameObjects.Container {

    public scene: GameScene;
    public id: number;
    public area: Phaser.Geom.Rectangle;
    public activated: boolean;
    public destination: string;

	private particles: Phaser.GameObjects.Particles.ParticleEmitter;

	constructor(scene: GameScene, id: number, area: Phaser.Geom.Rectangle, destination: string) {
		super(scene, area.x, area.y);
		scene.add.existing(this);
		this.scene = scene;

        this.area = area;
        this.activated = false;
        this.destination = destination;

        this.particles = this.scene.add.particles(0, 0, "sparkle", {
            lifespan: 350,
			speed: 0,
			scale: { start: 0.9, end: 0.1 },
			alpha: { start: 1, end: 0 },
			blendMode: 'ADD',
			frequency: 120,
			emitting: true,
			emitZone: randomZoneFromShape(area),
		})
	}

    update(time: number, delta: number, playerBounds: Phaser.Geom.Rectangle) {
        this.particles.emitting = (!this.activated)

        if (this.activated) return
        const inside = Phaser.Geom.Intersects.RectangleToRectangle(this.area, playerBounds)
        
        if (!inside) return
        this.activated = true;
        this.scene.sparkleEffect(this)
        console.count("Sparkle")
    }
}