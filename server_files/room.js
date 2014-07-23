function room (roomId, roomPlayer1, roomMode, roomPrivate) {
    // Room unique id
    var id = roomId;
    // First player creating the room
    var player1 = roomPlayer1;
    // Second player joining the room
    var player2 = null;

    // Players status
    var player1Ready = false;
    var player2Ready = false;
    var player1Redraft = false;
    var player2Redraft = false;

    // Spectators
    var spectators = {};

    // Settings
    var mode = roomMode === "cd" ? "cd" : "cm";
    var private = roomPrivate;

    // State
    var sideChosen = false;
    var sideChooseAgain = false;
    var firstPickChosen = false;
    var firstPickChooseAgain = false;
    var currentAction = "ban";
    var radiant = {
        player : null,
        picks : {},
        bans : {},
        lanes : {}
    }
    var dire = {
        player : null,
        picks : {},
        bans : {},
        lanes : {}
    }

    // Automatic behavior
    var globalTime = 0;
    var radiantTime = 0;
    var direTime = 0;
    var lastActivity = new Date();
    var inactivityTimeout = false;
    var timerInterval = null;
}

// Getters
room.prototype.getId = function() {
    return this.id;
};
room.prototype.isPrivate = function() {
    return this.private;
}
room.prototype.getSpectatorCount = function() {
    var count = 0;
    for (var k in this.spectators) {
        if (this.spectators.hasOwnProperty(k)) {
            ++count;
        }
    }
    return count;
};
room.prototype.getPlayer1 = function() {
    return this.player1;
};
room.prototype.getPlayer2 = function() {
    return this.player2;
};

// Methods
room.prototype.setPlayer2 = function(player) {
    this.player2 = player;
};
room.prototype.touch = function() {
    this.lastActivity = new Date();
};
room.prototype.startTimer = function(draftServer) {
    console.log("TODO START TIMER");
    //rooms[privRoom.id].decreaseTimer = getIntervalFunction(privRoom.id, 1000);
}

module.exports = room;

/*
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
        }
    }
}
*/