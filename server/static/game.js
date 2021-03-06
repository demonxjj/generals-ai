function startGame(settings) {
  if (!settings) {
    actions = [];
    hist = [];
    num_players = 2;
    cur_player = 0;
    board_width = 8;
    board_height = 8;
    usernames = ['dzd123', 'edwardpark97'];
  } else {
    hist = [];
    actions = settings.actions;
    num_players = settings.num_players;
    cur_player = settings.start_player;
    board_width = settings.board_width;
    board_height = settings.board_height;
    usernames = settings.usernames;
  }
  move = -1;

  $('#scores').append($('<tr>')
    .append($('<th>').text('Username'))
    .append($('<th>').text('Land'))
    .append($('<th>').text('Army')));

  land = [];
  land_elts = [];
  army = [];
  army_elts = [];
  for (var i = 0; i < num_players; ++i) {
    land.push(0);
    army.push(0);
    var user_elt = $('<td>').text(usernames[i]).addClass('color-'+i)
      .css({color:'white'});
    var land_elt = $('<td>').text(land[i]);
    var army_elt = $('<td>').text(army[i]);
    var row = $('<tr>')
      .append(user_elt)
      .append(land_elt)
      .append(army_elt);
    $('#scores').append(row);

    land_elts.push(land_elt);
    army_elts.push(army_elt);
  }

  board = [];
  board_elts = [];
  for (var i = 0; i < board_width * board_height; ++i) {
    board.push({type:"EMPTY"});
  }

  for (var i = 0; i < board_height; ++i) {
    var row = $('<tr>').attr('row', i);
    $('#board').append(row);
    for (var j = 0; j < board_width; ++j) {
      var ind = i * board_width + j;
      var elt = $('<td>').attr({col:j, ind:ind, class:'square empty'});
      row.append(elt);
      board_elts.push(elt);
    }
  }
}

function setPiece(piece, loc) {
  board[loc] = piece;
  switch (piece.type) {
    case "EMPTY":
      board_elts[loc].attr({class:'square empty'});
      board_elts[loc].text('');
      break;
    case "GENERAL":
      board_elts[loc].attr({class:'square general color-'+piece.owner});
      if (piece.size > 0) board_elts[loc].text(piece.size);
      else board_elts[loc].text('');
      break;
    case "ARMY":
      board_elts[loc].attr({class:'square army color-'+piece.owner});
      if (piece.size > 0) board_elts[loc].text(piece.size);
      else board_elts[loc].text('');
      break;
    case "CITY":
      board_elts[loc].attr({class:'square city'});
      if (piece.owner >= 0) {
        board_elts[loc].addClass('color-'+piece.owner);
      }
      if (piece.size > 0) board_elts[loc].text(piece.size);
      else board_elts[loc].text('');
      break;
    case "MOUNTAIN":
      board_elts[loc].attr({class:'square mountain'});
      board_elts[loc].text('');
      break;
  }
}

function setLand(color, size) {
  land[color] = size;
  land_elts[color].text(size);
}

function setArmy(color, size) {
  army[color] = size;
  army_elts[color].text(size);
}

function applyActions(movesToProcess=-1) {
  movesProcessed = 0;
  while (actions.length > 0) {
    var action = actions[0];
    actions.shift();
    switch (action.type) {
      case 'new_piece':
      case 'set_piece':
        hist.push({type:'set_piece', new_piece:board[action.loc], loc:action.loc});
        setPiece(action.new_piece, action.loc);
        break;
      case 'move':
        hist.push({
          type:'move',
          new_piece1:board[action.loc1],
          loc1:action.loc1,
          new_piece2:board[action.loc2],
          loc2:action.loc2
        });
        setPiece(action.new_piece1, action.loc1);
        setPiece(action.new_piece2, action.loc2);
        break;
      case 'no_move':
        hist.push({type:'no_move'});
        break;
      case 'set_land':
        hist.push({type:'set_land', color:action.color, size:land[action.color]});
        setLand(action.color, action.size);
        break;
      case 'set_army':
        hist.push({type:'set_army', color:action.color, size:army[action.color]});
        setArmy(action.color, action.size);
        break;
      case 'next_move':
        hist.push({type:'next_move', next_player:cur_player});
        move++;
        cur_player = action.next_player;
        movesProcessed++;
        if (movesToProcess != -1 && movesProcessed >= movesToProcess) {
          return;
        }
        break;
    }
  }
}

