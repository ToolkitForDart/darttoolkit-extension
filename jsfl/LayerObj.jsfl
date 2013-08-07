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

/**
Some quick notes on functionality...

There are two tween types generated:
1. "motion" tweens
	target is a single display object. This is used for any instances with classic
	tweens, or those that appear alone on an appropriate number of keyframes.
	Multiple motion tweens can be generated for a single layer. Motion tweens
	use the special "_off" property to indicate if the target is on the timeline.
2. "state" tween
	target is a generic object. Can manage multiple instances, but can only swap
	instantaneous states, not tween property values. At most, one state tween is
	generated per layer.

Either or both types may be generated. Instances with an assigned motion tween
may also reside in the state tween in order to establish their zindex within the
state, but in this case will not have a corresponding ".p" (properties) value
because the properties will be managed by the corresponding motion tween. Because
of this, the state tween must be added to the timeline first.

Output for a layer is the product of a 2 pass system:
1. prescan
	scans through all keyframes and generates a StateObj for each instance found,
	then uses a simple heuristic to determine which instances should have their
	own tweens, versus being managed by the state tween.
2. generate
	the motion tweens are generated first, then the state tween is generated.
**/

LayerObj = function(xml, nameSpace, duration) {
	this.xml = xml;
	this.nameSpace = nameSpace;
	this.duration = duration;
	this.name = xml.@name;
	this._memberHash = {};
	this.definitions = [];
	this.tweens = [];
};
var p = LayerObj.prototype;

LayerObj.INDEPENDENT = "independent";
LayerObj.SINGLE_FRAME = "single";
LayerObj.SYNCHED = "synched";
LayerObj.RE_IMPORT = /\bimport /;

// this is also used by mask and guide layers:
LayerObj.readCodeAndLabels = function(xml, code, labels) {
	var frames = xml.DOMFrame;
	for (var i=0,l=frames.length(); i<l; i++) {
		var frameXML = frames[i];
		var index = frameXML.@index*1;

	// label:
		if (frameXML.@labelType == "name") {
			var lbl = frameXML.@name;
			if (lbl != getVarName(lbl)) { lbl = "\""+lbl+"\""; }
			labels.push("\""+lbl+"\":"+index);
		}
		
	// handle code:
		var as3 = frameXML.Actionscript;
		for (var j=0, jl=as3.length(); j<jl; j++) {
			var js = as3[j].text();
			if (LayerObj.RE_IMPORT.exec(js)) { js = LayerObj.extractImports(js); }
			if (code[index] == null) { code[index] = []; }
			code[index].push(js);
		}
		
	// handle sounds:
		if (frameXML.@soundName[0]) {
			if (code[index] == null) { code[index] = []; }
			if (frameXML.@soundSync[0]) { Log.warning("EJS_W_F_SOUNDSTOP"); }
			if (frameXML.SoundEnvelope[0]) { Log.warning("EJS_W_F_SOUNDFX"); }
			var repeatCount = Math.max(0, frameXML.@soundLoop*1-1);
			if (repeatCount == 32767-1) { repeatCount = -1; } // loop
			code[index].push('_playSound("'+Exporter.instance.getSymbol(frameXML.@soundName).name+(repeatCount?'",'+repeatCount:'"')+');');
		}
	}
}

LayerObj.extractImports = function(js) {
	var lines = js.split('\n');
	var found = [];
	for(var i=lines.length-1; i>=0; i--) {
		if (LayerObj.RE_IMPORT.exec(lines[i])) {
			found.push(lines[i]);
			lines.splice(i, 1);
		}
	}
	for(var i=found.length-1;i>=0;i--) {
		Exporter.instance.addImport(found[i]);
	}
	return lines.join('\n');
}

p.xml;
p.name;

p.empty = true;
p.length = 0;
p.error;
p.definitions;
p.tweens; // array of tween strings
p.nameSpace;
p.duration;
p.mask;
p.guide;
p.includeStateTween = false;
p.keyframes;

