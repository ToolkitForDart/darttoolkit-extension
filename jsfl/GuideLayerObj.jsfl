/*******************************************************************/
/*                                                                 */
/*                      ADOBE CONFIDENTIAL                         */
/*                   _ _ _ _ _ _ _ _ _ _ _ _                       */
/*                                                                 */
/* Copyright 2012 Adobe Systems Incorporated                       */
/* All Rights Reserved.                                            */
/*                                                                 */
/* NOTICE:  All information contained herein is, and remains the   */
/* property of Adobe Systems Incorporated and its suppliers, if    */
/* any.  The intellectual and technical concepts contained         */
/* herein are proprietary to Adobe Systems Incorporated and its    */
/* suppliers and are protected by trade secret or                  */
/* copyright law.  Dissemination of this information or            */
/* reproduction of this material is strictly forbidden unless      */
/* prior written permission is obtained from Adobe Systems         */
/* Incorporated.                                                   */
/*                                                                 */
/*******************************************************************/

GuideLayerObj = function(xml, nameSpace, duration) {
	this.xml = xml;
	this.nameSpace = nameSpace;
	this.duration = duration;
	this.name = xml.@name.toString();
	
	if(xml.hasOwnProperty("DOMFrame")){
		this.guides = [];
		var DOMShape = xml.DOMFrame.elements.DOMShape;
		for(var i=0, l=DOMShape.length(); i<l; i++){
			var o = new GuideLayerObj(DOMShape[i], nameSpace, duration);
			this.guides[o.name] = o;
		}
	} else {
		this.pathXML = xml.Path.@data.toString();
		this.x = Number(xml.Transform.@x);
		this.y = Number(xml.Transform.@y);
		this.pathPoints = [];
	}
};
var p = GuideLayerObj.prototype;

GuideLayerObj.base64 = {"A":0,"B":1,"C":2,"D":3,"E":4,"F":5,"G":6,"H":7,"I":8,
	"J":9,"K":10,"L":11,"M":12,"N":13,"O":14,"P":15,"Q":16,"R":17,"S":18,"T":19,
	"U":20,"V":21,"W":22,"X":23,"Y":24,"Z":25,"a":26,"b":27,"c":28,"d":29,"e":30,
	"f":31,"g":32,"h":33,"i":34,"j":35,"k":36,"l":37,"m":38,"n":39,"o":40,"p":41,
	"q":42,"r":43,"s":44,"t":45,"u":46,"v":47,"w":48,"x":49,"y":50,"z":51,"0":52,
	"1":53,"2":54,"3":55,"4":56,"5":57,"6":58,"7":59,"8":60,"9":61,"+":62,"/":63};

GuideLayerObj.setPos = function(self, data){
	var path = self.pathPoints;
	if(path.length){ Log.error("EJS_E_JSXEXPORT", "JSX_BAD_PATH"); }
	path.push(data[0]);
	path.push(data[1]);
};

GuideLayerObj.addLine = function(self, data){
	var path = self.pathPoints;
	if(path.length < 2){ Log.error("EJS_E_JSXEXPORT", "JSX_BAD_PATH"); }
	var l = path.length;
	path.push((data[0]-path[l-2])*0.5+path[l-2]);
	path.push((data[1]-path[l-1])*0.5+path[l-1]);
	path.push(data[0]);
	path.push(data[1]);
};

GuideLayerObj.addQuadCurve = function(self, data){
	var path = self.pathPoints;
	var l = path.length;
	if(l < 2){ Log.error("EJS_E_JSXEXPORT", "JSX_BAD_PATH"); }
	var sx = path[l-2],	sy = path[l-1];
	var cx = data[0],	cy = data[1];
	var ex = data[2],	ey = data[3];
	var dxSC = cx-sx,	dySC = cy-sy;
	var dxCE = ex-cx,	dyCE = ey-cy;
	var lenSC = Math.sqrt(dxSC*dxSC+dySC*dySC);
	var lenCE = Math.sqrt(dxCE*dxCE+dyCE*dyCE);
	var angle = Math.acos( (dxSC*dxCE+dySC*dyCE) / (lenSC*lenCE) )/Math.PI;
	if(Math.abs(angle) > 0.4 && Math.abs(lenSC>lenCE?lenSC/lenCE:lenCE/lenSC) > 2){
		var t = 0.5;
		var inv = 1-t;
		// new control
		path.push(sx+dxSC*t);
		path.push(sy+dySC*t);
		// new point
		path.push(inv*inv * sx + 2 * inv * t * cx + t*t * ex);
		path.push(inv*inv * sy + 2 * inv * t * cy + t*t * ey);
		// new control
		path.push(cx+dxCE*t);
		path.push(cy+dyCE*t);
	} else {			
		path.push(cx);
		path.push(cy);
	}
	path.push(ex);
	path.push(ey);
};

GuideLayerObj.addCubicCurve = function(self, data){
	var path = self.pathPoints;
	Log.error("EJS_E_JSXEXPORT", "JSX_CUBIC_GUIDE");
};

GuideLayerObj.closePath = function(self, data){};

p.xml;
p.name;

p.empty = true;
p.nameSpace;
p.duration;
p.guides;

p.x;
p.y;
p.pathXML;
p.pathPoints;
p.orient;

p.toString = function(t) {
	return "";
}

p.getPath = function(t) {
	return "["+this.pathPoints.toString()+"]";
}

p.read = function(scope, code, labels, names) {
	if(this.guides){
		Log.time("scan guide layer");
		for each(o in this.guides){
			o.read(scope, code, labels, names);
		}
		this.empty = false;
		Log.time();
		return;
	}
	
	// Shanghaied from EaselJS.Graphics.decodePath
	var instructions = [GuideLayerObj.setPos, GuideLayerObj.addLine, GuideLayerObj.addQuadCurve,
						GuideLayerObj.addCubicCurve, GuideLayerObj.closePath];
	var paramCount = [2, 2, 4, 6, 0];
	var str = this.pathXML;
	var i=0, l=str.length;
	var params = [];
	var x=0, y=0;
	var base64 = GuideLayerObj.base64;
	while (i<l) {
		var c = str.charAt(i);
		var n = base64[c];
		var fi = n>>3; // highest order bits 1-3 code for operation.
		var f = instructions[fi];
		// check that we have a valid instruction & that the unused bits are empty:
		if (!f || (n&3)) { throw("bad path data (@"+i+"): "+c); }
		var pl = paramCount[fi];
		if (!fi) { x=y=0; } // move operations reset the position.
		params.length = 0;
		i++;
		var charCount = (n>>2&1)+2;  // 4th header bit indicates number size for this operation.
		for (var p=0; p<pl; p++) {
			var num = base64[str.charAt(i)];
			var sign = (num>>5) ? -1 : 1;
			num = ((num&31)<<6)|(base64[str.charAt(i+1)]);
			if (charCount == 3) { num = (num<<6)|(base64[str.charAt(i+2)]); }
			num = sign*num/10;
			if (p%2) { x = (num += x); }
			else { y = (num += y); }
			params[p] = num;
			i += charCount;
		}
		f(this, params);
	}
	// end borrowed code
	for(i=0, l=this.pathPoints.length; i<l; i++){
		this.pathPoints[i] = fix(this.pathPoints[i]+(i%2?this.y:this.x));
	}
}




