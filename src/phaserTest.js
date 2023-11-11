'use strict'

const config = {
    width: 1000,
    height: 700,
    type: Phaser.AUTO,
    scene: {
        preload:preload,
        create: create,
        update: update
    }
};

let sky;
let scene;
let controls;
const game = new Phaser.Game(config);

function preload(){
    this.load.image('sky', './assets/backgroundSky.png');
    this.load.image('TileGenTemplate', './assets/TileGenTemplate.png');
    this.load.tilemapTiledJSON('tilemap', './assets/subcraftTerrainMap.tmj');
    this.load.multiatlas('myObjects', './assets/mapObjects.json');
}

function create (){
    scene = this;
    const map = this.make.tilemap({ key: 'tilemap' });

    const tileset = map.addTilesetImage('subcraftTerrainTileSet', 'TileGenTemplate',300,300,2,4);

    let blayer = map.createLayer('backgroundTerrain', tileset);
    
    blayer.forEachTile(tile => { tile.tint = parseInt('0x37365e')});

    // Add the sky image to the background
    sky = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'sky').setDepth(-Infinity);
    
    map.createFromObjects('behindTerrain2', map.tilesets.map(t=>({gid:t.firstgid, key:'myObjects', frame:t.name})));
    map.createFromObjects('behindTerrain', map.tilesets.map(t=>({gid:t.firstgid, key:'myObjects', frame:t.name})));
    
    let alayer = map.createLayer('terrain', tileset);

    map.createFromObjects('aboveTerrain', map.tilesets.map(t=>({gid:t.firstgid, key:'myObjects', frame:t.name})));

    this.cameras.main.setZoom(.3);

    //controls

    let isDragging = false;
    let lastPointerPosition;

    this.input.on('pointerdown', function(pointer) {
        isDragging = true;
        lastPointerPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    this.input.on('pointermove', function(pointer) {
        if (isDragging || (pointer.isDown && pointer.getDistance() < 10)) {
            const delta = new Phaser.Math.Vector2(pointer.x, pointer.y).subtract(lastPointerPosition);
            scene.cameras.main.scrollX -= delta.x*2;
            scene.cameras.main.scrollY -= delta.y*2;
            lastPointerPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
        }
    });

    this.input.on('pointerup', function(pointer) {
        isDragging = false;
    });
    
    var cursors = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D
    });
    var controlConfig = {
        camera: this.cameras.main,
        left: cursors.left,
        right: cursors.right,
        up: cursors.up,
        down: cursors.down,
        acceleration: 0.04,
        drag: 0.0005,
        maxSpeed: 2
    };

    //move behindTerrain2 opposite to camera movement to create parralax effect
    blayer.setScrollFactor(0.5);


    
    //additional controls to zoom in and out with mouse wheel
    this.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY, deltaZ) {
        const zoomAmount = deltaY > 0 ? 0.1 : -0.1;
        const zoomDuration = 600; // in milliseconds
        const zoomEase = Phaser.Math.Easing.Cubic.Out; // easing function

        const fromZoom = scene.cameras.main.zoom;
        const toZoom = Phaser.Math.Clamp(fromZoom + zoomAmount, 0.1, 10); // clamp zoom between 0.1 and 10

        scene.tweens.add({
            targets: scene.cameras.main,
            zoom: toZoom,
            duration: zoomDuration,
            ease: zoomEase
        });
    }, this);

    this.input.addPointer(2);
    this.input.on('pointerdown', function (pointer) {
        if (pointer.pointerType === 'touch') {
            if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
                this.initialDistance = Phaser.Math.Distance.Between(
                    this.input.pointer1.x,
                    this.input.pointer1.y,
                    this.input.pointer2.x,
                    this.input.pointer2.y
                );
            }
        }
    }, this);

    this.input.on('pointermove', function (pointer) {
        if (pointer.pointerType === 'touch') {
            if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
                const newDistance = Phaser.Math.Distance.Between(
                    this.input.pointer1.x,
                    this.input.pointer1.y,
                    this.input.pointer2.x,
                    this.input.pointer2.y
                );
                const delta = newDistance - this.initialDistance;
                const zoomAmount = delta / 1000;
                const zoomDuration = 600; // in milliseconds
                const zoomEase = Phaser.Math.Easing.Cubic.Out; // easing function

                const fromZoom = scene.cameras.main.zoom;
                const toZoom = Phaser.Math.Clamp(fromZoom + zoomAmount, 0.1, 10); // clamp zoom between 0.1 and 10

                scene.tweens.add({
                    targets: scene.cameras.main,
                    zoom: toZoom,
                    duration: zoomDuration,
                    ease: zoomEase
                });
            }
        }
    }, this);

    controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
}

    function update (time, delta){
        controls.update(delta);
        // Counteract the zoom of the camera on the sky image
        sky.setScale(0.7 / this.cameras.main.zoom);
        // Keep the sky centered
        sky.setPosition(this.cameras.main.scrollX + this.cameras.main.width / 2, this.cameras.main.scrollY + this.cameras.main.height / 2);
    }
