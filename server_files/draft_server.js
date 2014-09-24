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
draftServer.prototype.getRoomsCount = function(allRooms) {
    var count = 0;
    for (var k in allRooms) {
        if (allRooms.hasOwnProperty(k)) {
            console.log("Hello here !");
            count++;
        }
    }
    return count;
};
draftServer.prototype.hasRoom = function(id) {
    var room = this.rooms[id];
    return !(typeof(room) === 'undefined' || room === null);
};

draftServer.prototype.getUnusedId = function() {
    var used = true;
    var id = -1;
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