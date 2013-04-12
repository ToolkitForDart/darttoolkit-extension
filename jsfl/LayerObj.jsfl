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

// this is also used by mask and guide layers:
LayerObj.readCodeAndLabels = function(xml, code, labels) {
	var frames = xml.DOMFrame;
	for (var i=0,l=frames.length(); i<l; i++) {
		frame = frames[i];
		var index = frame.@index*1;

	// label:
		if (frame.@labelType == "name") { labels.push('"'+frame.@name+'":'+index); }
		
	// handle code:
		var as3 = frame.Actionscript;
		for (var j=0, jl=as3.length(); j<jl; j++) {
			var js = as3[j].text();
			if (code[index] == null) { code[index] = []; }
			code[index].push(js);
		}
		
	// handle sounds:
		if (frame.@soundName[0]) {
			if (code[index] == null) { code[index] = []; }
			if (frame.@soundSync[0]) { Log.warning("EJS_W_F_SOUNDSTOP"); }
			if (frame.SoundEnvelope[0]) { Log.warning("EJS_W_F_SOUNDFX"); }
			var repeatCount = Math.max(0, frame.@soundLoop*1-1);
			if (repeatCount == 32767-1) { repeatCount = -1; } // loop
			code[index].push('_playSound("'+Exporter.instance.getSymbol(frame.@soundName).name+(repeatCount?'",'+repeatCount:'"')+');');
		}
	}
}

p.xml;
p.name;

p.empty = true;
p.length = 0;
p.error;
p.definitions;
p.tweens;
p.rect;
p.nameSpace;
p.duration;
p.mask;
p.guide;

p.shapeObjs;
p.stateObjs;

p.toString = function(t, mc) {
	var str = this.name ? t+"// "+this.name : t;
	if (this.error) { return str+"\n"+t+"/* "+Locale.get(this.error)+" */\n\n"; }
	if (this.empty) { return ""; }

	// definitions:
	str += this.definitionsToString(this.definitions, t);
	if (this.extractedTimelines) {
		for (var i=0, l=this.extractedTimelines.length; i<l; i++) 
			str += this.definitionsToString(this.extractedTimelines[i].definitions, t);
	}

	if (this.mask) {
		var names = [];
		this.getDefinitionsNames(this.definitions, names);
		if (this.extractedTimelines) {
			for (var i=0, l=this.extractedTimelines.length; i<l; i++) 
				this.getDefinitionsNames(this.extractedTimelines[i].definitions, names);
		}
		str += "\n"+t+names.join(".mask = ")+".mask = "+this.mask.maskName+";\n"; // TODO: should we worry about making the scope configurable here?
	}

	if (mc) {
		str += this.tweensToString(this.tweens, t);
		if (this.extractedTimelines) {
			for (var i=0, l=this.extractedTimelines.length; i<l; i++) 
				str += this.tweensToString(this.extractedTimelines[i].tweens, t)
		}
		str += "\n";
	}

	return str+"\n";
}

p.getDeclarations = function(t) {
	var defStr = this.getDeclarationsFrom(this.definitions, t);
	if (this.extractedTimelines)
		for (var i=0, l=this.extractedTimelines.length; i<l; i++) 
			defStr += this.getDeclarationsFrom(this.extractedTimelines[i].definitions, t);
	return defStr;
}
p.getDeclarationsFrom = function(definitions, t) {
	var defStr = "";
	for (i=0,l=definitions.length; i<l; i++) {
		var def = definitions[i];
		if (def.symbol)
			defStr += t + definitions[i].symbol.name + " " + definitions[i].name + ";\n"
		else if (def instanceof TextInst)
			defStr += t + "TextField " + definitions[i].name + ";\n"
		else if (def instanceof ShapeInst)
			defStr += t + "Shape " + definitions[i].name + ";\n"
		else Log.warning("WARNING: Unsupported declarations \n" + def);
	}
	return defStr;
}