p.shapeObjs; // array of all shapes
p.stateObjs; // object with inst hashes pointing to arrays of stateObj's
p.stateObjList; // flat array of all stateObjs

p.toString = function(t, mc) {
	var str = t+"// "+this.name;
	if (this.error) { return str+"\n"+t+"/* "+Locale.get(this.error)+" */\n\n"; }
	if (this.empty) { return ""; }
	
	// definitions:
	for (var i=0, l=this.definitions.length; i<l; i++) {
		str += "\n"+t+this.definitions[i].toString(t)+"\n";
	}
	if (this.mask) {
		var names = [];
		for (i=0,l=this.definitions.length; i<l; i++) {
			names.push(this.definitions[i].name);
		}
		str += "\n"+t+"this."+names.join(".mask = this.")+".mask = "+this.mask.maskName+";\n"; // TODO: should we worry about making the scope configurable here?
	}
	if (mc) {
		for (i=0,l=this.tweens.length; i<l; i++) {
			str += "\n"+t+"this.timeline.addTween("+this.tweens[i]+");";
		}
		str += "\n";
	}

	return str+"\n";
}

p.getDeclarations = function(t) {
	var defStr = "";
	for (i=0,l=this.definitions.length; i<l; i++) {
		var def = this.definitions[i];
		if (def.symbol)
			defStr += t + def.symbol.name + " " + def.name + ";\n"
		else if (def instanceof TextInst)
			defStr += t + "TextField " + def.name + ";\n"
		else if (def instanceof ShapeInst)
			defStr += t + "Shape " + def.name + ";\n"
		else Log.warning("WARNING: Unsupported declarations \n" + def);
	}
	return defStr;
}

p.read = function(scope, code, labels, names) {
	LayerObj.readCodeAndLabels(this.xml, code, labels);
	Log.time("scan layer ("+this.name+")");
	this.prescan(scope, names);
	Log.time();

	if (this.empty) { return; }

	// iterate through stateObjs & assemble motion tweens as appropriate:
	Log.time("assemble tweens");
	var stateObjList = this.stateObjList;
	for (var i=0,l=stateObjList.length; i<l; i++) {
		var stateObj = stateObjList[i];
		if (stateObj.tween) {
			this.tweens.push( this.exportMotionTween(scope, stateObj, this.keyframes) );
		}
	}
	
	// export the state tween last, so it can pick up any keyframes that weren't part of a tween:
	if (this.includeStateTween) {
		// assemble the state tween.
		this.tweens.unshift( this.exportStateTween(scope, this.keyframes) );
	}
	Log.time();
}

