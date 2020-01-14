"use strict";

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _socket = _interopRequireDefault(require("socket.io"));

var _cors = _interopRequireDefault(require("cors"));

var _channelRouter = _interopRequireDefault(require("./routes/channelRouter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var channels = [];
var app = (0, _express["default"])();
app.use(_bodyParser["default"].json());
app.use((0, _cors["default"])()); // 192.168.1.101

var server = app.listen(8000, function () {
  console.log('Server is running on port', server.address().port);
});
var io = (0, _socket["default"])(server);
app.use(function (req, res, next) {
  req.io = io;
  next();
});
app.get('/', function (req, res) {
  res.send('hello world');
});
app.use('/channel', _channelRouter["default"]);
io.on('connection', function (socket) {
  socket.on('connect', function (channelId) {
    io.emit('CONNECTION', 'hello');
    console.log(channelId);
  });
  socket.on('CREATE_CHANNEL', function (data) {
    if (!data.channelId) return null;
    var channel = {
      channel_id: data.channelId,
      users: [data.username]
    };
    socket.join(data.channelId, function () {});
    channels.push(channel);
  });
  socket.on('JOIN_CHANNEL', function (channelId) {
    if (!channelId) return null;
    var channel = channels.find(function (channel) {
      return channel.channel_id === channelId;
    }); // if channel has already 2 connections

    if (channel.users.length > 1) {
      throw new Error('Channel is full');
    }

    socket.join(channelId, function () {
      socket.emit('connect', channelId);
    });
  });
  socket.on('LEAVE_CHANNEL', function (channelId) {
    console.log(channelId);
    io.to(channelId).emit('LEAVE_CHANNEL', true);
  });
  socket.on('SEND_IMAGE', function (data) {
    io.to(data.channel_id).emit('SEND_IMAGE', data.image);
  });
  socket.on('disconnect', function () {
    console.log('user disconnect');
    io.emit('disconnect', true);
  });
});
//# sourceMappingURL=index.js.map