p.getDefinitionsNames = function(definitions, names) {
	for (i=0,l=definitions.length; i<l; i++) {
		names.push(definitions[i].name);
	}
}

p.definitionsToString = function(definitions, t) {
	var str = "";
	for (var i=0, l=definitions.length; i<l; i++) {
		str += "\n"+t+definitions[i].toString(t)+"\n";
	}
	return str;
}
p.tweensToString = function(tweens, t) {
	var str = "";
	for (var i=0, l=tweens.length; i<l; i++) {
		str += "\n"+t+"timeline.addTween("+tweens[i]+");";
	}
	return str;
}

p.read = function(scope, code, labels, names) {
	
	Log.time("scan layer ("+this.name+")");

	LayerObj.readCodeAndLabels(this.xml, code, labels);

	Log.time();

	// scan layer to determine what type of content it holds (state vs motion):
	// each time a motion is found it is extracted from the main timeline which must be re-scanned
	var safety = 0;
	if (scope == "this.") scope = "";
	while (safety < 500 && this.scanTimeline(scope, code, labels, names)) safety++;

	this.empty &= (this.extractedTimelines == null);
}

p.scanTimeline = function(scope, code, labels, names) {

	Log.time("scan timeline");

	var kf = this._keyframes = [];
	
	var index, e, motion, state;
	
	var frames = this.xml.DOMFrame;
	var occupiedKeyframes = 0;
	var singleInstance = true;
	var prevKeyframe;

	for (var i=0,l=frames.length(); i<l; i++) {
		frame = frames[i];
		var index = frame.@index*1;
		
	// read the frame:
		var es = frame.elements.*;
			
	// empty keyframe:
		if (es.length() < 1) {
			var prevLen = prevKeyframe ? prevKeyframe.elements.length() : 0;
			if (prevKeyframe && !prevLen) { // combine empty keyframes
				prevKeyframe.frame.@duration = (prevKeyframe.frame.@duration*1||1) + (frame.@duration*1||1);
				continue;
			}
			if (prevLen) { this.length = index+1; }
			kf.push(prevKeyframe = {index:index, elements:es, frame:frame});
			continue;
		}
		occupiedKeyframes++;
		var e0 = es[0];
		
	// check if it's a state layer:
		if ((es.length() > 1 || e0.name() != "DOMSymbolInstance") && (state = true) && motion) {
			this.error = "EJS_W_TWEENERROR"; break;
		}
	
	// check if it's a motion layer:
		if (frame.@tweenType == "motion" && (motion = true)) {
			if (e0.@libraryItemName != this.extractedItemName) { 
				Log.time();
				// move all tweens into "extracted" timelines
				this.extractTimeline(frames, ""+e0.@libraryItemName, scope, code, labels, names);
				return true;
			}

			if (frame.@hasCustomEase == "true") { Log.warning("EJS_W_F_CUSTOMEASE"); }
			if (state || e0.name() != "DOMSymbolInstance") { this.error = "EJS_W_TWEENERROR"; break; }
		}
		
	// check if it the same instance all the way through:
		if (singleInstance && (state || (e && e.@libraryItemName != e0.@libraryItemName))) {
			singleInstance = false;
		}
		
	// check content if motion tween:
		if (motion && !singleInstance) {
			this.error = "EJS_W_TWEENERROR"; break;
		}
		
	// save the element for comparison:
		if (!e) { e = e0; }
		
	// add to keyframe list:
		kf.push(prevKeyframe = {index:index, elements:es, frame:frame});
		this.length = index+1;
	}
	Log.time();
	
	Log.time("read layer ("+this.name+")");
	this.empty = (occupiedKeyframes == 0 || this.error);
	
	if (this.error) { Log.warning(this.error); }
	
	// add an empty keyframe if this layer doesn't extend through the full timeline:
	var tl = frame.@index*1+(frame.@duration*1||1);
	if (tl<this.duration) {
		kf.push({index:tl, elements:(<empty/>).none, frame:null});
		this.length = tl+1;
	}
	
	if (this.empty) {
		// nothing.
	} else if (this.length == 1) {
		this.exportStatic(scope, names, kf);
	} else if (motion || singleInstance) {
		this.exportMotion(scope, names, kf, e);
	} else {
		this.exportState(scope, names, kf);
	}
	
	if (this.definitions.length == 0) {
		this.rect = null;
		this.empty = true;
	}
	Log.time();
	return 
}

