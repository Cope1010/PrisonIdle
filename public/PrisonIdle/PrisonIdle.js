
var socket;
var connectionData;
var otherPlayers = [];
var playerCount = 0;

var prisoner;
var money = 0;
var lastSelectedTile = -1;
var currentlyBreaking = -1;
var lastFrames = [];
var miningSpeed = 1;

var currentMine;
var shop;
var AMine;
var BMine;
var CMine;
var DMine;
var EMine;
var FMine;

var mines = [];

var tileDetails;
var pickaxeDetails;
var doorDetails;
var upgradeDetails;
var inventory = [];
var doors = [];
var recipes = [];

var TILESIZE = 40;
var GRAVITY = .2;

var font;
var wallSprite;
var ladderLeftSprite;
var ladderRightSprite;
var breakAnimation;
var dirtSprite;
var stoneSprite;
var coalSprite;
var copperSprite;
var ironSprite;

var woodenPickaxeSprite;
var stonePickaxeSprite;
var copperPickaxeSprite;
var ironPickaxeSprite;

function preload() {
    font = loadFont('Resources/Pixellari.ttf');

    socket = io.connect(location.origin.replace(/^http/, 'ws'));
    
    socket.on('connectInfo', function (data) {
        console.log(data);
        playerCount = data.onlinePlayers;
        
        var d = new Date().getTime();
        AMine.resetMine(data.mines.AMine.resetLength, data.mines.AMine.tiles);
        AMine.lastReset = d - data.mines.AMine.timeSinceReset;
        BMine.resetMine(data.mines.BMine.resetLength, data.mines.BMine.tiles);
        BMine.lastReset = d - data.mines.BMine.timeSinceReset;
        CMine.resetMine(data.mines.CMine.resetLength, data.mines.CMine.tiles);
        CMine.lastReset = d - data.mines.CMine.timeSinceReset;
        DMine.resetMine(data.mines.DMine.resetLength, data.mines.DMine.tiles);
        DMine.lastReset = d - data.mines.DMine.timeSinceReset;
        EMine.resetMine(data.mines.EMine.resetLength, data.mines.EMine.tiles);
        EMine.lastReset = d - data.mines.EMine.timeSinceReset;
        FMine.resetMine(data.mines.FMine.resetLength, data.mines.FMine.tiles);
        FMine.lastReset = d - data.mines.FMine.timeSinceReset;

        prisoner = new Prisoner();
        prisoner.playerColor = data.color;
        prisoner.emitLocation();
    });

    socket.on('playerConnected', function (data) {
        console.log('new player connected');
        playerCount = data.onlinePlayers;
        prisoner.emitLocation();
    });

    socket.on('playerMoved', updateOtherPlayerLocation);

    socket.on('breakBlock', function (data) {
        if (data.mine == 'AMine') {
            AMine.tiles[data.index].intact = false;
        } else if (data.mine == 'BMine') {
            BMine.tiles[data.index].intact = false;
        } else if (data.mine == 'CMine') {
            CMine.tiles[data.index].intact = false;
        } else if (data.mine == 'DMine') {
            DMine.tiles[data.index].intact = false;
        } else if (data.mine == 'EMine') {
            EMine.tiles[data.index].intact = false;
        } else if (data.mine == 'FMine') {
            FMine.tiles[data.index].intact = false;
        }
    });

    socket.on('resetMine', function (data) {
        for (var i = 0; i < mines.length; i++) {
            if (data.mine == 'AMine') {
                AMine.resetMine(data.resetLength, data.tiles);
            } else if (data.mine == 'BMine') {
                BMine.resetMine(data.resetLength, data.tiles);
            } else if (data.mine == 'CMine') {
                CMine.resetMine(data.resetLength, data.tiles);
            } else if (data.mine == 'DMine') {
                DMine.resetMine(data.resetLength, data.tiles);
            } else if (data.mine == 'EMine') {
                EMine.resetMine(data.resetLength, data.tiles);
            } else if (data.mine == 'FMine') {
                FMine.resetMine(data.resetLength, data.tiles);
            }
        }
    });

    socket.on('playerDisconnected', function (data) {
        var newPlayerList = [];
        for (var i = 0; i < otherPlayers.length; i++) {
            console.log(data.id);
            if (otherPlayers[i].id != data.id) {
                newPlayerList.push(otherPlayers[i]);
            }
        }
        otherPlayers = newPlayerList;
        playerCount = data.playerCount;
    });
}

