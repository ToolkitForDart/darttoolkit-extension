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

	str += "\n"+t+"// WARNING: masks are not supported by the toolkit yet.\n\n";
	return str;

	// TODO generate StageXL-compatible mask objects

	if (this.error) { return str+"\n"+t+"/* "+Locale.get(this.error)+" */\n\n"; }
	if (this.empty) { return ""; }
	
	// define the shape:
	var e0 = this.xml.DOMFrame.elements.DOMShape[0];
	//var o = getElementTransform(e0);
	str += "\n"+t+"var "+this.maskName+" = new Mask.custom();";

	// graphics:
	var gs = this.graphicEntries;
	if (gs.length == 1) {
		// single frame.
		var o = gs[0];
		str += "\n"+t+this.maskName+exportTransform(e0, this.maskName, "\n"+t);
		str += "\n"+t+".graphics = _shape(0,0)"+o.data+".graphics;";
		//if (o.x || o.y) { str += "\n"+t+this.maskName+".setTransform("+o.x+","+o.y+");"; }
	} else {
		// multi-frame.
		var tween = "\n"+t+"timeline.addTween(_tween("+this.maskName+")";
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
				defs.push( t+"var "+name+" = _shape(0,0)"+data+".graphics;" );
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
		str += "\n"+defs.join("\n")+"\n"+tween+");";
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