import { GameScene } from "@/scenes/GameScene";

const ACCELERATION = 160;
const MAX_SPEED = 500;
const FRICTION = 0.7;
const TAPPING_TIMER = 50; // ms
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

	// Physics
	public arcadeBody: Phaser.Physics.Arcade.Body;
	public friction: number;

	// Controls
	public keyboard: any;
	public isTouched: boolean;
	public isTapped: boolean;
	private tappedTimer: number;
	private inputVec: Phaser.Math.Vector2; // Just used for keyboard -> vector
	private lastDirection: {ver: boolean, hor: boolean}; // Down/Right = true
	private baseScale: number;
	private touchPos: Phaser.Math.Vector2;
	public velocity: Phaser.Math.Vector2;

	public footprintSpacing: number;
	private distanceWalked: number;
	private distSinceLastFootprint: number;
	private lastFootprintPlayerLoc: Phaser.Math.Vector2;
	private lastFootStepped: boolean;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.physics.world.enable(this);
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
		this.lastFootStepped = RIGHT;
		this.lastFootprintPlayerLoc = new Phaser.Math.Vector2(this.x, this.y);

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

		/* Physics */
		this.arcadeBody = this.scene.physics.add.existing(this).body as Phaser.Physics.Arcade.Body
        this.arcadeBody.setOffset(-0.2 * this.spriteSize, 0.2 * this.spriteSize);
		this.arcadeBody.setSize(0.4 * this.spriteSize, 0.2 * this.spriteSize)

		this.friction = FRICTION
		
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
			this.arcadeBody.velocity.scale(this.friction);
			this.arcadeBody.velocity.add(this.inputVec);
			this.arcadeBody.velocity.limit(MAX_SPEED);
		}

		// Spritesheet animation
		const isMoving = this.inputVec.length() > 0.05;
		const isMovingX = Math.abs(this.inputVec.x) > 0.05;
		const isMovingY = Math.abs(this.inputVec.y) > 0.05;

		const facingUp = this.inputVec.normalize().y >= -0.3;
		if (isMovingX) this.lastDirection.hor = this.inputVec.x >= 0 ? RIGHT : LEFT;
		if (isMovingY) this.lastDirection.ver = facingUp			 ? DOWN : UP;

		this.sprite.play(`${isMoving ? "walk" : "idle"}-${this.lastDirection.ver == DOWN ? "front" : "back"}`, true)

		// Animation
		const squish = 1.0 + 0.02 * Math.sin((6 * time) / 1000);
		this.sprite.setScale(
			this.baseScale * (this.lastDirection.hor == RIGHT ? 1 : -1),
			this.baseScale * squish
		)

		// Foot prints
		const newPosition = new Phaser.Math.Vector2(this.x, this.y)
		const deltaDistance = prevPosition.distance(newPosition)
		const deltaDistanceFootprint = this.lastFootprintPlayerLoc.distance(newPosition)

		this.distanceWalked += deltaDistance
		this.distSinceLastFootprint = deltaDistanceFootprint

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
			this.inputVec.scale(1 / 200);
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
		console.count("Whee")
		/* if (!this.tween || !this.tween.isActive()) {
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
		} */
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
		const foot = this.lastFootStepped
		this.lastFootStepped = !this.lastFootStepped
		this.lastFootprintPlayerLoc = new Phaser.Math.Vector2(this.x, this.y)

		const LOW = 0.23, MID = 0.2, HI = 0.17;
		const TOP = 10, BTM = -10;

		// const framePawHeight = [MID, MID, LOW, HI, MID, MID, LOW, HI]
		// const framePawTilt = [0, 0, BTM, TOP, 0, 0, BTM, TOP]
		// const thisFrame = this.sprite.anims.currentFrame?.index ?? 0

		return {
			x: this.x,
			y: this.y + this.sprite.displayHeight * (foot ? LOW : HI),
			facing: this.lastDirection,
			tilt: Phaser.Math.DegToRad(
				(foot ? TOP : BTM) * (this.lastDirection.ver ? 1 : -1)
				+ (this.lastDirection.ver ? 20 : -20)
			)
		}
	}

	getColliderBounds() {
		let temp = new Phaser.Geom.Rectangle;
		this.arcadeBody.getBounds(temp as Phaser.Types.Physics.Arcade.ArcadeBodyBounds)
		return temp
	}

	
	public set slipping(state: boolean) {
		this.friction = state ? 20 : FRICTION;
	}

	hurt() {
		this.sprite.setTint(0xff8888);
		setTimeout(() => {
			this.sprite.setTint(0xffffff);
		}, 300);
	}
	
}
