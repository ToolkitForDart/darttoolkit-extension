/**
* Copyright (c) 2013, Adobe Systems Inc.
* All rights reserved.
* 
* Redistribution and use in source and binary forms, with or without modification, are permitted provided 
* that the following conditions are met:
* - Redistributions of source code must retain the above copyright notice, this list of conditions and the 
*   following disclaimer.
* - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and 
*   the following disclaimer in the documentation and/or other materials provided with the distribution.
* - Neither the name of Adobe Systems Inc. nor the names of its contributors may be used to endorse or 
*   promote products derived from this software without specific prior written permission.
* 
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED 
* WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
* PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR 
* ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
* LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
* INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR 
* TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF 
* ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

include("Matrix2D");

ShapeInst = function(xml, name){
	this.xml = xml;
	this.name = name;
	this.compact = Exporter.instance.compactPaths;
	this.cmd = (this.compact) ? ShapeInst.CMDS_SHORT : ShapeInst.CMDS_LONG;
}
var p = ShapeInst.prototype;

ShapeInst.GRADIENT_CONSTANT = 16384;
ShapeInst.STROKE_CAPS_MAP = {none:0, round:1, square:2};
ShapeInst.STROKE_JOINTS_MAP = {miter:0, round:1, bevel:2};
ShapeInst.CMDS_SHORT = {mt:"mt",lt:"lt",qt:"qt",dr:"dr",rr:"rr",rc:"rc",de:"de",f:"f",s:"s",ss:"ss",cp:"cp",p:"p",ls:"ls",rs:"rs",bs:"bs",lf:"lf",rf:"rf",bf:"bf"}
ShapeInst.CMDS_LONG = {mt:"moveTo",lt:"lineTo",qt:"curveTo",dr:"drawRect",rr:"drawRoundRect",rc:"drawRoundRectComplex",de:"drawEllipse",f:"beginFill",s:"beginStroke",ss:"setStrokeStyle",cp:"closePath",p:"decodePath",ls:"beginLinearGradientStroke",rs:"beginRadialGradientStroke",bs:"beginBitmapStroke",lf:"beginLinearGradientFill",rf:"beginRadialGradientFill",bf:"beginBitmapFill"}

p.xml;
p.name;
p.cmds;
p.cmd;
p.compact;
p.empty = true;

p.toString = function(t,scope) {
	var e = this.xml;
	var name = (scope?scope+".":"")+this.name;
	
	var cmds = this.getCmds();
	
	var o = getElementTransform(e);
	var str = 
		 name+' = _draw('+o.x+','+o.y+')'
		+'\n'+t+cmds+'.shape';
	if (o.scaleX != 1 || o.scaleY != 1 || o.rotation || o.skewX || o.skewY || o.regX || o.regY)
		str += exportTransform(e, name, '\n'+t);
	
	return str + ";";
}

p.getCmds = function() {
	if (this.cmds == null) { this.cmds = this.read(); }
	return this.cmds;
}

p.isEmpty = function() {
	this.getCmds();
	return this.empty;
}

p.read = function(mask) {
	var e = this.xml;
	var path = e.Path;
	var fill = e.Fill;
	var stroke = e.Stroke;
	var str;

	if (e.name() == "DOMRectangleObject") {
		str = this.getRect(e);
	} else if (e.name() == "DOMOvalObject") {
		str = this.getOval(e);
	} else {
		var data = path.@data[0];
		if (!data) { return ""; }
		str = this.compact ? ".p(\""+data+"\")" : "."+data;
		fill = e.Path.Fill;
		stroke = e.Path.Stroke;
		if (this.compact && (e.Path.@closePath[0] == "true")) { str += "."+this.cmd["cp"]+"()" }
	}
	if (!mask) { str = this.getFill(fill.Paint)+this.getStroke(stroke)+str; } // masks don't need fills or strokes.
	this.empty = false;
	return str;
}

p.getRect = function(e) {
	var bl = fix(e.@bottomLeftRadius*1);
	var br = fix(e.@bottomRightRadius*1);
	var tl = fix(e.@topLeftRadius*1);
	var tr = fix(e.@topRightRadius*1);
	var w = fix(e.@objectWidth*1);
	var h = fix(e.@objectHeight*1);
	var range = (w<h ? w : h)/2;
	if (bl == br && br == tl && tl == tr) {
		if (bl == 0) { return "."+this.cmd["dr"]+"("+(w/-2)+","+(h/-2)+","+w+","+h+")"; }
		else { return "."+this.cmd["rr"]+"("+(w/-2)+","+(h/-2)+","+w+","+h+","+limit(fix(bl),range)+")"; }
	} else {
		return "."+this.cmd["rc"]+"("+(w/-2)+","+(h/-2)+","+w+","+h+","+limit(fix(tl),range)+","+limit(fix(tr),range)+","+limit(fix(br),range)+","+limit(fix(bl),range)+")";
	}
}

p.getOval = function(e) {
	if (e.@startAngle*1 || e.@innerRadius*1 || e.@endAngle*1) { Log.warning("ERROR: complex ovals are not supported."); }
	var w = fix(e.@objectWidth*1);
	var h = fix(e.@objectHeight*1);
	return "."+this.cmd["de"]+"("+fix(w/-2)+","+fix(h/-2)+","+fix(w)+","+fix(h)+")";;
}

p.getFill = function(paint,isStroke) {
	var c = isStroke ? "s" : "f";
	var type = paint.@type[0];

	if (type == "SolidColor") {
		return "."+this.cmd[c]+"("+getCSSColor(paint.@color[0], paint.@alpha[0])+")";
	} else if (type == "LinearGradient") {
		return "."+this.cmd["l"+c]+"("+this.getLinearGradientParams(paint)+")";
	} else if (type == "RadialGradient") {
		return "."+this.cmd["r"+c]+"("+this.getRadialGradientParams(paint)+")";
	} else if (type == "BitmapFill") {
		Log.warning("EJS_W_BMPFILL");
		var symbolName = Exporter.instance.getSymbol(paint.@bitmapPath[0]).name;
		var str = "."+this.cmd["b"+c]+"(new "+symbolName+"()";
		var mtx = paint.Matrix[0];
		if (!isStroke && mtx) {
			var a = mtx.@a*1;
			var b = mtx.@b*1;
			var c = mtx.@c*1;
			var d = mtx.@d*1;
			var tx = mtx.@tx*1;
			var ty = mtx.@ty*1;
			if (a == 1 && b == 0 && c == 0 && d == 1)
				mtx = [1/20,0,0,1/20,fix(tx),fix(ty)];
			else
				mtx = [fix(a/20,3),fix(b/20,3),fix(c/20,3),fix(d/20,3),fix(tx),fix(ty)];
			//mtx = [fix(mtx.@a/20*1),fix(mtx.@b*1),fix(mtx.@c*1),fix(mtx.@d/20*1),fix(mtx.@tx*1),fix(mtx.@ty*1)];
			str += ", null, new Matrix("+mtx.join(",")+")";
		}
		return str+")";
	}
	return "."+this.cmd[c]+"()";
}

p.getStroke = function(stroke) {
	// TODO: maybe use full names instead of numbers in verbose mode.
	if (!stroke.Paint[0]) { return "."+this.cmd["s"]+"()"; }
	var hairline = (stroke.@solidStyle == "hairline");
	if (stroke.@type != "SolidStroke") { Log.warning("EJS_W_F_STROKESTYLE"); }
	// if (stroke.@scaleMode[0] && stroke.@scaleMode != "normal") { Log.warning("EJS_W_F_STROKESCALE"); }
	var str = this.getFill(stroke.Paint,true);
	var w = hairline ? 1 : fix(stroke.@weight*1||1);
	var caps = ShapeInst.STROKE_CAPS_MAP[stroke.@caps[0]||"round"];
	var joints = ShapeInst.STROKE_JOINTS_MAP[stroke.@joints[0]||"round"];
	var miter = fix(stroke.@miterLimit*1||3);
	var scaleMode = stroke.@scaleMode[0]||"none";
	if (scaleMode == "horizontal" || scaleMode == "vertical") { Log.warning("EJS_W_F_STROKESCALE"); }
	var ignoreScale = hairline || (scaleMode == "none");
	var params = [w, caps, joints, miter, ignoreScale];
	if (!ignoreScale) {
		params.pop();
		if (miter == 10 || joints != 0) {
			params.pop();
			if (joints == 0) {
				params.pop();
				if (caps == 0) {
					params.pop();
					if (w == 1) {
						params.pop();
					}
				}
			}
		}
	}
	return str + ((params.length) ? "."+this.cmd["ss"]+"("+params.join(",")+")" : "");
}

p.getLinearGradientParams = function(paint) {
	var str = this.getGradientParams(paint);
	var mtx = getMatrix(paint.Matrix);
	var pt1 = fl.Math.transformPoint(mtx,{x:-ShapeInst.GRADIENT_CONSTANT/20, y:0});
	var pt2 = fl.Math.transformPoint(mtx,{x:ShapeInst.GRADIENT_CONSTANT/20, y:0});
	str += fix(pt1.x,1)+","+fix(pt1.y,1)+","+fix(pt2.x,1)+","+fix(pt2.y,1);
	return str;
}

p.getRadialGradientParams = function(paint) {
	var str = this.getGradientParams(paint);
	var mtx = getMatrix(paint.Matrix);
	if (mtx.a != mtx.d) { Log.warning("EJS_W_RADGRAD"); }
	var pt1 = fl.Math.transformPoint(mtx,{x:0, y:0});
	var pt2 = fl.Math.transformPoint(mtx,{x:ShapeInst.GRADIENT_CONSTANT/20,y:0});
	//x0, y0, r0, x1, y1, r1
	var fr = paint.@focalPointRatio*1;
	var xd = pt1.x-pt2.x;
	var yd = pt1.y-pt2.y;
	var r = Math.sqrt(xd*xd+yd*yd);
	var a = Math.atan2(yd,xd);
	var fx = r*fr*Math.cos(a);
	var fy = r*fr*Math.sin(a);
	str += fix(pt1.x-fx,1)+","+fix(pt1.y-fy,1)+","+0+","+fix(pt1.x,1)+","+fix(pt1.y,1)+","+fix(r,1);
	return str;
}

p.getGradientParams = function(paint) {
	var entries = paint.GradientEntry;
	var col = [];
	var pos = [];
	for (var i=0,l=entries.length(); i<l; i++) {
		var entry = entries[i];
		col.push(getCSSColor(entry.@color[0], entry.@alpha[0]));
		pos.push(fix(entry.@ratio*1,3));
	}
	return "["+col.join(",")+"],["+pos.join(",")+"],";
}

p.getProps = function(e) {
	if (!e) { e = this.xml; }
	var o = getElementTransform(e); //,null,true
	return o;
}