p.prescan = function(scope, names) {
	var scores = {};
	var instCount = 0;
	var occupiedKeyframes = 0;
	var kfs = this.keyframes = [];
	var lastFrameIDs = {};
	var solo;
	
	var frames = this.xml.DOMFrame;
	for (var i=0,l=frames.length(); i<l; i++) {
		prevKeyframe = keyframe;
		var frameXML = frames[i];
		var nextFrameXML = frames[i+1];
		var index = frameXML.@index*1;
		var duration = frameXML.@duration*1||1;

	// read the frame:
		var es = frameXML.elements.*;
		var keyframe = {index:index, duration:duration, elements:es, frameXML:frameXML, empty:true, isTween:false};
		kfs.push(keyframe);

		var stateObjList = keyframe.stateObjList = [];

	// create the stateObjs for each frame:
		this.exportElements(es, index, names, this.definitions, stateObjList); //elements, frame, names, definitions, stateObjList
		var el = stateObjList.length;

	// empty keyframe:
		if (el < 1) {
			if (prevKeyframe && prevKeyframe.empty) {
				// just append this to the previous empty keyframe:
				prevKeyframe.duration += duration;
				kfs.unshift();
			}
			solo = null
			continue;
		}

	// not empty
		this.empty = keyframe.empty = false;
		occupiedKeyframes++;

	// valid classic tween?
		if (frameXML.@tweenType == "motion" && el == 1) {
			if (es[0].name() == "DOMSymbolInstance") { keyframe.isTween = true; }
			else { Log.warning("EJS_W_TWEENSHAPE"); }

			// NOTE: this is good for scoring, but bad for actually building the tween. Leaving it out for now:
			// tweens only really count if they span more than one frame:
			//keyframe.isTween = nextFrameXML && nextFrameXML.@index*1 > index+1;
		}

	// handle tween warnings:
		if (keyframe.isTween) {
			if (frameXML.@motionTweenScale == "false") { Log.warning("EJS_W_F_TWEENNOSCALE"); }
			if (frameXML.@hasCustomEase == "true") { Log.warning("EJS_W_F_CUSTOMEASE"); }
			if (nextFrameXML.elements.*.length() > 1) { Log.warning("EJS_W_TWEENENDMULTI"); }
		}

	// check if it's solo, and increase score if it is:
		if (el == 1) {
			if (keyframe.isTween) { stateObjList[0].score += 1; }
			stateObjList[0].score += 0.2;
			if (solo == stateObjList[0]) {
				// bonus points if it is a subsequent frame:
				stateObjList[0].score += 0.1;
			}
			solo = stateObjList[0];
		} else if (el > 1) {
			this.includeStateTween = true;
			solo = null;
		}

	}

	// add an empty keyframe if this layer doesn't extend through the full timeline:
	var tl = frameXML.@index*1+(frameXML.@duration*1||1);
	if (tl<this.duration) {
		kfs.push({index:tl, elements:(<empty/>).none, frameXML:null, stateObjList:[]});
	}
	this.length = tl+1;

	// nothing in the layer:
	if (this.empty) { return; }

	// if there's only one element, we may as well use a normal tween:
	if (this.stateObjList.length == 1) {
		this.stateObjList[0].score += 1;
		this.includeStateTween = false;
	}

	// loop through stateObjs and decide which will get their own tweens:
	for (var i=0,l=this.stateObjList.length; i<l; i++) {
		var stateObj = this.stateObjList[i];
		if (stateObj.score >= 1) {
			// should have it's own tween:
			stateObj.tween = true;
		} else {
			// there's at least one element that needs a state tween:
			this.includeStateTween = true;
		}
	}
}

p.exportStateTween = function(scope, keyframes) {
	var str = "_tween({})";
	var frameIndex=0, prevFrameIndex=0;

	for (var i=0, l=keyframes.length; i<l; i++) {
		prevFrameIndex = frameIndex;
		var kf = keyframes[i];
		var frameIndex = kf.index;
		var delta = frameIndex-prevFrameIndex;
		
		str += ".to(";
		str += this.getTweenStateStr(kf.stateObjList, frameIndex, scope);
		
		str += (delta) ? ","+delta+")" : ")";
	}
	
	if (frameIndex < this.duration) { str += ".wait("+(this.duration-frameIndex)+")"; }
	return str;
}

p.extendTween = function(tween, lastIndex, passiveWait, passive) {
	var delta = this.duration-lastIndex;
	if (passiveWait && passive) {
		return tween+".wait("+(delta+passiveWait)+",true)";
	}
	if (passiveWait) {
		tween += ".wait("+passiveWait+",true)";
	}
	if (delta == 0) { return tween; }
	return tween + ".wait("+delta+")";
}

