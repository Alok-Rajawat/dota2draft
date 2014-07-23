function player (playerUuid, playerNickname, playerSocket) {
    // Nickname of the player
    var nickname = playerNickname;
    // Socket linked to the player
    var socket = playerSocket;
    // Unique identifier
    var uuid = playerUuid;
}

// Getters
player.prototype.getNickname = function() {
    return this.nickname;
};

module.exports = player;