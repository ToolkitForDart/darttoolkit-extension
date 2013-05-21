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

FileChangeManager = function(changeLogPath){
	this.changeLogPath = changeLogPath;
}
var p = FileChangeManager.prototype;

FileChangeManager.MAX_ENTRIES = 500;

p.changeLogPath;
p.changeData;
p.useHash = true;

p.getChangeData = function() {
	if (!this.changeData) {
		Log.time("FileChangeManager.getChangeData");
		if (FLfile.exists(this.changeLogPath)) {
			this.changeData = FLfile.read(this.changeLogPath).split("\n");
		} else {
			this.changeData = [];
		}
		Log.time();
	}
	return this.changeData;
}

p.checkFile = function(path) {
	var data = this.getChangeData();
	if (!FLfile.exists(path)) { return false; }
	var i = this.getIndex(path,data);
	if (i == -1) { return true; }
	var time = FLfile.getModificationDate(path);
	if (data[i+1] == time) { return false; }
	else if (!this.useHash) { return true; }
	var hash = this.getHash(path);
	return (data[i+2] != hash);
}

p.updateFile = function(path) {
	Log.time("FileChangeManager.updateFile");
	var data = this.getChangeData();
	var time = FLfile.getModificationDate(path);
	var hash = this.getHash(path);
	var i = this.getIndex(path, data);
	if (i > -1) { data.splice(i,3); }
	data.unshift(path,time,hash);
	
	var l = data.length;
	var max = FileChangeManager.MAX_ENTRIES*3;
	if (l > max) { data.splice(max,l-max);	}
	
	FLfile.write(this.changeLogPath, data.join("\n"));
	Log.time();
}

p.getHash = function(path) {
	return this.useHash ? fl.createMD5Hash(FLfile.read(path))  : "";
}

// faster than indexOf because we only need to check every third index.
p.getIndex = function(path,data) {
	for (var i=0,l=data.length; i<l; i+=3) {
		if (data[i] == path) { return i; }
	}
	return -1;
}