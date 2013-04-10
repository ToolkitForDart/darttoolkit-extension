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

SoundSymbol = function(xml){
	this.xml = xml;
}
var p = SoundSymbol.prototype;

p.xml;
p.name;

p.toString = function(t) {
	return ""; // sounds are not represented as symbols.
}

p.exportFile = function(sourcePath, destPath, exportPath) {
	var suffix = ".mp3";
	var transcoded = this.xml.*[0];
	var source = transcoded ? transcoded.@href : this.xml.@href;

	// NOTE: fixAssetName should be removed in future versions:
	this.src = destPath+  fixAssetName(this.name)  +suffix;
	if (exportPath && !copyFile(sourcePath+source, exportPath+  fixAssetName(this.name)  +suffix, true)) {
		Log.error("EJS_E_SNDEXP",this.src);
	}
}

p.isEmpty = function() {
	return true;
}
