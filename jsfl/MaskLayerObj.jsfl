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

MaskLayerObj = function(xml, nameSpace, duration) {
	this.xml = xml;
	this.nameSpace = nameSpace;
	this.duration = duration;
	this.name = xml.@name;
	this.definitions = [];
	this.childLayers = [];
	this.graphicEntries = [];
};
var p = MaskLayerObj.prototype;

p.xml;
p.name;

p.empty = true;
p.error;
p.definitions;
p.tweens;
p.nameSpace;
p.duration;
p.childLayers;
p.maskName;
p.graphicEntries;

p.toString = function(t, mc) {
	var str = t+"// "+this.name+" (mask)";

	if (this.error) { return str+"\n"+t+"/* "+Locale.get(this.error)+" */\n\n"; }
	if (this.empty) { return ""; }
	
	// define the shape:
	var e0 = this.xml.DOMFrame.elements.DOMShape[0];
	var shapeName = this.maskName+"_shape";
	var defMask = "\n"+t+"var "+this.maskName+" = new Mask.shape("+shapeName+")..targetSpace = this;";
	//var o = getElementTransform(e0);
	// graphics:
	var gs = this.graphicEntries;
	if (gs.length == 1) {
		// single frame.
		var o = gs[0];
		str += "\n"+t+"var "+shapeName+" = _draw("+o.x+","+o.y+")"+o.data+".shape;";
		/*if (o.scaleX != 1 || o.scaleY != 1 || o.rotation || o.skewX || o.skewY || o.regX || o.regY)
			str += exportTransform(e0, name, '\n'+t);*/
		str += defMask;
	} else {
		// multi-frame.
		str += "\n"+t+"var "+shapeName+" = new Shape();";
		var tween = "\n"+t+"timeline.addTween(_tween("+shapeName+")";
		var defs = [];
		var graphicObjs = {};
		var prev = 0;
		var prevO = {};
		for (var i=0,l=gs.length; i<l; i++) {
			var o = gs[i];
			var name = "null";
			var data = o.data;
			if (data && !graphicObjs[data]) {
				name = getVarName(this.maskName+"_graphics_"+o.index, this.nameSpace);
				defs.push( t+"var "+name+" = _draw(0,0)"+data+".graphics;" );
				// graphicObjs[data] = name; // This isn't very effective due to rounding differences, we'll skip it for now.
			} else if (data) {
				// reuse existing graphics:
				name = graphicObjs[data];
			}
			// TODO: deal with multiple empty frames more intelligently?
			o.name = name;
			if (o.index != prev) { tween += ".wait("+(o.index-prev)+")"; }
			var props = [];
			if (o.name != prev.name) { props.push('"graphics":'+name); }
			if (o.x != prev.x) { props.push('"x":'+o.x); }
			if (o.y != prev.y) { props.push('"y":'+o.y); }
			if (props.length) { tween += ".to({"+props.join(",")+"})"; }
			prev = o.index;
			prevO = o;
		}
		if (prev < this.duration) { tween += ".wait("+(this.duration-prev)+")"; }
		str += "\n"+defs.join("\n")+defMask+"\n"+tween+");";
	}
	return str+"\n\n";
}

p.read = function(scope, code, labels, names) {
	this.maskName = getVarName("mask", this.nameSpace, "mask");
	LayerObj.readCodeAndLabels(this.xml, code, labels);

	var frames = this.xml.DOMFrame;
	Log.time("scan mask layer");
	var prev = {};
	var prevCmds = null;
	for (var i=0, l=frames.length(); i<l; i++) {
		var frame = frames[i];
		var o = {index: frame.@index*1, data:null, x:0, y:0};
		var e = frame.elements.DOMShape[0];
		if (e) {
			o.x = fix(e.Transform.@x*1);
			o.y = fix(e.Transform.@y*1);
			o.data = (new ShapeInst(e)).read(true);
			if (o.data) { this.empty = false; }
		}
		if (o.x != prev.x || o.y != prev.x || o.data != prev.data) { this.graphicEntries.push(o); }
		prev = o;
	}
	Log.time();
}