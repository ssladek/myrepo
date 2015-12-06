(function() {
  var myIo, socket;

  socket = null;

  myIo = null;

  exports.getIo = function() {
    return myIo;
  };

  exports.initSocketListener = function(io) {
    myIo = io;
    io.on('connection', function(newSocket) {
      console.log('user connected');
      socket = newSocket;
      socket.on('disconnect', function() {
        return console.log('user disconnected');
      });
    });
  };

  exports.sendMessage = function(io, message) {
    return io.emit('message', message);
  };

  exports.sendLog = function(io, message) {
    return io.emit('log', message);
  };

}).call(this);
