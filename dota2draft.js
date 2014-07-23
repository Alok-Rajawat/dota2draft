//////////////////////
// Libraries
//////////////////////
var fs = require('fs');
var express = require('express');
var http = require('http');
var uuid = require('node-uuid');
var hbs = require('hbs');

//////////////////////
// Application settings
//////////////////////
var cfg = {
    "environment" : "dev"
}

// Load settings.cfg if exists
var settingsFile = "settings.cfg";
cfg.environment = "dev";
if (process.env.NODE_ENVIRONMENT === 'production') {
    cfg.environment = "prod";
}

if (fs.existsSync(settingsFile)) {
    var fileContent = fs.readFileSync(settingsFile, 'utf8');
    var newSettings = JSON.parse(fileContent);
    for(setting in newSettings) {
        cfg[setting] = newSettings[setting];
    }
}

//////////////////////
// Server setup
//////////////////////
var app = express();
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.set('views', __dirname + '/views');
hbs.registerPartials(__dirname + '/views/partials');
if (cfg.environment === 'prod') app.enable('view cache'); else app.disable('view cache');
app.disable('view layout');

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(9000);

//////////////////////
// Routing
//////////////////////
app.use('/files', express.static(__dirname + '/files'));

app.get('/:name(index|)', function (req, res, next) {
    res.render('index', {
        cfg : cfg,
        title : 'Dota 2 Draft',
        server_state_date : draftServer.getSessionDate().toGMTString(),
        drafts_started_count : draftServer.getStartCount(),
        drafts_running_count : stats.runningRooms,
        redrafts_count : draftServer.getRedraftCount(),
        drafts_ended_count : draftServer.getEndCount()
    });
});

app.get('/draft', function (req, res) {
    res.render('draft', {
        cfg : cfg,
        title : 'Dota 2 Draft - Draft Room',
        draft : true,
        spectate : false
    });
});

app.get('/show?*', function(req, res) {
    res.render('show', {
        cfg : cfg,
        title : 'Dota 2 Draft - Draft Result'
    });
});

app.get('/about', function(req, res) {
    res.render('about', {
        cfg : cfg,
        title : 'Dota 2 Draft - About'
    });
});

app.get('/rooms', function(req, res) {
    res.render('rooms', {
        cfg : cfg,
        title : 'Dota 2 Draft - Rooms'
    });
});

app.get('/spectate', function (req, res) {
    res.render('draft', {
        cfg : cfg,
        title : 'Dota 2 Draft - Spectate Room',
        draft : false,
        spectate : true
    });
});

app.get('/rooms/get', function(req, res) {
	var ret = {};
	for (var roomId in rooms) {
		var room = rooms[roomId];
		
		ret[roomId] = room.clone();
	}
	res.send(ret,200);
});

app.get('/rooms/get/:id', function(req, res) {
    var ret = {};
    var room = rooms[req.params.id];
    if (typeof(room) != 'undefined')
        ret[req.params.id] = room.clone();
    res.send(ret,200);
});

// Defaults
app.get('/404', function(req, res){
    res.render('error', {
        cfg : cfg,
        title : 'Dota 2 Draft - 404',
        error_404 : true,
        error_500 : false
    });
});

app.get('/500', function(req, res){
    res.render('error', {
        cfg : cfg,
        title : 'Dota 2 Draft - 500',
        error_404 : false,
        error_500 : true
    });
});

app.use(function(err, req, res, next) {
    console.log(new Date().toISOString() + "# " + err);
    console.trace(err);
    res.redirect('/500');
});

app.get('*', function(req, res){
    res.redirect('/404');
});

//////////////////////
// Setup Server
//////////////////////

var draftServerClass = require('./server_files/draft_server.js');
var roomClass = require('./server_files/room.js');
var playerClass = require('./server_files/player.js');

var draftServer = new draftServerClass();

// Stats tracing
var stats = {};
stats.runningRooms = 0;

// Room management
var rooms = {};
var id = 0;
var freeRoom = {};

function getIntervalFunction(room, time) {
    return setInterval(function() {
        decreaseFunction(rooms[eval(room)])
    }, time);
}

