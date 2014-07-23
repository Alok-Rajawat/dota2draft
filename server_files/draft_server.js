function draftServer () {
    // Server information
    this.sessionDate = new Date();
    this.startCount = 0;
    this.endCount = 0;
    this.redraftCount = 0;

    // Server Attributes
    this.rooms = {};
    this.matchmakingWaitingRooms = {};
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

module.exports = draftServer;