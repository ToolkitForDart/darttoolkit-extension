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
