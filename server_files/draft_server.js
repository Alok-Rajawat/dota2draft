function draftServer () {
    // Server information
    this.sessionDate = new Date();
}

// Getters
draftServer.prototype.getSessionDate = function() {
    return this.sessionDate;
};

module.exports = draftServer;