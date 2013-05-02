
/* SHORTCUTS */

const _tween = TimelineTween.get;
const _ease = TransitionFunction.custom;
const _draw = _ShapeFactory.create;

class _ShapeFactory {
  Shape _shape;
  Graphics _graphics;
  Function _endFill;
  Function _endStroke;
  num _strokeWidth = 1;
  String _strokeJoints = "miter";
  String _strokeCaps = "butt";
  
  static _ShapeFactory create(num x, num y) {
    return new _ShapeFactory(x, y);
  }
  
  Shape get shape {
    ef(); es();
    return _shape;
  }
  Graphics get graphics {
    ef(); es();
    return _graphics;
  }
  
  _ShapeFactory(num x, num y) {
    _shape = new Shape();
    _graphics = _shape.graphics;
    _shape.x = x.toDouble();
    _shape.y = y.toDouble();
  }
  
  _ShapeFactory beginLinearGradientFill(List<int> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    return lf(colors, stops, x0, y0, x1, y1);
  }
  _ShapeFactory beginRadialGradientFill(List<int> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    return rf(colors, stops, x0, y0, r0, x1, y1, r1);
  }
  _ShapeFactory beginBitmapFill(Bitmap image, [String repeat, Matrix mat]) {
    return bf(image, repeat, mat);
  }
  _ShapeFactory beginFill([int color]) {
    return f(color);
  }
  _ShapeFactory endFill() {
    return ef();
  }
  _ShapeFactory beginStroke([int color]) {
    return s(color);
  }
  _ShapeFactory beginLinearGradientStroke(List<int> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    return ls(colors, stops, x0, y0, x1, y1);
  }
  _ShapeFactory beginRadialGradientStroke(List<int> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    return rs(colors, stops, x0, y0, r0, x1, y1, r1);
  }
  _ShapeFactory setStrokeStyle(num thickness, [caps, joints, num miterLimit=10, bool ignoreScale=false]) {
    return ss(thickness, caps, joints, miterLimit, ignoreScale);
  }
  _ShapeFactory closePath() {
    return cp();
  }
  
  _ShapeFactory moveTo(num x, num y) {
    _graphics.moveTo(x, y);
    return this;
  }
  _ShapeFactory lineTo(num x, num y) {
    _graphics.lineTo(x, y);
    return this;
  }
  _ShapeFactory curveTo(num cx, num cy, num x, num y) {
    _graphics.quadraticCurveTo(cx, cy, x, y);
    return this;
  }
  _ShapeFactory drawCircle(num x, num y, num radius) {
    return dc(x, y, radius);
  }
  _ShapeFactory drawEllipse(num x, num y, num width, num height) {
    return de(x, y, width, height);
  }
  _ShapeFactory drawRect(num x, num y, num width, num height) {
    return dr(x, y, width, height);
  }
  _ShapeFactory drawRectRounded(num x, num y, num width, num height, num radius) {
    return rr(x, y, width, height, radius);
  }
  _ShapeFactory drawPolyStar (num x, num y, num radius, num sides, num pointSize, num angle) {
    return dp(x, y, radius, sides, pointSize, angle);
  }
  
