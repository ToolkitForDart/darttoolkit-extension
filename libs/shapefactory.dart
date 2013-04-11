
/**
 * Automation helpers
 */

const _tween = TimelineTween.get;
const _ease = TransitionFunction.custom;
const _shape = _ShapeFactory.create;
const num _rad2deg = 180/PI;
const num _deg2rad = PI/180;

class _ShapeFactory {
  Shape shape;
  Graphics graphics;
  Function endFill; 
  
  static _ShapeFactory create(num x, num y) {
    var s = new _ShapeFactory();
    s.shape.x = x.toDouble();
    s.shape.y = y.toDouble();
    return s;
  }
  
  _ShapeFactory() {
    shape = new Shape();
    graphics = shape.graphics;
  }
  
  _ShapeFactory beginLinearGradientFill(List<int> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    return lf(colors, stops, x0, y0, x1, y1);
  }
  
  _ShapeFactory beginRadialGradientFill(List<int> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    return rf(colors, stops, x0, y0, r0, x1, y1, r1);
  }
  
  _ShapeFactory beginFill(int color) {
    return f(color);
  }
  
  _ShapeFactory beginStroke() {
    graphics.beginPath();
    return this;
  }
  
  _ShapeFactory closePath() {
    graphics.closePath();
    return this;
  }
  
  _ShapeFactory moveTo(num x, num y) {
    graphics.moveTo(x, y);
    return this;
  }
  
  _ShapeFactory lineTo(num x, num y) {
    graphics.lineTo(x, y);
    return this;
  }
  
  _ShapeFactory curveTo(num cx, num cy, num x, num y) {
    graphics.quadraticCurveTo(cx, cy, x, y);
    return this;
  }
  
  // beginLinearFill
  _ShapeFactory lf(List<int> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    if (endFill != null) endFill();
    var gradient = new GraphicsGradient.linear(x0, y0, x1, y1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], colors[i]);
    }
    endFill = () {
      graphics.fillGradient(gradient);
      return this;
    };
    return this;
  }
  // beginRadialFill
  _ShapeFactory rf(List<int> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    if (endFill != null) endFill();
    var gradient = new GraphicsGradient.radial(x0, y0, r0, x1, y1, r1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], colors[i]);
    }
    endFill = () {
      graphics.fillGradient(gradient);
      return this;
    };
    return this;
  }
  // beginFill
  _ShapeFactory f(int color) {
    if (endFill != null) endFill();
    endFill = () {
      graphics.fillColor(color);
      return this;
    };
    return this;
  }
  // endFill
  _ShapeFactory ef() {
    if (endFill != null) endFill();
    return this;
  }
  
  _ShapeFactory s() {
    graphics.beginPath();
    return this;
  }
  _ShapeFactory cp() {
    graphics.closePath();
    return this;
  }
  _ShapeFactory mt(num x, num y) {
    graphics.moveTo(x, y);
    return this;
  }
  _ShapeFactory lt(num x, num y) {
    graphics.lineTo(x, y);
    return this;
  }
  _ShapeFactory c(num cx, num cy, num x, num y) {
    graphics.quadraticCurveTo(cx, cy, x, y);
    return this;
  }
  
  // decodePath
  _ShapeFactory p(String str) {
    graphics.decode(str);
    return this;
  }
}
