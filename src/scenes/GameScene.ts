import { BaseScene } from "@/scenes/BaseScene";
import { Player } from "@/components/Player";
import { Footprint } from "@/components/Footprint";
import { Sparkle } from "@/components/Sparkle";
import { UI } from "@/components/UI";
import { clone, randomZoneFromShape } from '../assets/util';

export class GameScene extends BaseScene {
	private background: Phaser.GameObjects.Image;
	private player: Player;
	private ui: UI;
	private footprints: Phaser.GameObjects.Group;
	private totalSteps: number;
	private snowflakes: Phaser.GameObjects.Particles.ParticleEmitter;

	private tilemap: Phaser.Tilemaps.Tilemap;
	private layers: Map<string, Phaser.Tilemaps.TilemapLayer>;
	private rooms: Map<string, Phaser.Types.Tilemaps.TiledObject>;
	private roomAreas: Map<string, Phaser.Geom.Rectangle>;

	private previousRoom: string;
	private currentRoom: string;
	private roomChange: boolean;

	private sparkles: Map<number, Sparkle>;

	constructor() {
		super({ key: "GameScene" });
	}

	create(): void {
		this.fade(false, 200, 0x000000);

		// this.background = this.add.image(0, 0, "background");
		// this.background.setOrigin(0);
		// this.fitToScreen(this.background);

		this.tilemap = this.make.tilemap({key: "level"});

		this.player = new Player(this, this.CX, this.CY);
		this.player.on("action", () => {
			this.player.doABarrelRoll();
		});

		this.ui = new UI(this);
		this.ui.setScrollFactor(0, 0, true)

		this.footprints = this.add.group({
			classType: Footprint,
			runChildUpdate: true,
			maxSize: 40,
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
		this.snowflakes.setScrollFactor(0, 0)

		this.previousRoom = ""

		this.loadTilemap();
		this.changeRoom("Welcome", false);
		this.initTouchControls();
		this.setupZorder();
	}

	update(time: number, delta: number) {
		this.player.update(time, delta);
		this.checkRoom()

		if (this.roomChange) this.changeRoom(this.currentRoom)
		this.ui.update(time, delta);

		this.sparkles.forEach(s => s.update(time, delta, this.player.getColliderBounds()))
	}


	loadTilemap() {
		// Load tileset
		const tileset = this.tilemap.addTilesetImage("debugtiles", "debugtiles", 64, 64);
		if (tileset == null) throw new Error("Tileset creation error");

		// Load layers
		const layers = [
			{ name: "Wall",   collides: true  },
			{ name: "Ground", collides: false },
		]
		
		this.layers = new Map();
		layers.forEach(({name, collides}) => {
			this.tilemap.setCollisionFromCollisionGroup()
			const layer = this.tilemap.createLayer(name, tileset);
			if (layer == null) throw new Error("Layer creation error");

			this.layers.set(name, layer)
			if (collides) {
				// console.debug("Adding collider for", name)
				this.physics.add.collider(this.player, layer);
				layer.setCollisionFromCollisionGroup(true)
			}
		})
		
		// Physics
		this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
		
		// Read map objects
		this.rooms = new Map();
		this.roomAreas = new Map();
		this.sparkles = new Map();

		this.tilemap.objects.find(objLayer => objLayer.name == "Objects")
		?.objects.forEach(obj => {
			switch (obj.type) {
				case "Room":
					this.rooms.set(obj.name, obj)
					this.roomAreas.set(obj.name, new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width, obj.height))
					break;
			
				case "Spawn":
					if (obj.x) this.player.x = obj.x
					if (obj.y) this.player.y = obj.y
					break;

				case "Sparkle":
					const sparkle = new Sparkle(this, obj.id, new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width, obj.height))
					this.sparkles.set(obj.id, sparkle)
					break;

				default:
					console.warn("Unknown object type", obj.type)
					break;
			}
		})

	}