function setup() {
    createCanvas(1280, 720);

    textFont(font);
    wallSprite = loadImage('Resources/wall.png');
    ladderLeftSprite = loadImage('Resources/ladderLeft.png');
    ladderRightSprite = loadImage('Resources/ladderRight.png');
    breakAnimation = loadImage('Resources/breakAnimation.png');
    dirtSprite = loadImage('Resources/dirt.png');
    stoneSprite = loadImage('Resources/stone.png');
    coalSprite = loadImage('Resources/coal.png');
    copperSprite = loadImage('Resources/copper.png');
    ironSprite = loadImage('Resources/iron.png');
    
    woodenPickaxeSprite = loadImage('Resources/woodenPickaxe.png');
    stonePickaxeSprite = loadImage('Resources/stonePickaxe.png');
    copperPickaxeSprite = loadImage('Resources/copperPickaxe.png');
    ironPickaxeSprite = loadImage('Resources/ironPickaxe.png');
    
    tileDetails = [
        {name: 'dirt',    id: 0, breakTime: 500, tColor: '#735A37', price: .1, count: 0, info: "Name: Dirt    Sell For: $0.10    Locations: A, B", minimumMine: 0, sprite: dirtSprite},
        {name: 'stone',   id: 1, breakTime: 1000, tColor: '#939393', price: .3, count: 0, info: "Name: Stone    Sell For: $0.30    Locations: A, B, C, D", minimumMine: 0, sprite: stoneSprite},
        {name: 'coal',    id: 2, breakTime: 2000, tColor: '#2C2925', price: 1.0, count: 0, info: "Name: Coal    Sell For: $1.00    Locations: A, B, C, D, E, F", minimumMine: 0, sprite: coalSprite},
        {name: 'copper',    id: 3, breakTime: 5000, tColor: '#2C2925', price: 3.0, count: 0, info: "Name: Copper    Sell For: $3.00    Locations: D, E, F, G, H, I", minimumMine: 2, sprite: copperSprite},
        {name: 'iron',    id: 4, breakTime: 10000, tColor: '#F0D4B5', price: 10.0, count: 0, info: "Name: Iron    Sell For: $10.00    Locations: F, G, H, I, J, K", minimumMine: 4, sprite: ironSprite}
    ];
    
    recipes = [
        {name: 'stonePickaxe', id: 0, parts: [
            {id: 1, count: 50}
        ]},
        {name: 'copperPickaxe', id: 1, parts: [
            {id: 2, count: 100},
            {id: 3, count: 50}
        ]},
        {name: 'ironPickaxe', id: 2, parts: [
            {id: 2, count: 500},
            {id: 4, count: 100}
        ]}
    ];
    
    pickaxeDetails = [
        {name: 'default', id: 0, miningSpeed: 1, cost: 0, info: 'Name: Wooden Pickaxe    Cost: $0.00    Speed: 1.0x', sprite: woodenPickaxeSprite},
        {name: 'stone', id: 1, miningSpeed: 1.5, recipe: recipes[0], info: 'Name: Stone Pickaxe    Cost: 50 Stone    Speed: 1.5x', sprite: stonePickaxeSprite},
        {name: 'copper', id: 2, miningSpeed: 2, recipe: recipes[1], info: 'Name: Copper Pickaxe    Cost: 50 Copper and 100 Coal    Speed: 2x', sprite: copperPickaxeSprite},
        {name: 'iron', id: 3, miningSpeed: 4, recipe: recipes[2], info: 'Name: Iron Pickaxe    Cost: 100 Iron and 500 Coal    Speed: 4x', sprite: ironPickaxeSprite}
    ];
    
    doors = [
        new Door(1240, 200, 12, 80, "BMineEntrance"),
        new Door(1240, 200, 12, 80, "CMineEntrance"),
        new Door(1240, 200, 12, 80, "DMineEntrance"),
        new Door(1240, 200, 12, 80, "EMineEntrance"),
        new Door(1240, 200, 12, 80, "FMineEntrance")
    ];
    
    doorDetails = [
        {name: 'A', id: 0, cost: 0, info: "Name: A-Mine Entrance    Cost: $0.00    Composition: 70% Dirt, 25% Stone, 5% Coal"},
        {name: 'B', id: 1, cost: 100, info: 'Name: B-Mine Entrance    Cost: $100.00    Composition: 45% Dirt, 45% Stone, 10% Coal', door: doors[0]},
        {name: 'C', id: 2, cost: 250, info: 'Name: C-Mine Entrance    Cost: $250.00    Composition: 70% Stone, 25% Coal, 5% Copper', door: doors[1]},
        {name: 'D', id: 3, cost: 500, info: 'Name: D-Mine Entrance    Cost: $500.00    Composition: 45% Stone, 45% Coal, 10% Copper', door: doors[2]},
        {name: 'E', id: 4, cost: 1000, info: 'Name: E-Mine Entrance    Cost: $1000.00    Composition: 70% Coal, 25% Copper, 5% Iron', door: doors[3]},
        {name: 'F', id: 5, cost: 2000, info: 'Name: F-Mine Entrance    Cost: $2000.00    Composition: 45% Coal, 45% Copper, 10% Iron', door: doors[4]}
    ];
    
    upgradeDetails = [
        {name: 'pickaxe', id: 0, progression: pickaxeDetails, current: 0},
        {name: 'doors', id: 1, progression: doorDetails, current: 0}
    ];
    
    this.inventory.push(new SellBlock(80, 120, 0));
    this.inventory.push(new SellBlock(160, 120, 1));
    this.inventory.push(new SellBlock(240, 120, 2));
    
    shop = new Shop();
    AMine = new AMine();
    BMine = new BMine();
    CMine = new CMine();
    DMine = new DMine();
    EMine = new EMine();
    FMine = new FMine();

    //mines.push(new AMine());
    //mines.push(new BMine());
    //mines.push(new CMine());
    //mines.push(new DMine());
    //mines.push(new EMine());
    //mines.push(new FMine());
    
    //console.log(shop);
    shop.setRightRoom(AMine);
    AMine.setLeftRoom(shop);
    AMine.setRightRoom(BMine);
    BMine.setLeftRoom(AMine);
    BMine.setRightRoom(CMine);
    CMine.setLeftRoom(BMine);
    CMine.setRightRoom(DMine);
    DMine.setLeftRoom(CMine);
    DMine.setRightRoom(EMine);
    EMine.setLeftRoom(DMine);
    EMine.setRightRoom(FMine);
    FMine.setLeftRoom(EMine);
    
    currentMine = AMine;
    
    loadState();
    
    console.log('game loaded');
    socket.emit('gameLoaded');
}