function reverseActions(movesToProcess=-1) {
  movesProcessed = 0;
  while (hist.length > 0) {
    var action = hist.pop();
    switch (action.type) {
      case 'new_piece':
      case 'set_piece':
        actions.unshift({type:'set_piece', new_piece:board[action.loc], loc:action.loc});
        setPiece(action.new_piece, action.loc);
        break;
      case 'move':
        actions.unshift({
          type:'move',
          new_piece1:board[action.loc1],
          loc1:action.loc1,
          new_piece2:board[action.loc2],
          loc2:action.loc2
        });
        setPiece(action.new_piece1, action.loc1);
        setPiece(action.new_piece2, action.loc2);
        break;
      case 'no_move':
        actions.unshift({type:'no_move'});
        break;
      case 'set_land':
        actions.unshift({type:'set_land', color:action.color, size:land[action.color]});
        setLand(action.color, action.size);
        break;
      case 'set_army':
        actions.unshift({type:'set_army', color:action.color, size:army[action.color]});
        setArmy(action.color, action.size);
        break;
      case 'next_move':
        movesProcessed++;
        if (movesToProcess != -1 && movesProcessed > movesToProcess) {
          hist.push(action);
          return;
        }
        actions.unshift({type:'next_move', next_player:cur_player});
        move--;
        cur_player = action.next_player;
        break;
    }
  }
}

$(document).ready(function() {
  var socket = io.connect('http://127.0.0.1:5000');
  socket.on('new_game', function(data) {
    $('#replay-box').append(
      $('<button>').text('Play Game').attr({id: 'play-game'})
    ).append(
      $('<input>').attr({placeholder: '1', id: 'speed'})
    ).append(
      $('<button>').text('Speed').attr({id: 'set-speed'})
    ).append(
      $('<button>').text('Step Forward').attr({id: 'step-forward'})
    ).append(
      $('<button>').text('Step Back').attr({id: 'step-back'})
    ).append(
      $('<button>').text('Step 5 Forward').attr({id: 'step-forward2'})
    ).append(
      $('<button>').text('Step 5 Back').attr({id: 'step-back2'})
    )

    $('#play-game').click(function() {
      replayInterval = setInterval(() => applyActions(1), 500);
    });

    $('#set-speed').click(function() {
      var speed = parseFloat($('#speed').val());
      if (replayInterval) {
        window.clearInterval(replayInterval);
      }

      if (speed != 0) {
        replayInterval = setInterval(() => applyActions(1), Math.round(500 / speed));
      } else {
        replayInterval = null;
      }
    });

    $('#step-forward').click(function() {
      applyActions(1);
    });

    $('#step-forward2').click(function() {
      applyActions(5);
    });

    $('#step-back').click(function() {
      reverseActions(1);
    });

    $('#step-back2').click(function() {
      reverseActions(5);
    });

    startGame(data);
    applyActions(1);
  });

  socket.on('add_actions', function(data) {
    actions = actions.concat(data.actions);
    if (data.num_to_process > 0) {
      applyActions(num_to_process);
    }
  });

  $('#start-game').click(function() {
    var replay_id = $('#replay-form').val();
    $('#replay-form').val('');
    socket.emit('new_game', replay_id);
    $('#start').empty();
  });

  $('#map-builder').click(function() {
    startGame();
    pieces = [
      {type:"EMPTY"},
      {type:"MOUNTAIN"},
      {type:"CITY", owner:-1, size:40},
      {type:"GENERAL", owner:0, size:1},
      {type:"GENERAL", owner:1, size:1},
    ];

    for (var i = 0; i < board_elts.length; ++i) {
      var elt = board_elts[i];
      elt.attr('piece_ind', 0);
    }

    $('#replay-box').append(
      $('<button>').text('Save Map').click(function() {
        generals = [-1, -1];
        mountains = [];
        cities = [];
        for (var i = 0; i < board_elts.length; ++i) {
          piece_ind = board_elts[i].attr('piece_ind');
          if (piece_ind == 1) mountains.push(i);
          else if (piece_ind == 2) cities.push(i);
          else if (piece_ind == 3) generals[0] = i;
          else if (piece_ind == 4) generals[1] = i;
        }
        lines = [
          "setting board_width "+board_width,
          "setting board_height "+board_height,
          "setting start_player "+cur_player,
          "setting usernames "+usernames.join(' '),
          "setting generals "+generals.join(' '),
          "setting mountains "+mountains.join(' '),
          "setting cities "+cities.join(' '),
        ];

        socket.emit('save_map', lines.join('\n') + '\n');
      })
    );

    $('.square').click(function() {
      var piece_ind = parseInt($(this).attr('piece_ind'));
      var loc = parseInt($(this).attr('ind'));
      var new_piece_ind = (piece_ind + 1) % pieces.length;
      setPiece(pieces[new_piece_ind], loc);
      $(this).attr('piece_ind', new_piece_ind);
    });
  });
});

