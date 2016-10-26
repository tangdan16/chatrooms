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
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);

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

function assignGuestName(socket,guestNumber,nickNames,namesUsed){   //assignGuestName 用来处理新用户昵称
    var name = 'Guest'+guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success : true,
        name : name
    });
    namesUsed.push(name);
    return guestNumber+1;
};

function joinRoom(socket,room){ //处理用户加入聊天室的逻辑
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult',{room:room});
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id]+' has joined '+ room + '.'
    });

    var usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length>1){
        var userInRoomSummary = 'Users currently in '+ room + ': ';
        for(var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(index>0){
                userInRoomSummary += '';
            }
            userInRoomSummary += nickNames[userSocketId];
        }
    }
    userInRoomSummary += '.';
    socket.emit('message',{text:userInRoomSummary});
}

function handleNameChangeAttempts(socket,nicknames,namesUsed){  // 更名请求的处理逻辑
    socket.on('nameAttempt', function (name) {
        if(name.indexOf('Guest')==0){
            socket.emit('nameResult',{
                success : false,
                message : 'Name cannot begin with "Guest".'
            });
        }else{
            if(name.indexOf('Guest')==-1){
                var previousName = nicknames[socket.id];
                var previousNameIndex = namesUsed.indexOf((previousName));
                namesUsed.push(name);
                nicknames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success : true,
                    name : name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text : previousName + ' is now known as '+ name + '.'
                });
            }else{
                socket.emit('nameResult',{
                    success : false,
                    message : 'That name is already in use.'
                });
            }
        }
    });
}

function handleMessageBroadcasting(socket){ //处理用户发送过来的消息
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id] +":"+message.text
        });
    });
}

function handleRoomJoining(socket){ //实现换房间的功能
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    });
}

function handleClientDisconnection(socket){ //用户断开连接
    socket.on('disconnect', function () {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}