p.exportMotionTween = function(scope, stateObj, keyframes) {
	var inst = stateObj.inst;

	var i, l = keyframes.length;
	str = "_tween("+scope+inst.name+")";

	
	var keyframe = keyframes[0];
	var frameIndex = keyframe.index;
	var isOnFrame = (keyframe.stateObjList.indexOf(stateObj) != -1);
	inst._off = !(isOnFrame && keyframe.index == 0); // is the item initially on stage?

	var oldO = stateObj.baseProps;
	var waitCount=0;

	for (i=1; i<l; i++) {
		var frameStr = null;
		var prevKeyframe = keyframe;
		var prevIsOnFrame = isOnFrame;
		// we are in a tween if the previous frame had a valid tween,
		// and our target object was present:
		var inTween = prevKeyframe.isTween && isOnFrame;

		keyframe = keyframes[i];
		frameIndex = keyframe.index;
		var prevFrameXML = prevKeyframe.frameXML;
		var dur = prevKeyframe.duration;
		var stateObjList = keyframe.stateObjList;
		var stateObjIndex = stateObjList.indexOf(stateObj);
		var isOnFrame = (stateObjIndex != -1);
		var o = stateObj.frames[frameIndex];

		if (isOnFrame || inTween) {

			var delta = [];
			var guideName = null, guideData = null, orient = false;

			if (!isOnFrame) {
				// we're in a tween, but it ends on a different target.
				o = stateObjList[0].frames[frameIndex];
				delta.push("\"off\":true");
			} else if (!prevIsOnFrame) {
				// the target was previously hidden.
				delta.push("\"off\":false");
			}
			
			if(this.guide){
				guideName = prevFrameXML.@poseLocations[0];
				if (guideName){
					var orientDir = "";
					orient = prevFrameXML.@motionTweenOrientToPath[0] == "true";
					orientDir = prevFrameXML.@motionTweenRotate[0];
					if (	orientDir == "none"){				orientDir = "fixed"; }
					else if(orientDir == "clockwise"){			orientDir = "cw"; }
					else if(orientDir == "counter-clockwise"){	orientDir = "ccw"; }
					else { 										orientDir = "auto"; }
					
					guideData = "\"path\":"+this.guide.guides[guideName].getPath()+(orient?(", \"orient\":'"+orientDir+"'"):"");
					if (orient) { Log.warning("EJS_W_ORIENTTOPATH"); }
				}
			}
			
			for (var n in o) {
				var v0 = oldO[n];
				var v1 = o[n];
				var isAngle = false;
				
				if (n == "rotation" || n == "skewX" || n == "skewY") {
					var r = (v1-v0)%360;
					var rmode = (n == "rotation") ? prevFrameXML.@motionTweenRotate[0]||"auto" : "auto";
					if (rmode == "none") { Log.warning("EJS_W_ROTATION_NONE"); }
					else if (rmode == "auto") {
						if (r > 180) { r -= 360; }
						else if (r < -180) { r += 360; }
					} else if (rmode == "clockwise") {
						if (r<0) { r+=360; }
						r += prevFrameXML.@motionTweenRotateTimes*1*360;
					} else if (rmode == "counter-clockwise") {
						if (r>0) { r-=360; }
						r -= prevFrameXML.@motionTweenRotateTimes*1*360;
					}
					o[n] = v1 = v0+r;
					isAngle = true;
				}

				if (v0 != v1) {
					if(guideName && (n == "x" || n == "y")){
						if (guideData) {
							//delta.push("\"guide\":{"+guideData+"}"); 
							// TODO: Guides
							Log.warning("Animation guides are not supported currently.");
							guideData = null;
						}
					} else {
						if (isAngle) {
							delta.push('"'+n+'":'+(v1*Math.PI/180).toFixed(2)); // to radians
						} else if (n == "mode" || n == "loop" || n == "startPosition" || n == "visible") {
							if (typeof v1 == "string") { v1 = "\""+v1+"\""; }
							delta.push("\""+n+"\":"+v1);
						} else {
							delta.push("\""+n+"\":"+fix(v1, (n=="alpha"?3:n=="scaleX"||n=="scaleY"?2:1)));
						}
					}
				}
			}
			
			if (!delta.length && o.startPosition != null) {
				// graphic object that needs to be reset.
				// TODO: why only if !delta.length??
				delta.push("startPosition:"+o.startPosition);
			}

			if (delta.length) {
				if (!prevKeyframe.isTween) {
					// no tween, just wait, then jump to the next values:
					waitCount += dur;
					dur = 0;
				} else {
					// warning for tweens that have a moving regX/Y (causes weird results):
					if (Math.abs(oldO.regX-o.regX) > 1 || Math.abs(oldO.regY-o.regY) > 1) { Log.warning("EJS_W_TRANSFORMPOINT"); }
				}
				frameStr = ".to({"+delta.join(",")+"},"+dur;
				// for some reason, Flash stores eases with the sign flipped:
				if (prevFrameXML.@acceleration*1 != 0) { frameStr += ",_ease("+fix(prevFrameXML.@acceleration*-1/100,2)+")"; }
				frameStr += ")";
			} else {
				waitCount += dur;
			}
			oldO = o;
		} else {
			// not on frame or in a tween:
			if (!prevIsOnFrame) { waitCount += dur; continue; }
			frameStr = ".to({\"off\":true},"+fix(dur,0)+")";
		}
		
		if (frameStr) {
			if (waitCount > 0) {
				str += ".wait("+fix(waitCount,0)+")";
				waitCount = 0;
			}
			str += frameStr;
		}
	}

	// extend tween to the end of the timeline:
	if (frameIndex < this.duration) { str += ".wait("+(this.duration-frameIndex+waitCount)+")"; }
	
	return str;
}