function decreaseFunction(room) {
    var dateNow = new Date();
    if (room == null) return;
    if (room.pickingSide != null) {

        // DEC TIME
        if(room.globalTime != 0)
            room.globalTime--;
        else {
            var side = null;
            if (room.pickingSide == 'Radiant')
                side = room.radiant;
            else
                side = room.dire;

            if (side.time.sec != 0)
                side.time.sec--;
            else {
                if (side.time.min != 0) {
                    side.time.min--;
                    side.time.sec = 59;
                } else {
                    var index = Math.floor(Math.random()*room.heroes.length);
                    processHeroChoice(room, room.heroes[index]);
                }
            }
        }
    }
    if (room.id >= 0) {
        if (dateNow - room.lastActivity > 600000) {
            room.player1.emit('no_activity_timeout', {});
            room.player2.emit('no_activity_timeout', {});

            for (var spectatorUUID in room.spectators) {
                if (spectatorUUID == 'clone') continue;
                room.spectators[spectatorUUID].emit('no_activity_timeout', {});
                room.spectators[spectatorUUID].disconnect();
            }
            room.inactivityTimeout = true;
            room.player1.disconnect();
            room.player2.disconnect();

            clearInterval(room.decreaseTimer);
            delete rooms[room.id];
            stats.runningRooms--;
        }
    }
}