	initTouchControls() {
		this.input.addPointer(2);

		// let touchArea = this.add.rectangle(0, 0, this.W, this.H, 0xFFFFFF).setOrigin(0).setAlpha(0.001);
		// touchArea.setInteractive({ useHandCursor: true, draggable: true });

		let touchId: number = -1;
		let touchButton: number = -1;

		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			if (!this.player.isTouched) {
				this.player.touchStart(pointer.worldX, pointer.worldY);
				touchId = pointer.id;
				touchButton = pointer.button;
			}
			else if (this.player.isTouched && !this.player.isTapped) { // Use second touch point as a trigger
				this.player.doABarrelRoll();
			}
		});

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			if (touchId == pointer.id) {
				this.player.touchDrag(pointer.worldX, pointer.worldY);
			}
		});

		this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
			if (touchId == pointer.id && touchButton == pointer.button) {
				// this.ui.debug.setText(`${new Date().getTime()} - id:${pointer.id} button:${pointer.button}`);
				this.player.touchEnd(pointer.worldX, pointer.worldY);
			}
		});
	}

	addFootprint() {

		// Step on the ground
		const paw = this.player.getPaw()
		const tile = this.getTile(paw.x, paw.y)
			.find(tile => tile.layer.name == "Ground")
		
		// console.debug(tile?.properties)

		// Set slippery
		this.player.slipping = (tile?.properties && tile.properties.slippery) || false
			
		// Check if footprint should be added
		if (!(tile?.properties && tile.properties.footprints)) return

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

		const step: Footprint = this.footprints.getLast(false, true, paw.x, paw.y);
		if (!step) return;
		step.aliveTime = 0;
		step.index = this.totalSteps++;
		step.setVisible(true);
		step.setActive(true);
		step.scaleX = paw.facing.hor ? 1 : -1;
		step.rotation = paw.tilt;

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

	setupZorder() {
		this.footprints	.setDepth(40)
		this.player		.setDepth(50)
		this.snowflakes	.setDepth(60)
		this.ui			.setDepth(100)
	}

	changeRoom(roomName = "Welcome", smoothCamera = true) {
		const room = this.roomAreas.get(roomName)
		if (!room) {
			console.warn("Room not found")
			return
		}

		// Show room name
		this.currentRoom = roomName;
		this.ui.showPanel(roomName, 3000);

		// Load room properties
		const roomData = this.rooms.get(roomName)
		let properties: any = {staticCamera: false, zoom: 1.0}

		if (roomData?.properties) {
			// roomData.properties.find((prop: any) => prop.name == "staticCamera").value
			roomData.properties.forEach((prop: any) => properties[prop.name] = prop.value)
		}
		
		if (properties.staticCamera == true) {
			this.cameras.main.stopFollow()
		} else {
			this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
		}

		/* console.debug(properties) */

		// Smooth camera room transition: false
		if (!smoothCamera) {
			this.cameras.main.setZoom(properties.zoom)
			this.cameras.main.setBounds(room.x, room.y, room.width, room.height)
			return
		}

		// Smooth camera room transition: true
		const prev = clone(
			this.roomAreas.get(this.previousRoom) ??
			{x: 0, y: 0, width: 0, height: 0}
		) as Phaser.Geom.Rectangle

		this.tweens.add({
			ease: "Expo",
			duration: 200,
			targets: prev,
			x: {from: prev.x, to: room.x},
			y: {from: prev.y, to: room.y},
			width: {from: prev.width, to: room.width},
			height: {from: prev.height, to: room.height},
			onUpdate: (tween, t) => this.cameras.main.setBounds(t.x, t.y, t.width, t.height)
		})

		this.tweens.add({
			ease: "Quad",
			duration: 200,
			targets: this.cameras.main,
			zoom: {from: clone(this.cameras.main.zoom), to: properties.zoom},
		})
	}

	getRoom(rect: Phaser.Geom.Rectangle) {
		return ([...this.rooms.keys()].reverse().find(name => 
			Phaser.Geom.Intersects.RectangleToRectangle(
				this.roomAreas.get(name) as Phaser.Geom.Rectangle,
				rect
			)
		))
	}

	checkRoom() {

		const playerRoom = this.getRoom(this.player.getColliderBounds())

		if (!playerRoom) return console.warn("Player not in any room")

        if (playerRoom != this.currentRoom) {
            this.previousRoom = this.currentRoom;
            this.currentRoom = playerRoom;
            this.roomChange = true;
        } else {
            this.roomChange = false;
        }
    }

	getTile(x: number, y: number) {
		return this.tilemap.getTileLayerNames().map(layer => {
			return this.tilemap.getTileAtWorldXY(x, y, false, undefined, layer) as Phaser.Tilemaps.Tile
		}).filter(x => x != null)
	}

	sparkleEffect(obj: Sparkle) {
		const roomName = this.getRoom(obj.area)
		if (!roomName) return console.warn(`Sparkle ${obj.id} activated outside a room`)

		const footprints = this.footprints.getChildren().filter(go => {
			const ft = go as Footprint
			return ft.roomName == roomName
		}) as Footprint[]

		footprints.forEach(ft => ft.sprite.setTint(0xff0000))
	}
}
