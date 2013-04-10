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