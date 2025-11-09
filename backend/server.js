const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*' }
});

const initSocket = require('./socket');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static frontend (optional)
app.use('/', express.static(__dirname + '/../frontend'));

// routes
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// When bets are placed, controller does DB and returns result. To broadcast results, we can intercept by listening to a lightweight event.
// For simplicity, when you want to broadcast from controller, import io by attaching to app locals
app.set('io', io);

initSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening ${PORT}`);
});