//////////////////////
// NETWORK
//////////////////////
io.sockets.on('connection', function (socket) {
	
	socket.emit('connection_success');

	socket.on('join', function(data) {
        var socketData = {};
        socketData.type = "player";
        socketData.uuid = uuid.v1();
			
		if (typeof(data) === 'undefined') {
            socket.disconnect();
			return;
        }
		
		if (data.roomType == 'pv') {
			if (data.roomId == null) {
				var newRoom = buildRoom(id, socket, null, data.nick, null, data.mode);
                newRoom.isPv = true;
                draftServer.addPrivateWaitingRoom(newRoom);
				socket.emit('join_success', { roomId : id });
                socketData.roomId = id;
				id++;
                if (id > 9999) id = 0;
			} else {
				if (!draftServer.hasPrivateWaitingRoom(data.roomId)) {
					socket.emit('join_fail', { error : 'noroom' });
					return;
				} else {
                    var privRoom = draftServer.getPrivateWaitingRoom(data.roomId);
					privRoom.player2 = socket;
					privRoom.player2nickname = data.nick;
                    privRoom.lastActivity = new Date();
					socket.emit('join_success');
					privRoom.player1.emit('player_join', {nick : data.nick});
					socket.emit('player_join', {nick : privRoom.player1nickname});
					rooms[privRoom.id] = privRoom;
                    rooms[privRoom.id].decreaseTimer = getIntervalFunction(privRoom.id, 1000);
                    socketData.roomId = privRoom.id;
					draftServer.removePrivateWaitingRoom(privRoom.id);
                    stats.runningRooms++;
				}
			}
		} else {
			if (freeRoom[data.mode] == null) {
				freeRoom[data.mode] = buildRoom(id, socket, null, data.nick, null, data.mode);
                freeRoom[data.mode].isPv = false;
				id++;
                if (id > 9999) id = 0;
				socket.emit('join_success');
                socketData.roomId = freeRoom[data.mode].id;
			} else if (freeRoom[data.mode].player2 == null) {
				freeRoom[data.mode].player2 = socket;
				freeRoom[data.mode].player2nickname = data.nick;
                freeRoom[data.mode].lastActivity = new Date();
				socket.emit('join_success');
				freeRoom[data.mode].player1.emit('player_join', {nick : data.nick});
				socket.emit('player_join', {nick : freeRoom[data.mode].player1nickname} );
				rooms[freeRoom[data.mode].id] = freeRoom[data.mode];
                rooms[freeRoom[data.mode].id].decreaseTimer = getIntervalFunction(freeRoom[data.mode].id, 1000);
                socketData.roomId = freeRoom[data.mode].id;
				freeRoom[data.mode] = null;
                stats.runningRooms++;
			}
			
		}

        socket.socketData = socketData;
	});


    socket.on('spectate', function(data) {
        var socketData = {};
        socketData.type = "spectator";
        socketData.uuid = uuid.v1();

        if (typeof(data) == 'undefined') {
            socket.emit('spectate_invalidRoom', {});
            socket.disconnect();
            return;
        }

        if (typeof(data.roomId) == 'undefined') {
            socket.emit('spectate_invalidRoom', {});
            socket.disconnect();
            return;
        }

        socketData.roomId = data.roomId;

        var room = rooms[socketData.roomId];
        if (room == null) {
            socket.emit('spectate_invalidRoom', {});
            socket.disconnect();
            return;
        }

        var copyRoom = room.clone();
        socket.emit('spectate_valid', copyRoom);

        room.spectatorsCount++;
        room.spectators[socketData.uuid] = socket;
        SendSpectatorCount(room);

        socket.socketData = socketData;
    });

    function SendSpectatorCount(room) {
        if (room == null)
            return;

        room.player1.emit('spectator_count', { spectatorsCount : room.spectatorsCount });
        room.player2.emit('spectator_count', { spectatorsCount : room.spectatorsCount });

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('spectator_count', { spectatorsCount : room.spectatorsCount });
        }
    }
	
	socket.on('redraft', function() {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;

        room.lastActivity = new Date();

        var redraft = false;
        var redraftPlayer = "";
        if (room.player1 == socket && room.player1redraft == false) {
            room.player1redraft = true;
            room.player1.emit('redraft', { player : 'you'});
            room.player2.emit('redraft', { player : 'opponent'});
            redraftPlayer = "player1";
            start = room.player2redraft;
        } else if (room.player2 == socket && room.player2redraft == false) {
            room.player2redraft = true;
            room.player1.emit('redraft', { player : 'opponent'});
            room.player2.emit('redraft', { player : 'you'});
            redraftPlayer = "player2";
            start = room.player1redraft;
        }

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('redraft', { player : redraftPlayer });
        }

        if (start) {
            var newRoom = buildRoom(room.id, room.player1, room.player2, room.player1nickname, room.player2nickname, room.mode);
            newRoom.isPv = room.isPv;
            newRoom.spectators = room.spectators;
            newRoom.spectatorsCount = room.spectatorsCount;
            clearInterval(room.decreaseTimer);
            delete rooms[socketData.roomId];
            newRoom.decreaseTimer = getIntervalFunction(newRoom.id, 1000);
            rooms[newRoom.id] = newRoom;
            newRoom.player1.emit('redraft_start');
            newRoom.player2.emit('redraft_start');

            for (var spectatorUUID in room.spectators) {
                if (spectatorUUID == 'clone') continue;
                room.spectators[spectatorUUID].emit('redraft_start', {} );
            }

            draftServer.incrementRedraftCount();
        }
	});
	
	// GAME

    function DecideSides(room) {
        room.chooseSide = Math.floor((Math.random()*2)+1);
        var playerChoose = "";
        if (room.chooseSide == 1) {
            room.chooseBegin = 2;
            playerChoose = "player1";
            room.player1.emit('side_choose', { player : 'you', version : { name : room.version, heroes : room.heroes }});
            room.player2.emit('side_choose', { player : 'opponent', version : { name : room.version, heroes : room.heroes }});
        } else {
            room.chooseBegin = 1;
            playerChoose = "player2";
            room.player1.emit('side_choose', { player : 'opponent', version : { name : room.version, heroes : room.heroes }});
            room.player2.emit('side_choose', { player : 'you', version : { name : room.version, heroes : room.heroes }});
        }

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('side_choose', { player : playerChoose, version : { name : room.version, heroes : room.heroes }});
        }
    }

	socket.on('player_ready', function() {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;
        room.lastActivity = new Date();

        var start = false;
        var playerReady = "";
        if (room.player1 == socket && room.player1ready == false) {
            room.player1ready = true;
            playerReady = "player1";
            room.player1.emit('player_ready', { player : 'you'});
            room.player2.emit('player_ready', { player : 'opponent'});
            start = room.player2ready;
        } else if (room.player2 == socket && room.player2ready == false) {
            room.player2ready = true;
            playerReady = "player2";
            room.player1.emit('player_ready', { player : 'opponent'});
            room.player2.emit('player_ready', { player : 'you'});
            start = room.player1ready;
        }

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('player_ready', { player : playerReady });
        }

        if (start) {
            draftServer.incrementStartCount();
            if (room.isPv) {
                DecideVersion(room);
            } else {
                setupHeroPool(room, 'Tournament');
                DecideSides(room);
            }
        }
	});

    function DecideVersion(room) {
        room.player1.emit('version_choose', { player : 'you' });
        room.player2.emit('version_choose', { player : 'opponent' });

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('version_choose', { player : "player1" });
        }
    }

    socket.on('version_choose', function(data) {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;
        room.lastActivity = new Date();

        setupHeroPool(room, data.version);
        DecideSides(room);
    });

	
	socket.on('side_choose', function(data) {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;
        room.lastActivity = new Date();

        var chooser = null;
        var chooserId = "";
        var nonChooser = null;
        var nonChooserId = "";

        if (room.chooseSide == 1) {
            chooser = room.player1;
            nonChooser = room.player2;
            chooserId = "player1";
            nonChooserId = "player2";
        } else {
            nonChooser = room.player1;
            chooser = room.player2;
            chooserId = "player2";
            nonChooserId = "player1";
        }

        if (socket != chooser)
            return;
        if (room.chooseCount == 1 && data.side == 'Other')
            return;
        if (room.chooseSide == 1)
            room.chooseSide = 2;
        else
            room.chooseSide = 1;
        room.chooseCount = 1;

        chooser.emit('side_choose_value', { side : data.side, player : 'you' });
        nonChooser.emit('side_choose_value', { side : data.side, player : 'opponent' });

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('side_choose_value', { player : chooserId, side : data.side, nonPlayer : nonChooserId});
        }

        if (data.side != 'Other') {
            if (data.side == 'Radiant') {
                room.radiant.socket = chooser;
                room.radiant.player = chooserId;
                room.dire.socket = nonChooser;
                room.dire.player = nonChooserId;
            } else {
                room.radiant.socket = nonChooser;
                room.radiant.player = nonChooserId;
                room.dire.socket = chooser;
                room.dire.player = chooserId;
            }

            if (room.chooseBegin == 1) {
                chooser = room.player1;
                chooserId = "player1";
                nonChooser = room.player2;
                nonChooserId = "player2";
            } else {
                chooser = room.player2;
                chooserId = "player2";
                nonChooser = room.player1;
                nonChooserId = "player1";
            }

            chooser.emit('begin_choose', { player : 'you' });
            nonChooser.emit('begin_choose', { player : 'opponent' });

            for (var spectatorUUID in room.spectators) {
                if (spectatorUUID == 'clone') continue;
                room.spectators[spectatorUUID].emit('begin_choose', { player : chooserId});
            }
        }
	});
	
	socket.on('begin_choose', function(data) {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;
        room.lastActivity = new Date();

        var chooser = null;
        var chooserId = "";
        var nonChooser = null;
        var nonChooserId = "";

        if (room.chooseBegin == 1) {
            chooser = room.player1;
            chooserId = "player1";
            nonChooser = room.player2;
            nonChooserId = "player2";
        } else {
            nonChooser = room.player1;
            nonChooserId = "player1";
            chooser = room.player2;
            chooserId = "player2";
        }

        if (socket != chooser)
            return;
        if (room.chooseBeginCount == 1 && data.side == 'Other')
            return;
        if (room.chooseBegin == 1)
            room.chooseBegin = 2;
        else
            room.chooseBegin = 1;
        room.chooseBeginCount = 1;

        var beginSide = data.side;
        if (data.side == 'Random') {
            var randomI = Math.floor((Math.random()*2)+1);
            if (randomI == 1)
                beginSide = 'Radiant';
            else
                beginSide = 'Dire';
        }

        chooser.emit('begin_choose_value', { side : data.side, player : 'you' , randomResult : beginSide});
        nonChooser.emit('begin_choose_value', { side : data.side, player : 'opponent' , randomResult : beginSide});
        room.firstPick = beginSide;

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('begin_choose_value', { side : data.side, player : chooserId , randomResult : beginSide});
        }

        if (beginSide != 'Other') {
            setupMode(room);
            var payloadData = { mode : room.mode, heroes : room.heroes, radiantTime : room.radiant.time, direTime : room.dire.time, globalTime : room.globalTime};
            chooser.emit('setup_mode', payloadData);
            nonChooser.emit('setup_mode', payloadData);

            for (var spectatorUUID in room.spectators) {
                if (spectatorUUID == 'clone') continue;
                room.spectators[spectatorUUID].emit('setup_mode', payloadData);
            }
            room.pickingSide = beginSide;
        }
	});
	
	socket.on('choose_hero', function(data) {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;
        room.lastActivity = new Date();

        if (data.action != room.action)
            return;

        var side = null;
        if (room.pickingSide == 'Radiant')
            side = room.radiant;
        else
            side = room.dire;
        if (side.socket != socket)
            return;

        var seen = false;
        for (i = 0; i < room.heroes.length; i++) {
            if (room.heroes[i] == data.choice) {
                seen = true;
                break;
            }
        }

        if (!seen)
            return;

        processHeroChoice(room, data.choice);
	});
	
	socket.on('lanes', function(data) {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;
        room.lastActivity = new Date();

        if (socket == room.player1) {
            if (room.player1lanes == null) {
                room.player1lanes = data;
                room.player1.emit('lanes_status', { player : 'You'});
                room.player2.emit('lanes_status', { player : 'Opponent'});

                for (var spectatorUUID in room.spectators) {
                    if (spectatorUUID == 'clone') continue;
                    room.spectators[spectatorUUID].emit('lanes_status', { lanes : data, player : "player1"});
                }
            }
        } else if (socket == room.player2) {
            if (room.player2lanes == null) {
                room.player2lanes = data;
                room.player1.emit('lanes_status', { player : 'Opponent'});
                room.player2.emit('lanes_status', { player : 'You'});

                for (var spectatorUUID in room.spectators) {
                    if (spectatorUUID == 'clone') continue;
                    room.spectators[spectatorUUID].emit('lanes_status', { lanes : data, player : "player2"});
                }
            }
        }

        if (room.player1lanes != null && room.player2lanes != null) {
            room.player1.emit('lanes_result', room.player2lanes);
            room.player2.emit('lanes_result', room.player1lanes);

            for (var spectatorUUID in room.spectators) {
                if (spectatorUUID == 'clone') continue;
                room.spectators[spectatorUUID].emit('lanes_result', {});
            }
        }
	});
	
	// CHAT
	
	socket.on('message', function(data) {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        var room = rooms[socketData.roomId];
        if (room == null)
            return;
        room.lastActivity = new Date();

        var player = "";
        if (room.player1 == socket) {
            player = "player1";
            room.player2.emit('message', data);
        } else {
            player = "player2";
            room.player1.emit('message', data);
        }

        for (var spectatorUUID in room.spectators) {
            if (spectatorUUID == 'clone') continue;
            room.spectators[spectatorUUID].emit('message', { player : player, message : data.message});
        }
	});
	
	// END OF CONNECTION
	
	socket.on('disconnect', function () {
        var socketData = socket.socketData;
        if (socketData == null)
            return;

        if (socketData.type == "player") {
            if(freeRoom['cm'] != null && freeRoom['cm'].player1 == socket) {
                freeRoom['cm'] = null;
                return;
            } else if (freeRoom['cd'] != null && freeRoom['cd'].player1 == socket) {
                freeRoom['cd'] = null;
                return;
            }

            if (draftServer.hasPrivateWaitingRoom(socketData.roomId)) {
                draftServer.removePrivateWaitingRoom(socketData.roomId);
                return;
            }

            var room = rooms[socketData.roomId];
            if (!(room === undefined) && room != null) {
                if (room.inactivityTimeout)
                    return;

                var player = "";
                if (room.player1 == socket) {
                    room.player2.emit('player_left', {});
                    player = "player1";
                } else {
                    player = "player2";
                    room.player1.emit('player_left', {});
                }

                for (var spectatorUUID in room.spectators) {
                    if (spectatorUUID == 'clone') continue;
                    room.spectators[spectatorUUID].emit('player_left', {player : player});
                    room.spectators[spectatorUUID].disconnect();
                }

                clearInterval(room.decreaseTimer);
                delete rooms[socketData.roomId];
                stats.runningRooms--;

                return;
            }
        }

        if (socketData.type == "spectator") {
            var room = rooms[socketData.roomId];
            if (!(room === undefined) && room != null) {
                room.spectatorsCount--;
                delete room.spectators[socketData.uuid];
            }
            SendSpectatorCount(room);
        }
    });
});

