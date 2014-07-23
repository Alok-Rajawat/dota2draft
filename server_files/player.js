function player (playerNickname, playerSocket) {
    // Nickname of the player
    var nickname = playerNickname;
    // Socket linked to the player
    var socket = playerSocket;
}

// Getters
player.prototype.getNickname = function() {
    return this.nickname;
};

module.exports = player;