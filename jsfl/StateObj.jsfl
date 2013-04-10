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

StateObj = function(inst, frame, type){
	this.inst = inst;
	this.type = type;
	this.baseProps = inst.getProps();
	this.frames = [];
	this.frames[frame] = this.baseProps;
	this.prevFrame = frame;
}
var p = StateObj.prototype;

p.inst;
p.changedProps;
p.baseProps;
p.frames;
p.type;

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