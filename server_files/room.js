function room (roomId) {
    // Room unique id
    var id = roomId;
}

// Getters
room.prototype.getId = function() {
    return this.id;
};

module.exports = room;