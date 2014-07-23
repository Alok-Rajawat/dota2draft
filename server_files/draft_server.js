function draftServer () {
    // Server information
    this.sessionDate = new Date();
    this.startCount = 0;
    this.endCount = 0;
    this.redraftCount = 0;
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

module.exports = draftServer;