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

var BASE_PATH = fl.configURI+"DartJS/";
var JSFL_PATH = BASE_PATH+"jsfl/";
var LOCALE_PATH = BASE_PATH+"locale/%LANG%/strings.xml";


runPanelMethod("Toolkit for Dart","export");
function runPanelMethod(_panelName,method) {
	var swfPanel = fl.getSwfPanel(_panelName, false); // 2nd param indicates non-localized panel name
	if (swfPanel) {
		swfPanel.show(true); // pass in true to open and false to close
		if (swfPanel.call("isOpen")) {
			swfPanel.call(method);
		} else {
			showAlert("EJS_UI_OPENPANEL",_panelName);
		}
	} else {
		showAlert("EJS_UI_INSTALLPANEL",_panelName);
	}
}

function showAlert(str, details) {
	fl.runScript(JSFL_PATH+"Locale"+".jsfl");
	Locale.load(Locale.getLocaleURI(LOCALE_PATH));
	alert(Locale.get(str,details));
}
