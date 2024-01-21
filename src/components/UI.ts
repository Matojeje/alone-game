import { GameScene } from "@/scenes/GameScene";

let yShown: number, yHidden: number;

export class UI extends Phaser.GameObjects.Container {
	public scene: GameScene;

	private panel: Phaser.GameObjects.Container;
	private background: Phaser.GameObjects.Image;
	private text: Phaser.GameObjects.Text;

	private panelTimer: number;
	private panelShown: boolean;
	private panelTween: Phaser.Tweens.Tween;

	constructor(scene: GameScene) {
		super(scene, 0, 0);
		scene.add.existing(this);
		this.scene = scene;

		const panelHeight = 150;

		this.panel = this.scene.add.container(0, 0);
		this.add(this.panel);

		this.background = this.scene.add.image(0, 0, "hud");
		this.background.setScale(panelHeight / this.background.height);
		this.panel.add(this.background);

		yShown = this.scene.H - this.background.displayHeight / 2
		yHidden = this.scene.H + this.background.displayHeight / 2

		this.text = this.scene.addText({
			x: 0,
			y: 25,
			size: 50,
			color: "#FFFFFF",
			text: "Level name",
		});
		this.text.setStroke("black", 4);
		this.text.setOrigin(0.5, 0.5);
		this.panel.add(this.text);

		this.panel.setPosition(this.scene.W / 2, yHidden);

		this.panelShown = false;
		this.panelTimer = 0;
	}

	update(time: number, delta: number) {
		//console.debug(this.panelShown, this.panelTimer)
		
		this.panelTimer = Math.max(0, this.panelTimer - delta)
		if (this.panelShown && this.panelTimer <= 0) {
			this.hidePanel()
		}
	}

	showPanel(text: string, duration=Infinity) {
		
		this.text.setText(text)
		this.panelTimer = duration

		if (this.panelShown) {
			this.scene.tweens.add({
				targets: this.text,
				duration: 200,
				ease: "Cubic",
				scale: {from: 1.2, to: 1},
			})
			return
		} else this.panelShown = true

		if (this.panelTween) this.scene.tweens.remove(this.panelTween)
		this.panelTween = this.scene.tweens.add({
			targets: this.panel,
			duration: 400,
			ease: "Cubic",
			y: {from: yHidden, to: yShown},
		})

	}

	hidePanel() {
		this.panelShown = false
		if (this.panelTween) this.scene.tweens.remove(this.panelTween)
		this.panelTween = this.scene.tweens.add({
			targets: this.panel,
			duration: 400,
			ease: "Cubic",
			y: {from: yShown, to: yHidden},
		})
	}
}
