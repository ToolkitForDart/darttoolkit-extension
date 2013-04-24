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

BitmapSymbol = function(xml){
	this.xml = xml;
}
var p = BitmapSymbol.prototype;

p.xml;
p.name;
p.src;

p.toString = function(t) {
	var str = 
		 t+'class '+this.name+' extends Bitmap {\n'
		+t+'  '+this.name+'():super(resources.getBitmapData("'+this.name+'")) { }\n'
		+t+'}\n';
	return str;
}

p.exportFile = function(sourcePath, destPath, exportPath) {
	var source = this.xml.@href;
	var filename = source.split("/").pop();
	//var suffix = source.substr(source.lastIndexOf(".")).toLowerCase();

	// NOTE: fixAssetName should be removed in future versions:
	this.src = destPath + filename;
	if (exportPath && !copyFile(sourcePath+source, exportPath + filename, true)) {
		Log.error("EJS_E_IMGEXP",this.src);
	}
}

p.isEmpty = function() {
	return false;
}
