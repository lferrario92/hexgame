var HexGame = HexGame || {};

HexGame.Unit = function(state, data) {
  var position = state.board.getXYFromRowCol(data.row, data.col);

  Phaser.Sprite.call(this, state.game, position.x, position.y, data.asset);

  this.game = state.game;
  this.state = state;
  this.board = state.board;
  this.row = data.row;
  this.col = data.col;
  this.data = data;

  var lifeBarStyle = { font: "16px Arial", fill: "red", backgroundColor: "blue" }
  this.lifeBar = this.game.add.text(position.x, position.y, Math.floor(this.data.health), lifeBarStyle);

  this.anchor.setTo(0.5);

  //this.inputEnabled = true;
  //this.input.pixelPerfectClick = true;
  //this.events.onInputDown.add(this.showMovementOptions, this);
};

HexGame.Unit.prototype = Object.create(Phaser.Sprite.prototype);
HexGame.Unit.prototype.constructor = HexGame.Unit;

HexGame.Unit.prototype.showMovementOptions = function(){

  this.state.clearSelection();

  //only if the UI is free
  if(this.state.uiBlocked) {
    return;
  }

  //get current tile
  var currTile = this.board.getFromRowCol(this.row, this.col);

  //get the adjacent cells
  var adjacentCells = this.board.getAdjacent(currTile, true);

  adjacentCells.forEach(function(tile){
    tile.alpha = 0.7;

    //add input
    tile.events.onInputDown.add(this.moveUnit, this);
  }, this);
};

HexGame.Unit.prototype.selectUnit = function(tile){
  this.inputEnabled = true;
  this.input.pixelPerfectClick = true;
  this.events.onInputDown.add(this.showMovementOptions, this);
  console.log('selected ' + this.data.asset)
}

HexGame.Unit.prototype.moveUnit = function(tile){
  this.state.clearSelection();

  this.state.uiBlocked = true;

  //target position
  var pos = this.board.getXYFromRowCol(tile.row, tile.col);

  var unitMovement = this.game.add.tween(this);
  var lifeBarMovement = this.game.add.tween(this.lifeBar);

  unitMovement.to(pos, 200);
  lifeBarMovement.to(pos, 200);

  unitMovement.onComplete.add(function(){
    this.state.uiBlocked = false;
    this.row = tile.row;
    this.col = tile.col;
    this.inputEnabled = false;
    this.hasMoved = true;

    this.lifeBar.x = this.x;
    this.lifeBar.y = this.y;

    //check for battles
    this.checkBattle();

    //check for game ending
    this.state.checkGameEnd();

    //prepare the next unit
    this.state.prepareNextUnit();

  }, this);
  lifeBarMovement.onComplete.add(function(){
    this.lifeBar.text = Math.floor(this.data.health);
  }, this);
  unitMovement.start();
  lifeBarMovement.start();
};

HexGame.Unit.prototype.attack = function(attacked) {
  var attacker = this;

  //both units attack each other
  var damageAttacked = Math.max(0, attacker.data.attack * Math.random() - attacked.data.defense * Math.random());
  var damageAttacker = Math.max(0, attacked.data.attack * Math.random() - attacker.data.defense * Math.random());

  if(this.data.type == "melee"){
    attacker.data.health -= damageAttacker;
    attacked.data.health -= damageAttacked;

  } else if (this.data.type == "ranged") {
    console.log('ranged')
    //only damages attacked unit
    attacked.data.health -= damageAttacked;
  }

  if(attacked.data.health <= 0) {
    attacked.kill();
    attacked.lifeBar.kill();
  }

  if(attacker.data.health <= 0) {
    attacker.kill();
    attacker.lifeBar.kill();
  }
};

HexGame.Unit.prototype.checkBattle = function() {
  //get rival army
  var rivalUnits = this.isPlayer ? this.state.enemyUnits : this.state.playerUnits;
  var fightUnit;

  //check rival army units to find a match
  rivalUnits.forEachAlive(function(unit){
    if(this.row === unit.row && this.col === unit.col) {
      console.log('both are in the same cell! -- fight!!!');
      fightUnit = unit;
    }
  }, this);

  //fight until death
  if(fightUnit) {
    while(this.data.health >= 0 && fightUnit.data.health >= 0) {
      this.attack(fightUnit);
    }
    console.log('battle end');
  }
};

HexGame.Unit.prototype.falopa = function() {
  console.log('select unit');
}

HexGame.Unit.prototype.playTurn = function() {
  if(this.isPlayer) {
    this.showMovementOptions();
  }
  else {
    this.aiEnemyMovement();
  }
};

HexGame.Unit.prototype.aiEnemyMovement = function() {
  //clear previous selection
  this.state.clearSelection();

  //get the current tile
  var currTile = this.board.getFromRowCol(this.row, this.col);

  //get the adjacent cells
  var adjacentCells = this.board.getAdjacent(currTile, true);

  //target tile
  var targetTile;

  //go through each adjacent cell and find a rival
  adjacentCells.forEach(function(tile){
    //find out if there is a rival in there
    this.state.playerUnits.forEachAlive(function(unit){
      if(tile.row === unit.row && tile.col === unit.col) {
        console.log('we have found a rival to attack');
        targetTile = tile;
      }
    }, this);
  }, this);

  //if you didnt find a rival, then move randomly
  if(!targetTile) {
    var randomIndex = Math.floor(Math.random() * adjacentCells.length);
    targetTile = adjacentCells[randomIndex];
  }

  //move to the target
  this.moveUnit(targetTile);
};