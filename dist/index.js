"use strict";

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _socket = _interopRequireDefault(require("socket.io"));

var _cors = _interopRequireDefault(require("cors"));

var _multer = _interopRequireDefault(require("multer"));

var _morgan = _interopRequireDefault(require("morgan"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _http = _interopRequireDefault(require("http"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var channels = [];
var app = (0, _express["default"])();

var server = _http["default"].createServer(app);

app.use((0, _cors["default"])('*'));
app.use(_bodyParser["default"].json());
app.use((0, _morgan["default"])('dev'));

var storage = _multer["default"].diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, './uploads');
  },
  filename: function filename(req, file, cb) {
    // const uniqueSuffix = Math.round(Math.random() * 1e9)
    // cb(null, file.originalname + '-' + uniqueSuffix)
    cb(null, file.originalname);
  }
});

var upload = (0, _multer["default"])({
  storage: storage,
  limits: {
    files: 5 // fieldSize: 2 * 1024 * 1024, // 2 MB (max file size)

  },
  fileFilter: function fileFilter(req, file, cb) {
    // allow images only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image are allowed.'), false);
    }

    cb(null, true);
  }
});
app.use(function (req, res, next) {
  req.io = io;
  next();
});
app.get('/', function (req, res) {
  res.send('hello from the server');
});
app.post('/upload-image', upload.single('image'), /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
    var image;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            try {
              image = req.file;

              if (!image) {
                res.status(400).send({
                  status: false,
                  data: 'No file is selected.'
                });
              } else {
                res.send({
                  status: true,
                  message: 'File is uploaded.',
                  data: {
                    name: image.originalname,
                    mimetype: image.mimetype,
                    size: image.size
                  }
                });
              }
            } catch (error) {
              res.status(500).send(error);
            }

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());
app.get('/get-image', function (req, res) {
  var imageName = req.query.imageName;
  res.sendFile(_path["default"].join(__dirname, '../uploads/' + imageName));
});
app.post('/delete-images', function (req, res) {
  var images = req.body.images;
  images.forEach(function (image) {
    _fs["default"].stat('./server/upload/my.csv', function (err, stats) {
      if (err) {
        return console.error(err);
      }

      _fs["default"].unlink("./uploads/".concat(image), function (err) {
        if (err) {
          throw err;
        } else {
          return;
          console.log('Successfully deleted files.');
        }
      });
    });
  });
  return true;
});
server.listen(process.env.PORT || 8000, function () {
  console.log('Server is running on port', server.address().port);
});
var io = (0, _socket["default"])(server);
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
    io.to(channelId).emit('LEAVE_CHANNEL', true);
  });
  socket.on('SEND_IMAGE', function (data) {
    io.to(data.channel_id).emit('SEND_IMAGE', data.image);
  });
  socket.on('disconnect', function () {
    io.emit('disconnect', true);
  });
});
//# sourceMappingURL=index.js.map