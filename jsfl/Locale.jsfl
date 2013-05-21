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