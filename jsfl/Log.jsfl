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