  // fills
  _ShapeFactory lf(List<int> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    ef();
    var gradient = new GraphicsGradient.linear(x0, y0, x1, y1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], colors[i]);
    }
    _endFill = () {
      _graphics.fillGradient(gradient);
    };
    return this;
  }
  _ShapeFactory rf(List<int> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    ef();
    var gradient = new GraphicsGradient.radial(x0, y0, r0, x1, y1, r1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], colors[i]);
    }
    _endFill = () {
      _graphics.fillGradient(gradient);
    };
    return this;
  }
  _ShapeFactory bf(Bitmap image, String repeat, Matrix mat) {
    var bmp = image.bitmapData;
    GraphicsPattern pattern = null;
    switch (repeat) {
      case "repeat-x": pattern = new GraphicsPattern.repeatX(bmp, mat); break;
      case "repeat-y": pattern = new GraphicsPattern.repeatY(bmp, mat); break;
      case "no-repeat": pattern = new GraphicsPattern.noRepeat(bmp, mat); break;
      default: pattern = new GraphicsPattern.repeat(bmp, mat); break;
    }
    _endFill = () {
      _graphics.fillPattern(pattern);
    };
    return this;
  }
  _ShapeFactory f([int color]) {
    if (color == null) color = 0;
    ef();
    _endFill = () {
      _graphics.fillColor(color);
    };
    return this;
  }
  _ShapeFactory ef() {
    if (_endFill != null) {
      _endFill();
      _endFill = null;
    }
    return this;
  }
  
  // stroke
  _ShapeFactory s([int color]) {
    es();
    if (color == null) color = 0;
    _endStroke = () {
      _graphics.strokeColor(color, _strokeWidth, _strokeJoints, _strokeCaps);
    };
    _graphics.beginPath();
    return this;
  }
  _ShapeFactory ls(List<int> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    es();
    var gradient = new GraphicsGradient.linear(x0, y0, x1, y1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], colors[i]);
    }
    _endStroke = () {
      _graphics.strokeGradient(gradient, _strokeWidth, _strokeJoints, _strokeCaps);
    };
    return this;
  }
  _ShapeFactory rs(List<int> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    es();
    var gradient = new GraphicsGradient.radial(x0, y0, r0, x1, y1, r1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], colors[i]);
    }
    _endStroke = () {
      _graphics.strokeGradient(gradient, _strokeWidth, _strokeJoints, _strokeCaps);
    };
    return this;
  }
  _ShapeFactory es() {
    if (_endStroke != null) {
      _endStroke();
      _endStroke = null;
    }
    return this;
  }
  _ShapeFactory ss(num thickness, [caps, joints, num miterLimit=10, bool ignoreScale=false]) {
    _strokeWidth = thickness;
    if (caps != null) {
      switch(caps) {
        case 0: _strokeCaps = "butt"; break;
        case 1: _strokeCaps = "round"; break;
        case 2: _strokeCaps = "square"; break;
        default: _strokeCaps = caps.toString(); break;
      }
    }
    else _strokeCaps = "butt";
    if (joints != null) {
      switch(joints) {
        case 0: _strokeJoints = "miter"; break;
        case 1: _strokeJoints = "round"; break;
        case 2: _strokeJoints = "bevel"; break;
        default: _strokeJoints = joints.toString(); break;
      }
    }
    else _strokeJoints = "miter";
    return this;
  }
  
  _ShapeFactory cp() {
    _graphics.closePath();
    return this;
  }
  _ShapeFactory mt(num x, num y) {
    _graphics.moveTo(x, y);
    return this;
  }
  _ShapeFactory lt(num x, num y) {
    _graphics.lineTo(x, y);
    return this;
  }
  _ShapeFactory c(num cx, num cy, num x, num y) {
    _graphics.quadraticCurveTo(cx, cy, x, y);
    return this;
  }
  _ShapeFactory dc(num x, num y, num radius) {
    _graphics.circle(x, y, radius);
    return this;
  }
  _ShapeFactory de(num x, num y, num width, num height) {
    _graphics.ellipse(x, y, width, height);
    return this;
  }
  _ShapeFactory dr(num x, num y, num width, num height) {
    _graphics.rect(x, y, width, height);
    return this;
  }
  _ShapeFactory rr(num x, num y, num width, num height, num radius) {
    _graphics.rectRound(x, y, width, height, radius, radius);
    return this;
  }
  _ShapeFactory dp(num x, num y, num radius, num sides, num pointSize, num angle) {
    // TODO PolyStar
    return this;
  }
  
  // decodePath
  _ShapeFactory p(String str) {
    _graphics.decode(str);
    return this;
  }
}