p.extractTimeline = function(frames, itemName, scope, code, labels, names) {

	// look for @libraryItemName = itemName symbols
	// and extract their frames into a child layer object
	// - stops if the instance name changes

	var extract = <extract/>;
	var lastIndex = 0;
	var instName = null;

	for (var i=0,l=frames.length(); i<l; i++) {
		frame = frames[i];

		var es = frame.elements.*;
		if (es.length() < 1) continue;

		var newIndex = frame.@index*1;
		var e0 = es[0];

		if (frame.@tweenType == "motion" && e0.@libraryItemName == itemName) {
			// same instance?
			var name = "" + e0.@name;
			if (instName == null) instName = name;
			else if (name != "" && instName != name) break;
			// pad
			if (lastIndex != newIndex) 
				extract.appendChild(<DOMFrame index={lastIndex} duration={newIndex-lastIndex}><elements/></DOMFrame>);
			// clone
			var duration = frame.@duration*1||1;
			lastIndex = newIndex + duration;
			extract.appendChild( XML(frame.toXMLString()) );
			// cleanup
			delete frame.@tweenType;
			frame.elements = <elements/>;
			continue;
		}

		var match = es.(@libraryItemName == itemName);
		if (match.length() > 1) {
			Log.error("ERROR: layer '" + this.name + "' contains an unsupported combination of '" 
				+ itemName + "' instances and motions changes.");
		}
		else if (match.length() == 1) {
			// same instance?
			var name = "" + e0.@name;
			if (instName == null) instName = name;
			else if (name != "" && instName != name) break;
			// pad
			if (lastIndex != newIndex)
				extract.appendChild(<DOMFrame index={lastIndex} duration={newIndex-lastIndex}><elements/></DOMFrame>);
			// clone
			var duration = frame.@duration*1||1;
			lastIndex = newIndex + duration;
			extract.appendChild(<DOMFrame index={frame.@index} duration={duration}><elements>{match}</elements></DOMFrame>);
			// cleanup
			frame.elements = <elements>{frame.elements.DOMSymbolInstance.(@libraryItemName != itemName)}</elements>;
		}
	}

	// create and re-read the child layer
	var layer = new LayerObj(extract, this.nameSpace, this.duration);
	layer.name = null; // do not repeat
	layer.extractedItemName = itemName;
	layer.scanTimeline(scope, code, labels, names);

	if (!this.extractedTimelines) this.extractedTimelines = [];
	this.extractedTimelines.push(layer);
}

p.exportStatic = function(scope, names, keyframes) {
	var stateObjList = [];
	this.exportElements(keyframes[0].elements, 0, names, this.definitions, stateObjList);
	this.tweens.push("_tween({}).to("+this.getTweenStateStr(stateObjList, 0, scope)+").wait("+this.duration+")");
}

p.exportState = function(scope, names, keyframes) {
	if (!this.frameJournal) {
		this.frameJournal = [];
	}
	
	for (var i=0, l=keyframes.length; i<l; i++) {
		var kf = keyframes[i];
		kf.state = [];
		this.exportElements(kf.elements, kf.index, names, this.definitions, kf.state);
	}
	
	// requires two passes because we need the full delta props list before exporting.
	var str = "_tween({})";
	var prevFrame = 0;
	for (var i=0, l=keyframes.length; i<l; i++) {
		var kf = keyframes[i];
		var frameIndex = kf.index
		var delta = frameIndex-prevFrame;
		
		str += ".to(";
		str += this.getTweenStateStr(kf.state, frameIndex, scope);
		
		str += (delta) ? ","+delta+")" : ")";
		prevFrame = frameIndex;
	}
	
	// extend tween to the end of the timeline:
	if (frameIndex < this.duration) { str += ".wait("+(this.duration-frameIndex)+")"; }
	
	this.tweens.push(str);
}

