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

StateObj = function(inst, frame, type){
	this.inst = inst;
	this.type = type;
	this.baseProps = inst.getProps();
	this.frames = [];
	this.frames[frame] = this.baseProps;
	this.prevFrame = frame;
	this.score = 0;
}
var p = StateObj.prototype;

p.inst; // the instance object (ex. SymbolInst, TextInst, ShapeInst)
p.changedProps; // hash of props that have changed
p.baseProps; // starting props
p.frames; // props list
p.type; // element type (via getElementType)
p.score = 0; // own tween score
p.tween = false; // boolean

p.addFrame = function(e, frame) {
	if (this.prevFrame == frame) { return false; }
	var props = this.inst.getProps(e);
	this.changedProps = getChangedProps(this.baseProps, props, this.changedProps);
	this.frames[frame] = props;
	this.prevFrame = frame;
	return true;
}

p.getFrameStr = function(frame, scope) {
	var props = this.frames[frame];
	if (!props) { return null; }
	if (this.tween) { return "{\"t\":"+scope+this.inst.name+"}"; }
	var str = '{"t":'+scope+this.inst.name;
	var arr = [];
	for (var n in this.changedProps) {
		var val = props[n];
		if (typeof val == "string" && val.charAt(0) != "\"") { val = "\""+val+"\""; }
		if (n == "rotation" || n == "skewX" || n == "skewY") val = fix(val*Math.PI/180,2);
		arr.push('"'+n+'":'+val);
	}
	if (arr.length) {
		str += ',"p":{'+arr.join(',')+"}";
	}
	str += "}";
	return str;
}