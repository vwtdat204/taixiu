// Handles real-time chat and broadcasting results
function initSocket(io){
  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('chatMessage', (data) => {
      // data: { username, message }
      io.emit('chatMessage', { username: data.username, message: data.message, time: Date.now() });
    });

    // server can emit 'roundResult' when a bet is placed; gameController will NOTIFY clients via io.emit
    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
    });
  });
}

module.exports = initSocket;
