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

Log = {};



Log.error = function(str, details) {
	str = Log._getLocalizedString(str, details);
	if (Log.errorHash[str]) { Log.errorHash[str]++; return; }
	Log.errorHash[str] = 1;
	Log.errorList.push(str);
}

Log.warning = function(str, details) {
	str = Log._getLocalizedString(str, details);
	if (Log.warningHash[str]) { Log.warningHash[str]++; return; }
	Log.warningHash[str] = 1;
	Log.warningList.push(str);
}

Log.generateErrorReport  = function(includeWarnings) {
	return Log._getErrStr(Log.errorList,Log.errorHash,Locale.get("EJS_ERRORS"))
			+(includeWarnings?Log._getErrStr(Log.warningList,Log.warningHash,Locale.get("EJS_WARNINGS")):"");
}

Log.time = function(label) {
	var t = (new Date()).getTime();
	if (label) {
		var o = {label:label, start:t, depth:Log.activeTimes.length};
		Log.times.push(o);
		Log.activeTimes.push(o);
	} else {
		o = Log.activeTimes.pop();
		o.end = t;
	}
}

Log.generateTimeReport = function() {
	var l=Log.times.length;
	if (l == 0) { return ""; }
	var str = "TIME REPORT:\n";
	for (var i=0;i<l;i++) {
		var o = Log.times[i];
		if (i>0) { str += "\n"; }
		for (var j=1,d=o.depth;j<d;j++) {
			str += "\t";
		}
		if (d>0) { str += "> "; }
		str += o.label+": "+(o.end-o.start)+"ms";
	}
	return str+"\n\n";
}

Log.clear = function() {
	Log.errorHash = {};
	Log.errorList = [];
	Log.warningHash={};
	Log.warningList=[];
	
	Log.times = [];
	Log.activeTimes = [];
}

Log._getErrStr = function(list, hash, title) {
	var l = list.length;
	if (l == 0) { return ""; }
	str = title+"\n";
	for (var i=0; i<l; i++) {
		var s = list[i];
		var count = hash[s];
		str += (i?"\n":"")+s+(count>1?" ("+count+")":"");
	}
	return str+"\n\n";
}

Log._getLocalizedString = function(str, details) {
	if (str.substr(0,4) != "EJS_") { return "** "+str; }
	var s = Locale.get(str, details);
	if (str.substr(0,8) == "EJS_W_F_") { s = Locale.get("EJS_W_F")+s; }
	return s;
}

Log.clear();