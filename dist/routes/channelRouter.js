"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _v = _interopRequireDefault(require("uuid/v4"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();

router.get('/', function (req, res) {
  res.send('GET channelRouter');
});
router.get('/create', function (req, res) {
  var channelName = (0, _v["default"])(); // generates random id for channel name
  // req.io.emit('createChannel', channelName)

  res.send(channelName);
});
var _default = router;
exports["default"] = _default;
//# sourceMappingURL=channelRouter.js.map