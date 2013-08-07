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

ContainerSymbol = function(xml, isStage, params) {
	this.xml = xml;
	this.isStage = isStage;
	this.params = params;
	
	this.duration = xml.@duration*1;
	this.movieclip = this.duration > 1;
}
var p = ContainerSymbol.prototype;

p.xml;
p.name;

p.isStage;
p.timeline;
p.duration;

p.names;
p.labels;
p.code;
p.layerObjs;
p.layerIndex;

p.rect;
p.movieclip;
p.empty = true;
p.params;

p.nominalBounds;
p.frameBounds;

p.toString = function(t) {
	if (!this.layerObjs) { this.read(); }
	if (this.movieclip) { Log.warning("EJS_W_FRAMENUMS"); }
	
	var loop = this.params.loop != "false";
	
	var contentStr = "";
	var m = Exporter.instance.useTicks?1:1000/Exporter.instance.fps;
	
	Log.time("write action tween");

	// even if this is only a single frame, we want to treat it as a MC if it has code
	// this is to keep the code executing at the right time.
	var l=this.code.length;
	var mc = this.movieclip;
	if (l) { this.movieclip = true; }

	// set up the actions tween and functions.
	var t0 = t;
	t += '\t';
	var code, functions = [];
	var actionsStr = "";
	if (l && this.movieclip) {
		// multi-frame MovieClip, create an actions tween.
		contentStr += t+"\t// actions tween:";
		contentStr += "\n"+t+"\ttimeline.addTween(_tween(this)";
		var prev = 0;
		for (i=0; i<l; i++) {
			if (!(code = this.code[i])) { continue; }
			var fname = getVarName("frame_"+i, "__DART_SYMB__"+this.name); // just in case there is an instance named frame_X.
			functions.push(t+"\tvoid "+fname+"() {\n"+t+"\t\t"+code.join("\n").split("\n").join("\n\t"+t+"\t")+"\n\t"+t+"}");
			if (i-prev) { contentStr += ".wait("+fix((i-prev)*m,0)+")"; }
			contentStr += ".call("+fname+")";
			prev = i;
		}
		if (prev != this.duration-1) { contentStr += ".wait("+(this.duration-prev-1)+")"; }
		contentStr += ");\n\n";
		if (functions.length) {
			contentStr = t+"\t// timeline functions:\n"+functions.join("\n")+"\n\n"+contentStr;
		}
	}
	Log.time();
	
	Log.time("write layers");
	var defStr = "";
	for (var i=0,l=this.layerObjs.length;i<l;i++) {
		var layer = this.layerObjs[i];
		contentStr += layer.toString('\t'+t, this.movieclip);
		if (layer.getDeclarations) defStr += layer.getDeclarations('\t'+t0); 
	}
	Log.time();
	
	// write the definition:
	if (this.movieclip) {
		Exporter.instance.hasTweens = true;
		var str = 
			 t0+'class '+this.name+' extends MovieClip {\n'
			+defStr+'\n'
			+t+this.name+'([String mode, int startPosition, bool loop])\n'
			+t+'\t\t: super(mode, startPosition, loop, {'+this.labels.join(',')+'}) {\n'
			+contentStr
			+t+'}\n'
			+t0+'}\n';
	} else {
		var str = 
			 t0+'class '+this.name+' extends Sprite {\n'
			+defStr+'\n'
			+t+this.name+'() {\n'
			+contentStr;
		if (this.names.length) {
			for(var i=this.names.length-1;i>=0;i--)
				str += t+'\taddChild('+this.names[i]+');\n'; 
		}
		str += actionsStr;
		str += t+'}\n'
			+t0+'}\n';
	}
	return str;
}

p.isEmpty = function() {
	if (!this.layerObjs) { this.read(); }
	return this.empty;
}

p.getRect = function() {
	return this.rect;
}

p.read = function() {
	this.names = [];
	this.types = [];	
	this.labels = [];
	this.layerObjs = [];
	this.layerIndex = [];
	this.code = [];

	var namespace = this.xml.@name;
	
	var layers = this.xml.DOMLayer;
	for (var i=0,l=layers.length(); i<l; i++) {
		var layer = layers[i];
		var o;

		if (layer.@layerType == "guide") {
			o = new GuideLayerObj(layer, "__CREATEJS_SYMB__"+namespace, this.duration);
		} else if (layer.@layerType == "mask") {
			o = new MaskLayerObj(layer, "__CREATEJS_SYMB__"+namespace, this.duration);
		} else {
			o = new LayerObj(layer, "__CREATEJS_SYMB__"+namespace, this.duration);
		}

		if (layer.@parentLayerIndex[0]) {
			var parent = this.layerIndex[layer.@parentLayerIndex*1];
			if (parent instanceof MaskLayerObj) { o.mask = parent; }
			else if (parent instanceof GuideLayerObj) { o.guide = parent; }
		}

		o.read("this.", this.code, this.labels, this.names, this.types);
		if (o.error) { this.layerObjs.push(o); continue; }
		if (o.empty) { continue; }
		this.empty = false;
		this.layerObjs.push(o);
		this.layerIndex[i] = o;
	}
}
