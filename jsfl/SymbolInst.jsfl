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

SymbolInst = function(xml, name, symbol){
	this.xml = xml;
	this.name = name;
	this.symbol = symbol;
}
var p = SymbolInst.prototype;

p.xml;
p.name;
p.symbol;
p._off;

p.toString = function(t,scope) {
	var e = this.xml;
	
	if (e.@matrix3D[0]) {
		Log.warning("EJS_W_F_3D");
	}
	
	var params = [];
	if (e.@symbolType == "graphic" && this.symbol.movieclip) {
		params[0] = '"'+(e.@loop=="single frame" ? LayerObj.SINGLE_FRAME : LayerObj.SYNCHED)+'"';
		params[1] = e.@firstFrame*1;
		if (e.@loop=="play once") { params[2] = "false"; }
	}
	
	var name = (scope?scope+".":"")+this.name;
	var str = name+" = new "+this.symbol.name+"("+params.join(",")+")";
	str += exportTransform(e, name, "\n"+t);
	str += exportFilters(e.filters.*, name, "\n"+t);
	
	var blendMode = e.@blendMode[0];
	if (blendMode) { 
		/*if (blendMode == "add") { str += "\n"+t+name+".compositeOperation = \"lighter\";"; }
		else if (blendMode != "normal") { Log.warning("EJS_W_F_BLENDMODES"); }*/
		Log.warning("WARNING: BlendModes in Dart StageXL are not implemented"); // TODO
	}
	
	if (this._off) {
		str += "\n"+t+"..off = true";
	}
	if (e.@isVisible == "false") {
		str += "\n"+t+"..visible = false";
	}
	
	if (e.@cacheAsBitmap[0] == "true") {
		if (this.symbol.movieclip) {
			Log.warning("EJS_W_ANIMCACHE");
		}
		var r = this.symbol.rect;
		if (r) {
			str += "\n"+t+"..applyCache("+[fix(r.x-CACHE_PAD,0),fix(r.y-CACHE_PAD,0),fix(r.width+2*CACHE_PAD,0),fix(r.height+2*CACHE_PAD,0)].join(",")+")";
		}
	} else if (e.@exportAsBitmap[0] == "true") {
		Log.warning("EJS_W_F_EXPORTASBMP");
	}
	str += ';';

	if (e.@symbolType == "button") {
		if (this.symbol.duration < 2) {
			str += "\n"+t+name+".useHandCursor = true;"
		}
		else {
			str += "\n"+t+"new ButtonHelper("+name+", 0, 1, "+(this.symbol.duration > 2 ? "2" : "1");
			if (this.symbol.duration >= 4) {
				// has a hit frame.
				str += ", new "+this.symbol.name+"(\"synched\", 3)";
			}
			str += ");";
		}
	}

	return str;
}

p.isEmpty = function() {
	return this.symbol.isEmpty();
}


p.getProps = function(e) {
	if (!e) { e = this.xml; }
	var o = getElementTransform(e);
	if (e.name() == "DOMSymbolInstance") {
		if (e.@symbolType == "graphic") {
			o.mode = (e.@loop=="single frame" ? LayerObj.SINGLE_FRAME : LayerObj.SYNCHED);
			o.startPosition = e.@firstFrame*1;
			if (e.@loop == "play once") { o.loop = false; }
		} else {
			o.mode = LayerObj.INDEPENDENT;
		}
	}
	o.visible = (e.@isVisible != "false");
	if (e.@blendMode == "add") { o.compositeOperation = "lighter"; }
	return o;
}