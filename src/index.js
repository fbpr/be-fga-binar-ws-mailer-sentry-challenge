const express = require('express');
const router = require('./routes');
const Sentry = require('@sentry/node');
const { createUser } = require('./controllers/users.controller');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api', router);

app.use(Sentry.Handlers.errorHandler());

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    socket.disconnect();
  });
});

http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
