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
		if (blendMode == "add") { str += "\n"+t+"..compositeOperation = \"lighter\""; }
		else if (blendMode != "normal") { Log.warning("EJS_W_F_BLENDMODES"); }
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