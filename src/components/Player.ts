import { GameScene } from "@/scenes/GameScene";

const ACCELERATION = 150;
const MAX_SPEED = 400;
const FRICTION = 0.7;
const TAPPING_TIMER = 200; // ms
const DOWN = true, UP = false, RIGHT = true, LEFT = false;
console.assert(
	ACCELERATION / (1 - FRICTION) >= MAX_SPEED,
	"Max speed unreachable"
);

export class Player extends Phaser.GameObjects.Container {
	public scene: GameScene;

	// Sprites
	private spriteSize: number;
	private sprite: Phaser.GameObjects.Sprite;
	private tween: Phaser.Tweens.Tween;

	// Controls
	private keyboard: any;
	public isTouched: boolean;
	public isTapped: boolean;
	private tappedTimer: number;
	private inputVec: Phaser.Math.Vector2; // Just used for keyboard -> vector
	private lastDirection: {ver: boolean, hor: boolean}; // Down/Right = true
	private baseScale: number;
	private touchPos: Phaser.Math.Vector2;
	public velocity: Phaser.Math.Vector2;
	private border: { [key: string]: number };

	public footprintSpacing: number;
	private distanceWalked: number;
	private distSinceLastFootprint: number;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		/* Sprite */
		this.spriteSize = 200;
		this.lastDirection = {hor: RIGHT, ver: DOWN};
		this.sprite = this.scene.add.sprite(0, 0, "player", 0);
		this.sprite.setOrigin(0.5, 1.0);
		this.sprite.y += this.spriteSize / 2;
		this.baseScale = this.spriteSize / this.sprite.width;
		this.sprite.setScale(this.baseScale);
		this.add(this.sprite);

		this.setupAnimations();

		/* Foot prints */
		this.footprintSpacing = 100;
		this.distanceWalked = 0;
		this.distSinceLastFootprint = 0;

