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

Locale = {}

Locale.xml  = null;
Locale.MAP={ja_JP:"ja_JP"}; // enter other supported languages here. Ex. {ja_JP:"ja_JP"} // en_US:"ja_JP",

Locale.load  = function(uri) {
	var xmlStr = FLfile.read(uri);
	if (xmlStr == null) {
		fl.trace("ERROR: unable to load localization file");
	} else {
		this.xml = XML(xmlStr);
	}
}

Locale.get = function(key, details) {
	if (Locale.xml == null) { return "[ERROR: Locale data not loaded]"; }
	var str, node = Locale.xml.s.(@key==key);
	if (node.length()) {
		str = node[0].toString();
		if (details) { str = str.split("%DETAILS%").join(details); }
	} else { str = key; }
	return str;
}

Locale.getLocaleURI = function(path, code) { // code param is to make testing easier.
	if (code == null) { code = fl.languageCode; }
	code = Locale.MAP[code]||"en_US";
	return path.replace("%LANG%",code);
}