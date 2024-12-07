const http = require('http');
const socketIO = require('socket.io');

let io;
function initializeSocket(server) {
    io = socketIO(server);
}

function getSocketInstance() {
    if (!io) {
        throw new Error('Socket.IO még nincs inicializálva!');
    }
    return io;
}

module.exports = { initializeSocket, getSocketInstance };