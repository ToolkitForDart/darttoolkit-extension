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

include("utils");

BoundsHelper = function(doc, multiframe, includeHiddenLayers) {
	this.doc = doc;
	this.multiframe = multiframe;
	this.includeHiddenLayers = includeHiddenLayers;
}
var p = BoundsHelper.prototype;

p.doc;
p.scratchDoc;
p.frame;
p.multiframe; // whether we are supporting multiframe at all. If not, we'll skip the scratch FLA.
p.includeHiddenLayers;
p.tmpCount = 0;

p.init = function() {
	if (this.scratchDoc) { return; }
	Log.time("BoundsHelper init");
	this.scratchDoc = fl.createDocument("timeline");
	/* // this correctly sets the publish profile, but the JSAPI doesn't factor it into bounds calculations! Keeping it for future use.
	var xml = XML(this.scratchDoc.exportPublishProfileString());
	xml..InvisibleLayer.* = this.includeHiddenLayers ? "1" : "0";
	this.scratchDoc.importPublishProfileString(xml.toXMLString());
	*/
	this.frame = this.scratchDoc.timelines[0].layers[0].frames[0];
	Log.time();
}

p.cleanup = function() {
	Log.time("BoundsHelper cleanup")
	if (this.scratchDoc) { this.scratchDoc.close(false); this.scratchDoc = null; }
	this.tmpCount = 0;
	Log.time();
}

p.getSymbolBounds = function(symbolOrName, multiframe, checkHiddenLayers, offsetX, offsetY) {
	if (checkHiddenLayers == null) { checkHiddenLayers = true; }
	var symbol = this._getSymbol(this.scratchDoc, symbolOrName); // check if it already exists in our scratch library (doesn't actually seem any faster)
	if (!symbol) { symbol = this._getSymbol(this.doc, symbolOrName); }
	if (!symbol || symbol instanceof ComponentInstance || !symbol.timeline) { return {}; }
	if (!this.multiframe) { return this._getFirstFrameBounds(symbol.timeline); } // don't go through the mess of setting up a new scratch doc if we don't have to.
	this.init();

	
	if (!symbol) { return null; }
	Log.time("BoundsHelper add item ("+symbol.name+")")
	this.scratchDoc.addItem({x:0,y:0}, symbol);
	Log.time();
	var es = this.frame.elements;
	var e = es[0];
	e.x = e.y = 0; // addItem positions relative to the transformation point, so we need to do this.

	if (!this.includeHiddenLayers && checkHiddenLayers) {
		var timeline = e.libraryItem.timeline;
		var layers = timeline.layers;
		for (var i=0, l=layers.length; i<l; i++) {
			if (!layers[i].visible) { timeline.deleteLayer(i); }
		}
	}

	if (offsetX == null) { offsetX=0; }
	if (offsetY == null) { offsetY=0; }

	e.symbolType = "graphic";
	e.loop = "single frame";
	var bounds = [];
	var rect = null;
	var l = multiframe ? symbol.timeline.frameCount : 1;
	var x,x1,y,y1,w,w1,h,h1,fwd;
	for (var i=0; i<l; i++) {
		e.firstFrame = i;
		x1 = fix(e.left+offsetX);
		if (x1 < -100000000) { x1 = 0; } // JSAPI bug returns -107374182.3 for empty frames (except frame 0)
		y1 = fix(e.top+offsetY);
		if (y1 < -100000000) { y1 = 0; }
		w1 = fix(e.width);
		h1 = fix(e.height);

		if (x1 == x && y1 == y && w1 == w && h1 == h) {
			bounds[i] = "rect";
			if (!fwd && i != 1) { bounds[i-1] = "rect="+bounds[i-1]; }
			fwd = true;
		} else {
			bounds[i] = "new "+CREATEJS_VAR_+"Rectangle("+[x1,y1,w1,h1].join(",")+")";
			fwd = false;
		}
		x = x1;
		y = y1;
		w = w1;
		h = h1;
		if (i==0) { rect = {x:x,y:y,width:w,height:h}; }
	}
	e.selected = true;
	this.scratchDoc.deleteSelection();
	return {bounds:bounds, rect:rect};
}

p.getTimelineBounds = function(timeline, multiframe, offsetX, offsetY) {
	if (!this.multiframe) { return this._getFirstFrameBounds(timeline); }
	this.init();

	var cl = timeline.currentLayer;
	var count = timeline.frameCount;

	// create a new symbol representing the timeline:
	var name = "TMP"+(this.tmpCount++);
	this.scratchDoc.library.addNewItem("movie clip", name);
	var symbol = this._getSymbol(this.scratchDoc,name);
	var newTimeline = symbol.timeline;

	// iterate through target timeline and copy layers into the new symbol
	var layers = timeline.layers;
	for (var i=0,l=layers.length;i<l;i++) {
		var layer = layers[i];
		if (!this.includeHiddenLayers && !layer.visible) { continue; } // no need to copy layers that will be deleted anyway.
		index = newTimeline.addNewLayer(layer.name, layer.layerType, false);
		timeline.currentLayer = i;
		timeline.copyFrames(0,count);
		newTimeline.currentLayer = index;
		newTimeline.pasteFrames(0,count);
	}
	timeline.currentLayer = cl;
	return this.getSymbolBounds(symbol, multiframe, false, offsetX, offsetY);
}

p._getFirstFrameBounds = function(timeline) {
	var rect;
	var layers = timeline.layers;
	for (var i=0, l=layers.length; i<l; i++) {
		var layer = layers[i];
		if (layer.frames.length < 1 || layer.layerType == "mask" || layer.layerType == "folder" || layer.layerType == "guide" || (!this.includeHiddenLayers && !layer.visible)) { continue; }
		var es = layer.frames[0].elements;
		for (var j=0,el=es.length; j<el; j++) {
			var e = es[j];
			if (e.visible === false || e.width == 0 || e.height == 0) { continue; }
			rect = extendRect(e.left,e.top,e.width,e.height,rect);
		}
	}
	var params = rect ? [fix(rect.x),fix(rect.y),fix(rect.width),fix(rect.height)] : [0,0,0,0];
	var bounds = ["new "+CREATEJS_VAR_+"Rectangle("+params.join(",")+")"];
	return {bounds:bounds, rect:rect};
}

p._getSymbol = function(doc, symbolOrName) {
	if (symbolOrName instanceof SymbolItem) { return symbolOrName; }
	if (!doc || !doc.library.itemExists(symbolOrName)) { return null; }
	return doc.library.items[doc.library.findItemIndex(symbolOrName)];
}