var roomClass = require('./room.js');

function draftServer () {
    // Server information
    this.sessionDate = new Date();
    this.startCount = 0;
    this.endCount = 0;
    this.redraftCount = 0;

    // Server Attributes
    this.rooms = {};
    this.matchmakingWaitingRooms = { "cm" : null, "cd" : null};
    this.privateWaitingRooms = {};
}

// Getters
draftServer.prototype.getSessionDate = function() {
    return this.sessionDate;
};
draftServer.prototype.getStartCount = function() {
    return this.startCount;
};
draftServer.prototype.getEndCount = function() {
    return this.endCount;
};
draftServer.prototype.getRedraftCount = function() {
    return this.redraftCount;
};

// Methods
draftServer.prototype.incrementStartCount = function() {
    this.startCount++;
};
draftServer.prototype.incrementEndCount = function() {
    this.endCount++;
};
draftServer.prototype.incrementRedraftCount = function() {
    this.redraftCount++;
};

draftServer.prototype.addPrivateWaitingRoom = function(room) {
    this.privateWaitingRooms[room.id] = room;
};
draftServer.prototype.hasPrivateWaitingRoom = function(id) {
    var room = this.privateWaitingRooms[id];
    return !(typeof(room) === 'undefined' || room === null);
};
draftServer.prototype.getPrivateWaitingRoom = function(id) {
    if (this.hasPrivateWaitingRoom(id))
        return this.privateWaitingRooms[id];
    else
        return null;
};
draftServer.prototype.removePrivateWaitingRoom = function(id) {
    delete this.privateWaitingRooms[id];
};
draftServer.prototype.addPlayerToPrivateRoom = function(id, player, mode) {
    if (id === null) {
        // New private room
        var newRoom = new roomClass(this.getUnusedId(), player, mode, true);

        console.log(newRoom.getId());
        this.addPrivateWaitingRoom(newRoom);
        player.getSocket().emit('join_success', { roomId : newRoom.getId() });
        player.setRoomId(newRoom.getId());
    } else {
        // Join private room
        if (!this.hasPrivateWaitingRoom(id)) {
            player.socket.emit('join_fail', { error: 'noroom' });
            player.socket.disconnect();
            return;
        } else {
            player.setRoomId(id);
            var privateRoom = this.getPrivateWaitingRoom(id);
            privateRoom.setPlayer2(player);
            privateRoom.touch();

            privateRoom.getPlayer1().getSocket().emit('player_join', {nick: privateRoom.getPlayer2().getNickname()});
            privateRoom.getPlayer2().getSocket().emit('join_success');
            privateRoom.getPlayer2().getSocket().emit('player_join', {nick: privateRoom.getPlayer1().getNickname()});

            this.addRoom(privateRoom);
            privateRoom.startTimer(this);
            this.removePrivateWaitingRoom(privateRoom.getId());
        }
    }
};
draftServer.prototype.matchmakingPlayer = function(player, mode) {
    var roomMode = mode === "cd" ? "cd" : "cm";
    var room = this.matchmakingWaitingRooms[roomMode];
    if (room === null) {
        room = new roomClass(this.getUnusedId(), player, roomMode, false);
        player.socket.emit('join_success');
        player.setRoomId(room.getId());
        this.matchmakingWaitingRooms[roomMode] = room;
    } else {
        room.setPlayer2(player);
        room.touch();

        room.getPlayer1().getSocket().emit('player_join', {nick: room.getPlayer2().getNickname()});
        room.getPlayer2().getSocket().emit('join_success');
        room.getPlayer2().getSocket().emit('player_join', {nick: room.getPlayer1().getNickname()});

        this.addRoom(room);
        room.startTimer(this);
        this.matchmakingWaitingRooms[roomMode] = null;
    }
};

draftServer.prototype.getRoomsCount = function() {
    var count = 0;
    for (var k in this.rooms) {
        if (this.rooms.hasOwnProperty(k)) {
            ++count;
        }
    }
    return count;
};
draftServer.prototype.hasRoom = function(id) {
    var room = this.rooms[id];
    return !(typeof(room) === 'undefined' || room === null);
};
draftServer.prototype.addRoom = function(room) {
    this.rooms[room.id] = room;
};
draftServer.prototype.getRoom = function(id) {
    if(this.hasRoom(id))
        return this.rooms[id];
    else
        return null;
}

draftServer.prototype.getUnusedId = function() {
    var used = true;
    var id = new Integer(-1);
    while(used) {
        id = Math.floor(Math.random()*10000);
        if (!this.hasPrivateWaitingRoom(id) && !this.hasRoom(id)
            && (this.matchmakingWaitingRooms.cm === null || this.matchmakingWaitingRooms.cm.getId() != id)
            && (this.matchmakingWaitingRooms.cd === null || this.matchmakingWaitingRooms.cd.getId() != id)) {
            used = false;
        }
    }
    return id;
};

module.exports = draftServer;