		/* Controls */
		if (this.scene.input.keyboard) {
			this.keyboard = this.scene.input.keyboard.addKeys({
				up1: "W",
				down1: "S",
				left1: "A",
				right1: "D",
				up2: "Up",
				down2: "Down",
				left2: "Left",
				right2: "Right",
			});
			this.scene.input.keyboard
				.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
				.on("down", this.doABarrelRoll, this);
		}
		this.isTouched = false;
		this.isTapped = false;
		this.tappedTimer = 0;
		this.inputVec = new Phaser.Math.Vector2(0, 0);
		this.touchPos = new Phaser.Math.Vector2(0, 0);
		this.velocity = new Phaser.Math.Vector2(0, 0);
		this.border = {
			left: 100,
			right: scene.W - 100,
			top: 100,
			bottom: scene.H - 100,
		};
	}

	update(time: number, delta: number) {
		const prevPosition = new Phaser.Math.Vector2(this.x, this.y)

		// Movement
		this.handleInput();

		this.inputVec.limit(1);
		// this.inputVec.normalize();
		this.inputVec.scale(ACCELERATION);

		if (this.isTapped) {
			this.tappedTimer -= delta;
			if (this.tappedTimer <= 0) {
				this.isTapped = false;
			}
		} else {
			this.velocity.scale(FRICTION);
			this.velocity.add(this.inputVec);
			this.velocity.limit(MAX_SPEED);
		}

		this.x += (this.velocity.x * delta) / 1000;
		this.y += (this.velocity.y * delta) / 1000;

		// Spritesheet animation
		const isMoving = this.inputVec.length() > 0.05;
		const isMovingX = Math.abs(this.inputVec.x) > 0.05;
		const isMovingY = Math.abs(this.inputVec.y) > 0.05;

		if (isMovingX) this.lastDirection.hor = this.inputVec.x >= 0 ? RIGHT : LEFT;
		if (isMovingY) this.lastDirection.ver = this.inputVec.y >= 0 ? DOWN : UP;

		this.sprite.play(`${isMoving ? "walk" : "idle"}-${this.lastDirection.ver == DOWN ? "front" : "back"}`, true)

		// Border collision
		this.x = Phaser.Math.Clamp(this.x, this.border.left, this.border.right);
		this.y = Phaser.Math.Clamp(this.y, this.border.top, this.border.bottom);

		// Animation
		const squish = 1.0 + 0.02 * Math.sin((6 * time) / 1000);
		this.setScale(this.lastDirection.hor == RIGHT ? 1 : -1, 1);
		this.sprite.setScale(this.baseScale, this.baseScale * squish)

		// Foot prints
		const newPosition = new Phaser.Math.Vector2(this.x, this.y)
		const deltaDistance = prevPosition.distance(newPosition)
		this.distanceWalked += deltaDistance
		this.distSinceLastFootprint += deltaDistance

		if (this.distSinceLastFootprint >= this.footprintSpacing) {
			this.distSinceLastFootprint %= this.footprintSpacing
			this.scene.addFootprint()
		}
	}

	handleInput() {
		this.inputVec.reset();

		// Keyboard input to vector
		if (!this.isTouched) {
			if (this.keyboard) {
				this.inputVec.x =
					(this.keyboard.left1.isDown || this.keyboard.left2.isDown ? -1 : 0) +
					(this.keyboard.right1.isDown || this.keyboard.right2.isDown ? 1 : 0);
				this.inputVec.y =
					(this.keyboard.up1.isDown || this.keyboard.up2.isDown ? -1 : 0) +
					(this.keyboard.down1.isDown || this.keyboard.down2.isDown ? 1 : 0);
			}
		}
		// Touch to input vector
		else {
			this.inputVec.copy(this.touchPos);
			this.inputVec.x -= this.x;
			this.inputVec.y -= this.y; // If needed, add offset so finger doesn't block, see TW.
			// if (this.inputVec.length() < 8) {
			// this.inputVec.reset();
			// }
			this.inputVec.scale(1 / 50);
		}
	}

	touchStart(x: number, y: number) {
		this.isTouched = true;
		this.isTapped = false;
		this.touchPos.x = x;
		this.touchPos.y = y;

		if (this.touchInsideBody(x, y)) {
			this.isTapped = true;
			this.tappedTimer = TAPPING_TIMER;
		}
	}

	touchDrag(x: number, y: number) {
		this.touchPos.x = x;
		this.touchPos.y = y;

		if (this.isTapped && !this.touchInsideBody(x, y)) {
			this.isTapped = false;
		}
	}

	touchEnd(x: number, y: number) {
		if (this.isTapped && this.tappedTimer > 0) {
			this.emit("action");
		}

		this.isTouched = false;
		this.isTapped = false;
	}

	touchInsideBody(x: number, y: number) {
		return (
			Phaser.Math.Distance.Between(this.x, this.y, x, y) <
			this.spriteSize
		);
	}

	doABarrelRoll() {
		if (!this.tween || !this.tween.isActive()) {
			this.tween = this.scene.tweens.add({
				targets: this.sprite,
				scaleX: {
					from: this.sprite.scaleX,
					to: -this.sprite.scaleX,
					ease: "Cubic.InOut",
				},
				duration: 300,
				yoyo: true,
			});
		}
	}

	setupAnimations() {
		
		const that = this
		function addAnim(key: string, frames: number[], duration=150) {
			return that.scene.anims.create({
				key, repeat: -1, frames: frames.map(n => {
					return {key: that.sprite.texture.key, frame: n, duration}
				})
			})
		}

		addAnim("idle-front", [0])
		addAnim("walk-front", [3,1,2,1])
		addAnim("idle-back",  [4])
		addAnim("walk-back",  [7,5,6,5])

	}

	getPaw() {
		const LOW = 0.23, MID = 0.2, HI = 0.17;
		const framePawHeight = [MID, MID, LOW, HI, MID, MID, LOW, HI]
		const thisFrame = this.sprite.anims.currentFrame?.index ?? 0

		return {
			x: this.x,
			y: this.y + this.sprite.displayHeight * framePawHeight[thisFrame],
			facing: this.lastDirection.hor
		}
	}
}
