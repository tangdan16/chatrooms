/**
 * Created by ASUS on 2016/10/23.
 */
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {}; //
var namesUsed = []; //已被占用的称昵
var currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level',1);
    io.sockets.on('connection', function (socket) {

        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);  //assignGuestName 用来处理新用户称昵

        joinRoom(socket,'Lobby');

        handleMessageBroadcasting(socket,nickNames);

        handleNameChangeAttempts(socket,nickNames,namesUsed);

        handleRoomJoining(socket);

        socket.on('rooms', function () {
            socket.emit('rooms',io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket,nickNames,namesUsed);

    });
};

function assignGuestName(socket,guestNumber,nickNames,namesUsed){
    var name = 'Guest'+guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success : true,
        name : name
    });
    namesUsed.push(name);
    return guestNumber+1;
};






