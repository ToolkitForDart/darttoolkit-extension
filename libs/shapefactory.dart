
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
  
  _ShapeFactory beginLinearGradientFill(List<String> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    return lf(colors, stops, x0, y0, x1, y1);
  }
  
  _ShapeFactory beginRadialGradientFill(List<String> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    return rf(colors, stops, x0, y0, r0, x1, y1, r1);
  }
  
  _ShapeFactory beginFill(String color) {
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
  _ShapeFactory lf(List<String> colors, List<num> stops, num x0, num y0, num x1, num y1) {
    if (endFill != null) endFill();
    var gradient = new GraphicsGradient.linear(x0, y0, x1, y1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], parseColor(colors[i]));
    }
    endFill = () {
      graphics.fillGradient(gradient);
      return this;
    };
    return this;
  }
  // beginRadialFill
  _ShapeFactory rf(List<String> colors, List<num> stops, num x0, num y0, num r0, num x1, num y1, num r1) {
    if (endFill != null) endFill();
    var gradient = new GraphicsGradient.radial(x0, y0, r0, x1, y1, r1);
    int n = colors.length;
    for(int i = 0; i<n; i++) {
      gradient.addColorStop(stops[i], parseColor(colors[i]));
    }
    endFill = () {
      graphics.fillGradient(gradient);
      return this;
    };
    return this;
  }
  // beginFill
  _ShapeFactory f(String color) {
    if (endFill != null) endFill();
    int col = parseColor(color);
    endFill = () {
      graphics.fillColor(col);
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
  
  // decode html-encoded colors (TEMPORARY: toolkit output should generate int)
  int parseColor(String color) {
    if (color == null || color == "") return 0;
    if (color[0] == "#") {
      if (color.length < 8) return int.parse("0xff${color.substring(1)}");
      else return int.parse("0x${color.substring(1)}");
    }
    if (color.startsWith("rgba(")) {
      var parts = color.substring(5, color.length-1).split(",");
      return ((double.parse(parts[3])*256).toInt() << 24) 
          | (int.parse(parts[0]) << 16) 
          | (int.parse(parts[1]) << 8) 
          | int.parse(parts[2]); 
    }
    if (color.startsWith("rgb(")) {
      var parts = color.substring(4, color.length-1).split(",");
      return 0xff000000 
          | (int.parse(parts[0]) << 16) 
          | (int.parse(parts[1]) << 8) 
          | int.parse(parts[2]); 
    }
    return 0;
  }
}