function draw() {
    background(0);
    
    currentMine.display();
    currentMine.update();
    
    fill(34);
    //rect(80, 40, 120, 40);
    //fill(255);
    textSize(20);
    textAlign(LEFT, BASELINE);
    text("$ " + money.toFixed(2), 90, 67);
    text("Players Online: " + playerCount, 90, 92);

    if (currentMine.name != "Shop") {
        for (var i = 0; i < inventory.length; i++) {
            //this.inventory[i].display();
        }  
    }

    for (var i = 0; i < otherPlayers.length; i++) {
        if (otherPlayers[i].mine == currentMine.name) {
            noStroke();
            fill(otherPlayers[i].color); // custom player color
            rect(otherPlayers[i].x, otherPlayers[i].y + prisoner.getHeight()/3, prisoner.getWidth(), 2*prisoner.getHeight()/3);
            fill('#FFE0C4');
            rect(otherPlayers[i].x, otherPlayers[i].y, prisoner.getWidth(), prisoner.getHeight()/3);
            var pickaxe = upgradeDetails[0].progression[otherPlayers[i].pickaxe].sprite;
            if (pickaxe != null) {
                push();
                if (otherPlayers[i].direction == "right") {
                    translate(otherPlayers[i].x + 30, otherPlayers[i].y + 5);
                    rotate(PI/4);
                } else {
                    translate(otherPlayers[i].x - 30, otherPlayers[i].y + 34);
                    rotate(-PI/4);
                }
                image(pickaxe, 0, 0, TILESIZE, TILESIZE);
                pop();
            }
        }
    }

    if (prisoner != null) {
        prisoner.display();
        prisoner.update();
    }
    
    fill(255);
    lastFrames.push(frameRate());
    if (lastFrames.length >= 20) { lastFrames.shift(); }
    var frames = 0;
    for (var i = 0; i < lastFrames.length; i++) { frames += lastFrames[i]; }
    textSize(12);
    textAlign(LEFT, BASELINE);
    text(parseInt(frames / lastFrames.length, 10), 1253, 25);
    
    if (frameCount % 360 == 0) saveState();
}