p.exportMotion = function(scope, names, keyframes, e) {
	var m = 1; //Exporter.instance.useTicks?1:1000/Exporter.instance.fps;
	
	var symbol = Exporter.instance.getSymbol(e.@libraryItemName);
	if (!symbol || symbol.isEmpty()) { return; }
	
	var name = getVarName(e.@name[0], this.nameSpace, "instance");
	var inst = new SymbolInst(e, name, symbol);

	l = keyframes.length;
	str = "_tween("+scope+name+")";

	var frame0 = this.xml.DOMFrame[0];
	var vis = Boolean(frame0.@index*1 == 0 && frame0.elements.*[0]); // is the item initially on stage?
	var initVis = vis;
	var guideName, guideData = "";

	var oldO = inst.getProps();
	var waitCount=0;
	for (i=1; i<l; i++) {
		var frameIndex = keyframes[i].index;
		var frame = keyframes[i].frame;
		var prev = keyframes[i-1].frame;
		var cmdStr = null;
		var dur = prev.@duration*1||1;
		var es = keyframes[i].elements;
		if (es.length() > 0) {
			var e = es[0];
			var o = inst.getProps(e);
			var delta = [];
			
			if(this.guide){
				guideName = (prev.hasOwnProperty("@poseLocations")?(prev.@poseLocations.toString()):"");
				if(guideName != ""){
					var orient = prev.hasOwnProperty("@motionTweenRotate") && prev.@motionTweenRotate == "none" && 
								prev.hasOwnProperty("@motionTweenOrientToPath") && prev.@motionTweenOrientToPath == "true";
					guideData = '"path":'+this.guide.guides[guideName].getPath()+(orient?', "orient":true':"");
				} else {
					guideData = "";
				}
			} else {
				guideName = guideData = "";
			}
			
			for (var n in o) {
				var v0 = oldO[n];
				var v1 = o[n];
				var isAngle = false;
				
				if (n == "rotation" || n == "skewX" || n == "skewY") {
					var r = (v1-v0)%360;
					var rmode = (n == "rotation") ? prev.@motionTweenRotate[0]||"auto" : "auto";
					if (rmode == "none") { /*Log.warning("EJS_W_ROTATION_NONE");*/ }
					else if (rmode == "auto") {
						if (r > 180) { r -= 360; }
						else if (r < -180) { r += 360; }
					} else if (rmode == "clockwise") {
						if (r<0) { r+=360; }
						r += prev.@motionTweenRotateTimes*1*360;
					} else if (rmode == "counter-clockwise") {
						if (r>0) { r-=360; }
						r -= prev.@motionTweenRotateTimes*1*360;
					}
					o[n] = v1 = v0+r;
					isAngle = true;
				}
				if (v0 != v1) {
					if(this.guide && guideName != "" && (n == "x" || n == "y")){
						if(guideData != ""){
							delta.push('"guide":{'+guideData+"}");
							guideData = "";
							Exporter.instance.includeMotionGuidePlugin = true;
						}
					} else {
						if (isAngle) {
							delta.push('"'+n+'":'+(v1*Math.PI/180).toFixed(2)); // to radians
						} else if (n == "mode" || n == "loop" || n == "startPosition" || n == "visible") {
							if (typeof v1 == "string") { v1 = "\""+v1+"\""; }
							delta.push('"'+n+'":'+v1);
						} else {
							delta.push('"'+n+'":'+fix(v1, (n=="alpha"?3:n=="scaleX"||n=="scaleY"?2:1)));
						}
					}
				}
			}
			
			if (!delta.length && o.startPosition != null) {
				// graphic object that needs to be reset.
				delta.push('"startPosition":'+o.startPosition);
			}

			if (!vis) { delta.push('"off":false'); }
			if (delta.length) {
				if (!prev.@tweenType[0]) {
					cmdStr = ".wait("+fix(dur*m,0)+")";
					dur = 0;
				} else {
					cmdStr = "";
					if (Math.abs(oldO.regX-o.regX) > 1 || Math.abs(oldO.regY-o.regY) > 1) { Log.warning("EJS_W_TRANSFORMPOINT"); }
				}
				cmdStr += ".to({"+delta.join(",")+"},"+dur;
				// for some reason, Flash stores eases with the sign flipped:
				if (prev.@acceleration*1 != 0) { cmdStr += ","+"_ease("+fix(prev.@acceleration*-1/100,2)+")"; }
				cmdStr += ")";
			} else {
				waitCount += dur;
			}
			oldO = o;
			vis = true;
		} else {
			if (!vis) { waitCount += dur; continue; }
			vis = false;
			cmdStr = '.to({"off":true},'+fix(dur*m,0)+")";
		}
		
		if (cmdStr) {
			if (waitCount > 0) {
				str += ".wait("+fix(waitCount*m,0)+")";
				waitCount = 0;
			}
			str += cmdStr;
		}
	}

	// extend tween to the end of the timeline:
	if (frameIndex < this.duration) { str += ".wait("+(this.duration-frameIndex+waitCount)+")"; }
	
	this.tweens.push(str);
	if (initVis) { names.push(name); }
	inst._off = !initVis;
	this.definitions.push(inst);
}


