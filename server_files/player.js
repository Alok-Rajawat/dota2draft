function player (playerUuid, playerNickname, playerType) {
    // Unique identifier
    var uuid = playerUuid;
    // Nickname of the player
    var nickname = playerNickname;
    // Socket linked to the player
    var socket = null;
    // Type of player (spectator or player)
    var type = (playerType === "player") ? "player" : "spectator";

    // Room Id where the player is
    var roomId = null;
}

// Getters
player.prototype.getNickname = function() {
    return this.nickname;
};
player.prototype.getSocket = function() {
    return this.socket;
};
player.prototype.getRoomId = function() {
    return this.roomId;
};
player.prototype.getUuid = function() {
    return this.uuid;
};

// Methods
player.prototype.isPlayer = function() {
    return this.type === "player";
};
player.prototype.isSpectator = function() {
    return this.type === "spectator";
};
player.prototype.setRoomId = function(id) {
    this.roomId = id;
};
player.prototype.equals = function(player) {
    return (this.uuid === player.getUuid());
}

module.exports = player;