//////////////////////
// OTHERS
//////////////////////
function setupHeroPool(room, version) {
    room.version = version;
    room.heroes = { str : [], agi : [], int : [] };

    // Valid in both versions
    room.heroes.str.push(
        'earthshaker',
        'sven',
        'tiny',
        'kunkka',
        'beastmaster',
        'dragon_knight',
        'clockwerk',
        'omniknight',
        'huskar',
        'alchemist',
        'brewmaster',
        'treant_protector',
        'whisp',
        'centaur',
        'shredder',
        'bristleback',
        'tusk',
        'elder_titan',
        'axe',
        'pudge',
        'sand_king',
        'slardar',
        'tidehunter',
        'skeleton_king',
        'lifestealer',
        'night_stalker',
        'doom_bringer',
        'spirit_breaker',
        'lycanthrope',
        'chaos_knight',
        'undying',
        'magnus',
        'abaddon'
    );
    room.heroes.agi.push(
        'anti_mage',
        'drow_ranger',
        'juggernaut',
        'mirana',
        'morphling',
        'phantom_lancer',
        'vengeful_spirit',
        'riki',
        'sniper',
        'templar_assassin',
        'luna',
        'bounty_hunter',
        'ursa',
        'gyrocopter',
        'lone_druid',
        'naga_siren',
        'troll_warlord',
        'bloodseeker',
        'shadow_fiend',
        'razor',
        'venomancer',
        'faceless_void',
        'phantom_assassin',
        'viper',
        'clinkz',
        'weaver',
        'spectre',
        'meepo',
        'nyx_assassin',
        'slark',
        'ember_spirit',
        'medusa'
    );
    room.heroes.int.push(
        'crystal_maiden',
        'puck',
        'storm_spirit',
        'windrunner',
        'zeus',
        'lina',
        'shadow_shaman',
        'tinker',
        'natures_prophet',
        'enchantress',
        'jakiro',
        'chen',
        'silencer',
        'ogre_magi',
        'rubick',
        'disruptor',
        'keeper_of_the_light',
        'skywrath_mage',
        'bane',
        'lich',
        'lion',
        'witch_doctor',
        'enigma',
        'necrolyte',
        'warlock',
        'queen_of_pain',
        'death_prophet',
        'pugna',
        'dazzle',
        'leshrac',
        'dark_seer',
        'batrider',
        'ancient_apparition',
        'invoker',
        'outlord_destroyer',
        'shadow_demon',
        'visage'
    );

    if (version == 'Latest') {
        room.heroes.str.push(
            'earth_spirit',
            'legion_commander',
            'phoenix'
        );
        room.heroes.agi.push(
            'broodmother',
            'terrorblade'
        );
    }
}

