import { BaseScene } from "@/scenes/BaseScene";
import { Player } from "@/components/Player";
import { Footprint } from "@/components/Footprint";
import { UI } from "@/components/UI";
import { randomZoneFromShape } from '../assets/util';

export class GameScene extends BaseScene {
	private background: Phaser.GameObjects.Image;
	private player: Player;
	private ui: UI;
	private footprints: Phaser.GameObjects.Group;
	private totalSteps: number;
	private snowflakes: Phaser.GameObjects.Particles.ParticleEmitter;

	constructor() {
		super({ key: "GameScene" });
	}

	create(): void {
		this.fade(false, 200, 0x000000);

		this.background = this.add.image(0, 0, "background");
		this.background.setOrigin(0);
		this.fitToScreen(this.background);

		this.player = new Player(this, this.CX, this.CY);
		this.player.on("action", () => {
			this.player.doABarrelRoll();
		});

		this.ui = new UI(this);

		this.footprints = this.add.group({
			classType: Footprint,
			runChildUpdate: true,
			maxSize: 20,
		});

		this.totalSteps = 0;

		const topLine = new Phaser.Curves.Line([0, 0, this.W, 0])
		const bottomLine = new Phaser.Curves.Line([0, this.H, this.W, this.H])

		
		this.snowflakes = this.add.particles(0, 0, "snowflake", {
			lifespan: {min: 3500, max: 8000},
			alpha: {start: 0.8, end: 0},
			scale: {min: 0.3, max: 0.5},
			speedX: {min: -100, max: 20},
			speedY: {min: 150, max: 250},
			frequency: 150,
			gravityY: 50,
			emitting: true,
			emitZone: randomZoneFromShape(topLine),
		})

		this.initTouchControls();
	}

	update(time: number, delta: number) {
		this.player.update(time, delta);
	}


	initTouchControls() {
		this.input.addPointer(2);

		// let touchArea = this.add.rectangle(0, 0, this.W, this.H, 0xFFFFFF).setOrigin(0).setAlpha(0.001);
		// touchArea.setInteractive({ useHandCursor: true, draggable: true });

		let touchId: number = -1;
		let touchButton: number = -1;

		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			if (!this.player.isTouched) {
				this.player.touchStart(pointer.x, pointer.y);
				touchId = pointer.id;
				touchButton = pointer.button;
			}
			else if (this.player.isTouched && !this.player.isTapped) { // Use second touch point as a trigger
				this.player.doABarrelRoll();
			}
		});

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			if (touchId == pointer.id) {
				this.player.touchDrag(pointer.x, pointer.y);
			}
		});

		this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
			if (touchId == pointer.id && touchButton == pointer.button) {
				// this.ui.debug.setText(`${new Date().getTime()} - id:${pointer.id} button:${pointer.button}`);
				this.player.touchEnd(pointer.x, pointer.y);
			}
		});
	}

	addFootprint() {

		// Free up old footprints
		if (this.footprints.isFull()) {
			const prints = this.footprints.getChildren()
			.filter(x => x.active),

			indices = prints.map(x => {
				const footprint = x as Footprint
				return footprint.index
			}),

			oldestIdx = Math.min(...indices),
			oldestStep = prints.find(x => {
				const footprint = x as Footprint
				return footprint.index === oldestIdx
			});

			if (oldestStep) this.footprints.killAndHide(oldestStep)
			else console.warn("Step #", oldestIdx, "not found")
		}

		// Add new footprint
		const paw = this.player.getPaw()
		const step: Footprint = this.footprints.getLast(false, true, paw.x, paw.y);
		if (!step) return;
		step.aliveTime = 0;
		step.index = this.totalSteps++;
		step.setVisible(true);
		step.setActive(true);
		step.scaleX = paw.facing ? 1 : -1;

		/* console.debug(this.footprints.getChildren().map(x => {
			const fp = x as Footprint
			return `#${fp.index} ${x.active ? "alive" : "dead"}`
		})) */
	}

	setSnowflakeSpeed(angle=0, speed=0, angleSpread=0, speedSpread=0) {
		const baseVector = new Phaser.Math.Vector2
		baseVector.setToPolar(Phaser.Math.DegToRad(angle), speed)

		const minVector = baseVector.clone()
		const maxVector = baseVector.clone()
		minVector.rotate(Phaser.Math.DegToRad(angleSpread / 2))
		maxVector.rotate(Phaser.Math.DegToRad(angleSpread / -2))
		minVector.setLength(speed + speedSpread / 2)
		maxVector.setLength(speed - speedSpread / 2)

		this.snowflakes.speedX = {min: minVector.x, max: maxVector.x}
		this.snowflakes.speedY = {min: minVector.y, max: maxVector.y}

		this.snowflakes.speed = speed
		this.snowflakes.setEmitterAngle({
			min: angle - (angleSpread/2),
			max: angle + (angleSpread/2)
		})
	}
}