p.getTweenStateStr = function(stateObjList, frameIndex, scope) {
	var arr = [];
	for (var i=stateObjList.length-1; i>=0; i--) {
		var s = stateObjList[i].getFrameStr(frameIndex, scope);
		if (s) { arr.push(s); }
	}
	if (!arr.length) { return "{\"state\":[]}"; }
	return "{\"state\":["+arr.join(",")+"]}";
}

p.exportElements = function(elements, frameIndex, names, definitions, stateObjList) {
	if (!elements) { return; }
	var l = elements.length();
	
	for (var i=l-1; i>=0; i--) {
		var e = elements[i];
		
		if (e.name() == "DOMGroup") {
			this.exportElements(e.* , frameIndex, names, definitions, stateObjList);
		} else {
			var stateObj = this.getStateObj(e, frameIndex, names, definitions);
			if (stateObj && stateObjList) { stateObjList.push(stateObj); }
		}
	}
}

// either returns an existing instance, or creates a new one.
p.getStateObj = function(e, frameIndex, names, definitions) {
	if (!this.stateObjs) {
		this.shapeObjs = [];
		this.stateObjs = {};
		this.stateObjList = [];
	}
	
	var type = getElementType(e);
	if (!type) { return null; }
	var inst, o, stateObj, arr;
	
	// find the state obj if available. If not, create a new inst.
	if (type == "shape") {
		// for shapes, we need to compare the shape data to decide if it is the same instance.
		inst = new ShapeInst(e);
		var cmds = inst.getCmds();
		if (inst.isEmpty()) { return null; }
		arr = this.shapeObjs;
		for (var i=0, l=arr.length; i<l; i++) {
			o = arr[i];
			if (o.inst.getCmds() == cmds && o.addFrame(e, frameIndex)) { return o; }
		}
	} else {
		var hash = type+"\t"+e.name();
		if (type == "instance") { hash += "\t"+e.@libraryItemName; }
		
		// we keep an array of stateObj's, because we could have multiple instances matching the same hash on a frame:
		arr = this.stateObjs[hash];
		if (!arr) { arr = this.stateObjs[hash] = []; }
		for (var i=0, l=arr.length; i<l; i++) {
			var o = arr[i];
			if (o.addFrame(e, frameIndex)) { return o; }
		}

		// create new inst:
		if (type == "instance") {
			var symbol = Exporter.instance.getSymbol(e.@libraryItemName);
			if (!symbol) { return null; }
			inst = new SymbolInst(e, null, symbol);
		} else if (type == "text") {
			inst = new TextInst(e, null);
		} else {
			return null;
		}
	}
	
	// new inst, create stateObj, and add it's name and definition:
	if (!inst) { return null; }
	inst.name = getVarName(e.@name, this.nameSpace, type);
	
	stateObj = new StateObj(inst, frameIndex, type)
	arr.push(stateObj);
	this.stateObjList.push(stateObj);
	if (names) { names.push(inst.name); }
	if (definitions) { definitions.push(inst); }
	
	return stateObj;
}
