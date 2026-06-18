const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socketIo = require('socket.io')(server);

app.use(express.static(__dirname));

let clients = [];

socketIo.on('connection', function(sock) {
    if (clients.length < 2) {
        clients.push(sock.id);
        console.log('Підключився новий гравець:', sock.id);

        if (clients.length === 2) {
            socketIo.emit('matchFound', 'Гра почалась!');
            socketIo.to(clients[0]).emit('turnUpdate', true);
            socketIo.to(clients[1]).emit('turnUpdate', false);
        }
    } else {
        sock.emit('roomFull', 'Сервер зайнятий, гра вже йде');
    }

    sock.on('fire', function(data) {
        sock.broadcast.emit('incomingFire', data);
    });

    sock.on('fireResult', function(data) {
        sock.broadcast.emit('fireResult', data);
    });

    sock.on('disconnect', function() {
        clients = clients.filter(function(id) {
            return id !== sock.id;
        });
        console.log('Гравець відключився');
    });
});

server.listen(8080, function() {
    console.log('Сервер працює за адресою: http://localhost:8080');
});