function saveState() {
    console.log("Saved.");
    localStorage.setItem('money', JSON.stringify(money));
    localStorage.setItem('pickaxe', JSON.stringify(upgradeDetails[0].current));
    localStorage.setItem('doors', JSON.stringify(upgradeDetails[1].current));
    localStorage.setItem('currentMine', JSON.stringify(currentMine.name));
    localStorage.setItem('sellQuantity', JSON.stringify(sellQuantity));
    localStorage.setItem('dirtCount', JSON.stringify(tileDetails[0].count));
    localStorage.setItem('stoneCount', JSON.stringify(tileDetails[1].count));
    localStorage.setItem('coalCount', JSON.stringify(tileDetails[2].count));
    localStorage.setItem('copperCount', JSON.stringify(tileDetails[3].count));
    localStorage.setItem('ironCount', JSON.stringify(tileDetails[4].count));
}

function loadState() {
    //localStorage.removeItem('AReset');
    if (JSON.parse(localStorage.getItem('money')) != null) money = parseFloat(JSON.parse(localStorage.getItem('money')));
    if (JSON.parse(localStorage.getItem('doors')) != null) {
        upgradeDetails[1].current = parseInt(JSON.parse(localStorage.getItem('doors')));
        for (var i = 1; i < upgradeDetails[1].current+1; i++) {
             upgradeDetails[1].progression[i].door.openDoor();
        }
    }
    if (JSON.parse(localStorage.getItem('pickaxe')) != null) {
        upgradeDetails[0].current = parseInt(JSON.parse(localStorage.getItem('pickaxe')));
        miningSpeed = upgradeDetails[0].progression[upgradeDetails[0].current].miningSpeed;   
    }
    if (JSON.parse(localStorage.getItem('currentMine')) != null) var mineName = JSON.parse(localStorage.getItem('currentMine'));
    switch(mineName) {
        case shop.name:
            currentMine = shop;
            break;
        case AMine.name:
            currentMine = AMine;
            break;
        case BMine.name:
            currentMine = BMine;
            break;
        case CMine.name:
            currentMine = CMine;
            break;
        case DMine.name:
            currentMine = DMine;
            break;
        case EMine.name:
            currentMine = EMine;
            break;
        case FMine.name:
            currentMine = FMine;
            break;
        default:
            currentMine = AMine;
            break;
    }
    if (JSON.parse(localStorage.getItem('sellQuantity')) != null) {
        if (JSON.parse(localStorage.getItem('sellQuantity')) == "All") sellQuantity = "All";
        else sellQuantity = parseInt(JSON.parse(localStorage.getItem('sellQuantity')));
    }
    if (JSON.parse(localStorage.getItem('dirtCount')) != null) tileDetails[0].count = parseInt(JSON.parse(localStorage.getItem('dirtCount')));
    if (JSON.parse(localStorage.getItem('stoneCount')) != null) tileDetails[1].count = parseInt(JSON.parse(localStorage.getItem('stoneCount')));
    if (JSON.parse(localStorage.getItem('coalCount')) != null) tileDetails[2].count = parseInt(JSON.parse(localStorage.getItem('coalCount')));
    if (JSON.parse(localStorage.getItem('copperCount')) != null) tileDetails[3].count = parseInt(JSON.parse(localStorage.getItem('copperCount')));
    if (JSON.parse(localStorage.getItem('ironCount')) != null) tileDetails[4].count = parseInt(JSON.parse(localStorage.getItem('ironCount')));
    //console.log(currentMine.tiles);
}

function mousePressed() {
    if (lastSelectedTile >= 0) {
        if (currentMine.tiles[lastSelectedTile].getHovering()) {
            currentMine.tiles[lastSelectedTile].destroy();
            currentlyBreaking = lastSelectedTile;
        }
    }
}

function mouseReleased() {
    if (currentlyBreaking >= 0) {
        if (currentMine.tiles[currentlyBreaking].getHovering()) {
            currentMine.tiles[currentlyBreaking].restore();
            currentlyBreaking = -1;
        }
    }
}

function mouseDragged() {
    if (currentlyBreaking >= 0) {
        if (!currentMine.tiles[currentlyBreaking].getHovering()) {
            currentMine.tiles[currentlyBreaking].restore();
            currentlyBreaking = -1;
        }
    }
    if (lastSelectedTile >= 0) {
        if (currentMine.tiles[lastSelectedTile].getHovering()) {
            currentMine.tiles[lastSelectedTile].destroy();
            currentlyBreaking = lastSelectedTile;
        }
    }
}

function updateOtherPlayerLocation(data) {
    //console.log('receiving data' + data);
    var foundPlayer = false;
    for (var i = 0; i < otherPlayers.length; i++) {
        if (otherPlayers[i].id == data.id) {
            otherPlayers[i] = data;  
            foundPlayer = true;
            break;
        }
    }
    if (!foundPlayer) otherPlayers.push(data);
}

function fetchPlayerLocations() {
    prisoner.emitLocation();
}