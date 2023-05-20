class Game extends Phaser.Scene {
	platforms

	player

	cursors

	stars

	starsCollected = 0

	starsCollectedText

	constructor() {
		super('game')
	}

	init() {
		this.starsCollected = 0
	}

	preload() {
        this.load.path = "./assets/";		
        this.load.image('background', 'background.png')
		this.load.image('platform', 'asteroid.png')
		this.load.image('star_head', 'star_head.png')
		this.load.image('star', 'star.png')

		this.cursors = this.input.keyboard.createCursorKeys()
	}

	create()
	{
		this.add.image(240, 320, 'background')
			.setScrollFactor(1, 0)

		this.platforms = this.physics.add.staticGroup()

		for (let i = 0; i < 5; ++i)
		{
			const x = Phaser.Math.Between(80, 400)
			const y = 150 * i
	
			const platform = this.platforms.create(x, y, 'platform')
			platform.scale = 0.5
	
			const body = platform.body
			body.updateFromGameObject()
		}

		this.player = this.physics.add.sprite(240, 320, 'star_head')
			.setScale(0.5)

		this.physics.add.collider(this.platforms, this.player)
		
		this.player.body.checkCollision.up = false
		this.player.body.checkCollision.left = false
		this.player.body.checkCollision.right = false

		this.cameras.main.startFollow(this.player)
		this.cameras.main.setDeadzone(this.scale.width * 1.5)

		this.stars = this.physics.add.group({
			classType: Star
		})

		this.physics.add.collider(this.platforms, this.stars)
		this.physics.add.overlap(this.player, this.stars, this.handleCollectStar, undefined, this)

		this.starsCollectedText = this.add.text(150, 50, 'Stars: 0', { color: '#FFFFFF', fontSize: 50 })
			.setScrollFactor(0)
			.setOrigin(0.5)
	}

	update(t, dt)
	{
		if (!this.player)
		{
			return
		}

		this.platforms.children.iterate(child => {
			const platform = child
			const scrollY = this.cameras.main.scrollY
			if (platform.y >= scrollY + 800)
			{
				platform.y = scrollY - Phaser.Math.Between(50, 100)
				platform.body.updateFromGameObject()
				this.addStarAbove(platform)
			}
		})

		const touchingDown = this.player.body.touching.down

		if (touchingDown)
		{
			this.player.setVelocityY(-350)
		}

		const vy = this.player.body.velocity.y
		if (vy > 0 && this.player.texture.key !== 'star_head')
		{
			this.player.setTexture('star_head')
		}

		if (this.cursors.left.isDown && !touchingDown)
		{
			this.player.setVelocityX(-200)
		}
		else if (this.cursors.right.isDown && !touchingDown)
		{
			this.player.setVelocityX(200)
		}
		else
		{
			this.player.setVelocityX(0)
		}

		this.horizontalWrap(this.player)

		const bottomPlatform = this.findBottomMostPlatform()
		if (this.player.y > bottomPlatform.y + 200)
		{
			this.scene.start('game-over')
		}
	}

	horizontalWrap(sprite)
	{
		const halfWidth = sprite.displayWidth * 0.5
		const gameWidth = this.scale.width
		if (sprite.x < -halfWidth)
		{
			sprite.x = gameWidth + halfWidth
		}
		else if (sprite.x > gameWidth + halfWidth)
		{
			sprite.x = -halfWidth
		}
	}

	addStarAbove(sprite)
	{
		const y = sprite.y - sprite.displayHeight
		const star = this.stars.get(sprite.x, y, 'star')
		star.setActive(true)
		star.setVisible(true)
		this.add.existing(star)
		star.body.setSize(star.width, star.height)
		this.physics.world.enable(star)
		return star
	}

	handleCollectStar(player, star)
	{
		this.stars.killAndHide(star)

		this.physics.world.disableBody(star.body)

		this.starsCollected++

		this.starsCollectedText.text = `Stars: ${this.starsCollected}`
	}

	findBottomMostPlatform()
	{
		const platforms = this.platforms.getChildren()
		let bottomPlatform = platforms[0]

		for (let i = 1; i < platforms.length; ++i)
		{
			const platform = platforms[i]

			if (platform.y < bottomPlatform.y)
			{
				continue
			}

			bottomPlatform = platform
		}

		return bottomPlatform
	}
}

class Star extends Phaser.Physics.Arcade.Sprite {
    
	constructor(scene, x, y, texture = 'star') {
		super(scene, x, y, texture)

		this.setScale(0.5)
	}
}

class GameOver extends Phaser.Scene {
	constructor()
	{
		super('game-over')
	}

	create()
	{
        this.cameras.main.fadeIn(this.transitionDuration, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#483D8B');
		const width = this.scale.width
		const height = this.scale.height

		this.add.text(width * 0.5, height * 0.5, 'Game Over', {
			fontSize: 50
		})
		.setOrigin(0.5)
        this.add.text(50,50, "Click anywhere to restart.").setFontSize(20);
        this.input.on('pointerdown', () => {
            this.cameras.main.fade(1000, 0,0,0);
            this.time.delayedCall(1000, () => this.scene.start('game'));
        });
	}
}

class Intro extends Phaser.Scene {
    constructor() {
        super('intro')
    }
    create() {
        this.cameras.main.setBackgroundColor('#483D8B');
        this.cameras.main.fadeIn(this.transitionDuration, 0, 0, 0);
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        const TitleText = this.add.text(screenCenterX, screenCenterY, 'Jump Star').setOrigin(0.5).setFontSize(50);
        this.add.text(50,50, "Click anywhere to begin.").setFontSize(20);
        this.input.on('pointerdown', () => {
            this.cameras.main.fade(1000, 0,0,0);
            this.time.delayedCall(1000, () => this.scene.start('game'));
        });
    }
}


const game = new Phaser.Game({
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    scene: [Intro, Game, GameOver],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y : 200
            },
            debug: false
        }
    }
});