function setupMode(room) {

    if (room.mode == "cd") {
        for (var attribute in room.heroes) {

            var reducedAttribute = [];
            for (var i = 0; i < 9; i++) {
                reducedAttribute[i] = room.heroes[attribute][i];
            }
            for (var i = 9; i < room.heroes[attribute].length; i++) {
                var index = Math.floor(Math.random()*(i+1));
                if (index < 9) {
                    reducedAttribute[index] = room.heroes[attribute][i];
                }
            }
            room.heroes[attribute] = reducedAttribute;
        }
    }

    room.heroes = room.heroes.str.concat(room.heroes.agi, room.heroes.int);

    setupStartingTime(room);
};

function setupStartingTime(room) {

    if (room.mode == "cm") {
        room.globalTime = 29;
        room.radiant.time.min = 1;
        room.radiant.time.sec = 50;
        room.dire.time.min = 1;
        room.dire.time.sec = 50;
    }

    if (room.mode == "cd") {
        room.globalTime = 0;
        room.radiant.time.min = 2;
        room.radiant.time.sec = 30;
        room.dire.time.min = 2;
        room.dire.time.sec = 30;
    }
}

function processHeroChoice(room, hero) {
	for (i = 0; i < room.heroes.length; i++) {
		if(room.heroes[i] == hero) {
			room.heroes.splice(i,1);
			break;
		}
	}

	var pickSide = null;
	var unpickSide = null;
	if (room.pickingSide == 'Radiant') {
		pickSide = room.radiant;
		unpickSide = room.dire;
	} else {
		pickSide = room.dire;
		unpickSide = room.radiant;
	}
	
	pickSide.socket.emit('choose_hero', { choice : hero, action : room.action, side : room.pickingSide });
	unpickSide.socket.emit('choose_hero', { choice : hero, action : room.action, side : room.pickingSide });

    for (var spectatorUUID in room.spectators) {
        if (spectatorUUID == 'clone') continue;
        room.spectators[spectatorUUID].emit('choose_hero', { player : pickSide.player, choice : hero, action : room.action});
    }
	
	// Compute new state
	if (room.action == 'Ban') {
		pickSide.banlist[pickSide.banlist.length] = hero;
		pickSide.ban++;
		room.globalTime = 29;
		if ((pickSide.ban == 2 && unpickSide.ban == 2 && room.mode == "cm")
            || (pickSide.ban == 3 && unpickSide.ban == 3 && room.mode == "cd")
            || (pickSide.ban == 4 && unpickSide.ban == 4)
            || (pickSide.ban == 5 && unpickSide.ban == 5)) {
			room.action = 'Pick';
            room.globalTime = 39;
        }
        if (!(pickSide.ban == 4 && unpickSide.ban == 4)) {
            room.pickingSide = unpickSide.name;
        }
	} else {
		pickSide.picklist[pickSide.picklist.length] = hero;
		pickSide.pick++;
        if (pickSide.pick == 5 && unpickSide.pick == 5) {
            room.globalTime = 0;
            room.action = 'Laning';
            room.pickingSide = null;
            draftServer.incrementEndCount();
        } else {
            if (room.mode == "cm") {
                if (pickSide.pick == 2 && unpickSide.pick == 2) {
                    room.action = 'Ban';
                    room.globalTime = 29;
                } else if (pickSide.pick == 4 && unpickSide.pick == 4) {
                    room.pickingSide = unpickSide.name;
                    room.action = 'Ban';
                    room.globalTime = 29;
                } else {
                    if (pickSide.pick != unpickSide.pick
                        || pickSide.pick == 3){
                        room.pickingSide = unpickSide.name;
                    }
                    room.globalTime = 39;
                }
            } else if (room.mode == "cd") {
                if ((pickSide.pick == 1 && unpickSide.pick == 0)
                    || (pickSide.pick == 2 && unpickSide.pick == 1)
                    || (pickSide.pick == 3 && unpickSide.pick == 2)
                    || (pickSide.pick == 4 && unpickSide.pick == 3)
                    || (pickSide.pick == 5 && unpickSide.pick == 4)) {
                    room.pickingSide = unpickSide.name;
                }
            }
        }
	}

    if (room.mode == "cd") {
        room.globalTime = 0;
    }
	
	// Send new state
	pickSide.socket.emit('new_state', { action : room.action, side : room.pickingSide , radiantTime : room.radiant.time, direTime : room.dire.time, globalTime : room.globalTime});
	unpickSide.socket.emit('new_state', { action : room.action, side : room.pickingSide , radiantTime : room.radiant.time, direTime : room.dire.time, globalTime : room.globalTime});

    for (var spectatorUUID in room.spectators) {
        if (spectatorUUID == 'clone') continue;
        room.spectators[spectatorUUID].emit('new_state', { action : room.action, side : room.pickingSide , radiantTime : room.radiant.time, direTime : room.dire.time, globalTime : room.globalTime});
    }
		
};

