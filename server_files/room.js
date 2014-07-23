function room (roomId, roomPlayer1, roomMode) {
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

    // State
    var mode = roomMode;
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
    var timeInterval = null;
}

// Getters
room.prototype.getId = function() {
    return this.id;
};
room.prototype.getSpectatorCount = function() {
    var count = 0;
    for (var k in this.spectators) {
        if (this.spectators.hasOwnProperty(k)) {
            ++count;
        }
    }
    return count;
}

// Methods

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
    */