p.getTweenStateStr = function(stateObjList, frameIndex, scope) {
	var arr = [];
	for (var i=stateObjList.length-1; i>=0; i--) {
		var s = stateObjList[i].getFrameStr(frameIndex, scope);
		if (s) { arr.push(s); }
	}
	if (!arr.length) { return '{"state":[]}'; }
	return '{"state":['+arr.join(",")+"]}";
}

p.exportElements = function(elements, frame, names, definitions, stateObjList) {
	if (!elements) { return; }
	var l = elements.length();
	
	for (var i=l-1; i>=0; i--) {
		var e = elements[i];
		
		// stateObj might be null if e is empty, so we need to check getElementType instead of stateObj.
		if (e.name() == "DOMGroup") {
			this.exportElements(e.* , frame, names, definitions, stateObjList);
		} else {
			var stateObj = this.getStateObj(e, frame, names, definitions);
			if (stateObj && stateObjList) { stateObjList.push(stateObj); }
		}
	}
}

// either returns an existing instance, or creates a new one.
p.getStateObj = function(e, frame, names, definitions) {
	if (!this.stateObjs) {
		this.shapeObjs = [];
		this.stateObjs = {};
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
			if (o.inst.getCmds() == cmds && o.addFrame(e, frame)) { return o; }
		}
	} else {
		var hash = type+"\t"+e.name();
		if (type == "instance") { hash += "\t"+e.@libraryItemName; }
		
		arr = this.stateObjs[hash];
		if (!arr) { arr = this.stateObjs[hash] = []; }
		for (var i=0, l=arr.length; i<l; i++) {
			var o = arr[i];
			if (o.addFrame(e, frame)) { return o; }
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
	
	// new inst, create stateObj:
	if (!inst || inst.isEmpty()) { return null; }
	inst.name = getVarName(e.@name, this.nameSpace, type);
	if (symbol && inst.name == symbol.name) inst.name += "$";
	
	stateObj = new StateObj(inst, frame, type)
	arr.push(stateObj);
	if (names) { names.push(inst.name); }
	if (definitions) { definitions.push(inst); }
	
	return stateObj;
}