function buildRoom(id, player1socket, player2socket, player1nick, player2nick, mode) {
	var buildRoom = {id : id, player1 : player1socket, player2 : player2socket, player1nickname : player1nick, player2nickname : player2nick, player1ready : false, player2ready : false, 
			player1lanes : null, player2lanes : null, chooseSide : 0, chooseCount : 0, chooseBegin : 0, chooseBeginCount : 0,
			radiant : { name : 'Radiant', socket : null, player : '...', time : { min : 0, sec : 0 } , pick : 0, picklist : [], ban : 0, banlist : []},
			dire : { name : 'Dire', socket : null , player : '...', time : { min : 0, sec : 0 }, pick : 0, picklist : [], ban : 0, banlist : []},
			pickingSide : null, firstPick : null, action : 'Ban', globalTime : 0, heroes : [], player1redraft : false, player2redraft : false,
            spectators : {}, spectatorsCount : 0, lastActivity : new Date(), inactivityTimeout : false, mode : mode, decreaseTimer : null };

    Object.prototype.clone = function() {
	  var newObj = (this instanceof Array) ? [] : {};
	  for (i in this) {
	    if (i == 'clone') continue;
	    if (i == 'player1') continue;
	    if (i == 'player2') continue;
	    if (i == 'socket') continue;
        if (i == 'spectators') continue;
        if (i == 'decreaseTimer') continue;
        if (i == 'inactivityTimeout') continue;
	    if (this[i] && typeof this[i] == "object") {
	      newObj[i] = this[i].clone();
	    } else newObj[i] = this[i]
	  } return newObj;
	};
			
	return buildRoom;
};

