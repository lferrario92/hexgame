var HexGame = HexGame || {};

HexGame.Board = function(state, grid) {
  Phaser.Group.call(this, state.game);

  this.state = state;
  this.game = state.game;
//  this.grid = grid;
  this.grid = [
    [1, 0, 0, 3, 0, 0, 2, 0, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 4, 2, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 4, 2, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 4, 2, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 4, 2, 1, 1, 0, 0, 0, 0, 0],
    [0, 3, 1, 1, 0, 3, 0, 0, 0, 2, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 3 ,4 ,0, 0, 0, 0, 0, 0],
    [0, 3, 0, 4, 4, 3, 0, 0 ,0, 1, 0, 0, 0, 0, 0],
    [0, 3, 0, 4, 4, 3, 0, 0 ,0, 1, 0, 0, 0, 0, 0],
    [0, 3, 0, 4, 4, 3, 0, 0 ,0, 1, 0, 0, 0, 0, 0],
    [0, 3, 0, 4, 4, 3, 0, 0 ,0, 1, 0, 0, 0, 0, 0]
  ];

  this.rows = this.grid.length;
  this.cols = this.grid[0].length;

  noise.seed(Math.random());

  for(row = 0; row < this.rows; row++) {
    for(col = 0; col < this.cols; col++) {
      var value = noise.simplex2(row / this.rows, col / this.cols);
      
      if (value > -0.4) {
        this.grid[row][col] = 0
      }
      if (value > 0) {
        this.grid[row][col] = 1
      }
      if (value > 0.25) {
        this.grid[row][col] = 2
      }
      if (value > 0.4) {
        this.grid[row][col] = 3
      }
      if (value > 0.7) {
        this.grid[row][col] = 4
      }
      if (value > 0.8) {
        this.grid[row][col] = 5
      }
    }
  }

  this.terrains = [
    {asset: 'water', blocked: true},
    {asset: 'sand'},
    {asset: 'grass'},
    {asset: 'grasstrees'},
    {asset: 'grasstrees2'},
    {asset: 'rocks'},
  ];

  //create hexagons
  var row, col, tile, x, y;
  for(row = 0; row < this.rows; row++) {
    for(col = 0; col < this.cols; col++) {
      //even rows
      if(row % 2 === 0) {
        x = this.state.MARGIN_X + col * this.state.TILE_W;
      }
      //odd rows
      else {
        x = this.state.MARGIN_X + col * this.state.TILE_W + this.state.TILE_W/2;
      }

      y = this.state.MARGIN_Y + row * this.state.TILE_H * 3/4;

      tile = new Phaser.Sprite(this.game, x, y, this.terrains[this.grid[row][col]].asset);

      //keep some information in the tile object
      tile.row = row;
      tile.col = col;
      tile.terrainAsset = this.terrains[this.grid[row][col]].asset;
      tile.blocked = this.terrains[this.grid[row][col]].blocked;

      tile.inputEnabled = true;
      tile.input.pixelPerfectClick = true;

      /*
      tile.events.onInputDown.add(function(tile){
        var adj = this.getAdjacent(tile, true);

        adj.forEach(function(t){
          t.alpha = 0.3;
        }, this);
      }, this);*/

      this.add(tile);
    }
  }


};


HexGame.Board.prototype = Object.create(Phaser.Group.prototype);
HexGame.Board.prototype.constructor = HexGame.Board;

HexGame.Board.prototype.getFromRowCol = function(row, col) {
  var foundTile;

  this.forEach(function(tile){
    if(tile.row === row && tile.col === col) {
      foundTile = tile;
    }
  }, this);

  return foundTile;
};

HexGame.Board.prototype.getXYFromRowCol = function(row, col){
  var pos = {};

  //even rows
  if(row % 2 === 0) {
    pos.x = this.state.MARGIN_X + col * this.state.TILE_W + this.state.TILE_W/2;
  }
  //odd rows
  else {
    pos.x = this.state.MARGIN_X + col * this.state.TILE_W + this.state.TILE_W/2 + this.state.TILE_W/2;
  }

  pos.y = this.state.MARGIN_Y + row * this.state.TILE_H * 3/4 + this.state.TILE_H/2;

  return pos;
};















HexGame.Board.prototype.getAdjacent = function(tile, rejectBlocked) {
  var adjacentTiles = [];
  var row = tile.row;
  var col = tile.col;

  var relativePositions = [];

  //relative positions of adjacent cells depend whether the row is odd or event
  //even rows
  if(row % 2 === 0) {
    relativePositions = [
      {r: -1, c: 0},
      {r: -1, c: -1},
      {r: 0, c: -1},
      {r: 0, c: 1},
      {r: 1, c: 0},
      {r: 1, c: -1}
    ]
  }

  //odd rows
  else {
    relativePositions = [
      {r: -1, c: 0},
      {r: -1, c: 1},
      {r: 0, c: -1},
      {r: 0, c: 1},
      {r: 1, c: 0},
      {r: 1, c: 1}
    ];
  }

  var adjTile;

  relativePositions.forEach(function(pos){
    //check that we are not on the edge of the map
    if((row + pos.r >= 0) && (row + pos.r < this.rows) && (col + pos.c >= 0) && (col + pos.c < this.cols)) {
      //get adjacent tile
      adjTile = this.getFromRowCol(row + pos.r, col + pos.c);

      if(!rejectBlocked || !adjTile.blocked) {
        adjacentTiles.push(adjTile);
      }
    }
  }, this);

  return adjacentTiles;
};