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

/************************************************************************
VERSIONS
************************************************************************/
var VERSION = "0.5.0";
var DEBUG = false;

/************************************************************************
GLOBAL METHODS
************************************************************************/
var included;
function include(file) {
	if (!included) { included = {}; }
	if (included[file]) { return; }
	included[file] = true;
	fl.runScript(JSFL_PATH+file+".jsfl");
}

function deinclude() {
	for (var n in included) {
		delete(this[n]); // deletes associated class if it exists
		delete(included[n]);
	}
}

var DELIMITER = "\n";
function deserialize(dataStr) {
	if (dataStr == null || typeof(dataStr) != "string") { return null; }
	var arr = dataStr.split(DELIMITER);
	if (arr[0] != "version") { return null; }
	var l = arr.length;
	var o = {};
	for (var i=0; i<l; i+=2) {
		o[arr[i]] = arr[i+1];
	}
	return o;
}

function serialize(o) {
	var arr = ["version",0.1];
	for (var n in o) {
		if (n == "version") { continue; }
		arr.push(n);
		arr.push(o[n]);
	}
	return arr.join(DELIMITER);
}

/************************************************************************
GLOBAL VARS
************************************************************************/
var FLCreateJS;
var doc;
var inited;
var themesSupported = !!fl["getThemeColor"];

var MAC = (fl.version.indexOf("MAC") != -1);
var BASE_PATH = fl.configURI+"DartJS/";
var JSFL_PATH = BASE_PATH+"jsfl/";
var JS_LIB_PATH = BASE_PATH+"libs/";
//var HOSTED_LIB_PATH = "http://code.createjs.com/";
var LOCALE_PATH = BASE_PATH+"locale/%LANG%/strings.xml";
var CHANGE_LOG_PATH = BASE_PATH+"changeLog.dat";
var DEFAULT_SETTINGS_PATH = BASE_PATH+"defaultSettings.dat";
var DOC_DATA_NAME = "DartToolkit_data";
var TIMELINE_DATA_NAME = "DartToolkit_timelinedata";
var PIP_NAME = "DartExtension0.4";
var MAIN_XML_PATH = "DOMDocument.xml";

/************************************************************************
PUBLIC METHODS
************************************************************************/
function getPanelVersion() {
	return VERSION;
}

function browseForOutputPath() {
	include("Locale");
	Locale.load(Locale.getLocaleURI(LOCALE_PATH));
	var path = fl.browseForFolderURL(Locale.get("EJS_UI_SAVETO"));
	return path ? getOutputPath(path) : null;
}

function getDisplayPath(path) {
	getDocument();

	if (path.charAt(0) != ".") return convertUriPath(path); 
	
	// relative path:
	if (!doc || !doc.pathURI) { return path; } // this shouldn't happen.
	
	include("utils");

	path = resolveRelativePath(doc.pathURI, path);
	docPath = FLfile.uriToPlatformPath(doc.pathURI);
	path = convertUriPath(path);
	
	var slash = MAC ? "/" : "\\";
	
	var index = docPath.lastIndexOf(slash);
	docPath = docPath.substring(0,index+1);
	if (index != -1 && path.indexOf(docPath) == 0) {
		// child of FLA dir:
		path = "./"+path.substr(docPath.length);
		if (slash != "/") { path = path.split(slash).join("/"); }
		if (path.charAt(path.length-1) != "/") { path += "/"; }
	}
	
	return path; 
}

function convertUriPath(path) {
	if (path != null && path.indexOf("file://") == 0)
		return FLfile.uriToPlatformPath(path);
	return path;
}

function getLocaleURI() {
	include("Locale");
	return Locale.getLocaleURI(LOCALE_PATH);
}

function openOutputPath() {
	var props = deserialize(loadData())||{};
	if (!canRunExport(props.outputPath)) { return; }
	cleanupProps(props);
	if (!FLfile.exists(props.outputPath)) {
		include("Locale");
		Locale.load(Locale.getLocaleURI(LOCALE_PATH));
		alert(Locale.get("EJS_UI_OUTPUTPATH", props.outputPath));
		return false;
	}
	openDirectory(props.outputPath);
}

function openDirectory(path) {
	if (path.indexOf("file://") == 0) { path = FLfile.uriToPlatformPath(path); }
	if (MAC) {
		FLfile.runCommandLine('open "' + path + '"');
	} else {
		//FLfile.runCommandLine("explorer " + path);
		FLCreateJS.openInBrowser(path);
	}
}

function getDefaultSettings() {
	var str = "";
	if (FLfile.exists(DEFAULT_SETTINGS_PATH)) { str = FLfile.read(DEFAULT_SETTINGS_PATH); }
	str = str.split("\r\n").join("\n").split("\r").join("\n");
	var o = deserialize(str);
	if (!o) {
		include("Locale");
		Locale.load(Locale.getLocaleURI(LOCALE_PATH));
		alert(Locale.get("EJS_UI_DEFAULT_SETTINGS_ERR",getDisplayPath(DEFAULT_SETTINGS_PATH)));
	}
	return str;
}

function canRunExport(path) {
	getDocument();

	if ((!path || path.charAt(0) == ".") && !doc.pathURI) {
		include("Locale");
		Locale.load(Locale.getLocaleURI(LOCALE_PATH));
		alert(Locale.get("EJS_UI_NO_OUTPUTPATH"));
		return false;
	}
	return true;
}

function runExport() {
	getDocument();

	fl.outputPanel.clear();
	deinclude();
	
	include("Locale");
	Locale.load(Locale.getLocaleURI(LOCALE_PATH));
	
	if (doc == null) {
		alert(Locale.get("EJS_UI_NOFLA"));
		return false;
	}
	
	// doc options
	var props = cleanupProps(deserialize(loadData())); // outputPath, imagePath, soundsPath, libraryPath, exportImages, exportSounds, exportTweens, exportHTML, useTime, preview
	fl.logPIPEvent(PIP_NAME, "Publish"+(props.preview?" and Preview":""));

	if (!FLfile.exists(props.outputPath)) {
		alert(Locale.get("EJS_UI_OUTPUTPATH", props.outputPath));
		return false;
	}
	// timeline options
	var timelineProps = deserialize(loadTimelineData());
	if (!timelineProps) props.loop = true;
	else props.loop = timelineProps.loop == "true";
	
	include("Log");
	include("Exporter");
	
	var exporter = Exporter.createInstance(doc, props);
	var result = exporter.run(props.preview);
	
	if (DEBUG) { fl.trace(Log.generateTimeReport()); }
	fl.trace(Log.generateErrorReport(true));
	
	deinclude();
	return result?result:"";
}

function cleanupProps(props) {
	include("utils");
	getDocument();

	var booleanProps = { exportImages:1, exportSounds:1, exportLibs:1, exportTweens:1, exportHTML:1, 
		preview:1, compactPaths:1, includeHiddenLayers:1, autoAtlas:1 };
	var numericProps = { maxPng:1, maxAtlas:1 };
	for (var n in props) {
		if (n in booleanProps) { props[n] = (props[n] == "true" || props[n] == "1"); }
		else if (n in numericProps) { props[n] = parseFloat(props[n]); }
	}
	
	props.outputPath = resolveRelativePath(doc.pathURI, props.outputPath || "./");
	if (props.outputPath != null && props.outputPath.substr(0,5) != "file:")
		props.outputPath = FLfile.platformPathToURI(props.outputPath);
	
	return props;
}

function saveData(data) {
	getDocument();
	if (data == doc.getDataFromDocument(DOC_DATA_NAME)) { return; }
	doc.addDataToDocument(DOC_DATA_NAME, "string", data)
	return "";
}

function loadData() {
	getDocument();
	var data = doc ? doc.getDataFromDocument(DOC_DATA_NAME) : "";
	return data;
}

function loadTimelineData() {
	getDocument();
	var tl = doc && doc.getTimeline();
	if (!tl) { return ""; }
	var item = tl.libraryItem;
	if (item) { data = item.getData(TIMELINE_DATA_NAME); }
	else { data = doc.getDataFromDocument(TIMELINE_DATA_NAME); }
	return data || "";
}

function openSettingsDialog(data) {
	getDocument();

	include("Locale");
	Locale.load(Locale.getLocaleURI(LOCALE_PATH));
	var title = Locale.get("EJS_UI_TITLE_EXPORT_SETTINGS");

	var uri = BASE_PATH+"ui/settingsDialog.xml";
	var xml = 	<dialog title={title} buttons="accept, cancel">
					<flash id="swf" width="650" height="260" src="settingsDialog.swf" />
					<property id="data" value={data}/>
				</dialog>;
	
	FLfile.write(uri, xml.toXMLString());
	var results = doc.xmlPanel(uri);
	data = (results.dismiss == 'accept') ? results.data : "";
	FLfile.remove(uri);
	return data;
}

function saveTimelineData(data) {
	getDocument();
	if (data == this.loadTimelineData()) { return; }
	var tl = doc && doc.getTimeline();
	if (!tl) { return; }
	var item = tl.libraryItem;
	if (item) { item.addData(TIMELINE_DATA_NAME, "string", data); }
	else { doc.addDataToDocument(TIMELINE_DATA_NAME, "string", data); }
	return "";
}

function getOutputPath(path) {

	if (!path) {
		// default path:
		return "./";
	} else if (path.charAt(0) == ".") {
		// already relative path:
		return path;
	}
	else path = convertUriPath(path);
	
	getDocument();
	if (path.charAt(path.length-1) != "/") { path += "/"; }
	var docPath = doc ? doc.pathURI : null;
	if (docPath) {
		if (path.charAt(path.length-1) != "/") { path += "/"; }
		var index = docPath.lastIndexOf("/");
		docPath = docPath.substring(0,index+1);
		if (path.indexOf(docPath) == 0) {
			// child of FLA dir:
			return "./"+path.substr(docPath.length);
		}
	}
	// absolute file path:
	return path;
}

function getDocument() {
	return (doc = fl.getDocumentDOM());
}

function getDocumentID() {
	getDocument();
	if (!doc) { return ""; }
	// pass back the document path first (always unique for saved FLAs) or the doc id for unsaved FLAs
	return doc.pathURI || doc.id;
}

function getThemeColorParameters() {
	return themesSupported ? fl.getThemeColorParameters() : null;
}

function getThemeColor(name) {
	return themesSupported ? fl.getThemeColor(name) : null;
}

function registerEventListeners(panelName) {
	fl.logPIPEvent(PIP_NAME, "Open Dart Panel");
	_panelName = panelName;
	var docChangedID = fl.addEventListener("documentChanged",_onDocumentChanged);
	var docSavedID = fl.addEventListener("documentSaved", _onDocumentSaved);
	var timelineChangedID = fl.addEventListener("timelineChanged", _onTimelineChanged);
	var closeScript = 'fl.removeEventListener("documentSaved", '+docSavedID+');'+
			'fl.removeEventListener("documentChanged", '+docChangedID+');'+
			'fl.removeEventListener("timelineChanged", '+timelineChangedID+');';
	if (themesSupported) {
		var themeChangedID = fl.addEventListener("themeChanged", _onThemeChanged);
		closeScript += 'fl.removeEventListener("themeChanged", '+themeChangedID+');';
	}
	var panel = fl.getSwfPanel(_panelName, false);
	panel.onCloseScript = closeScript;
}

/************************************************************************
PRIVATE METHODS
************************************************************************/
var _panelName;
function _onDocumentChanged() {
	var panel = fl.getSwfPanel(_panelName, false);
	panel&&panel.call("onDocumentChanged");
}

function _onDocumentSaved() {
	var panel = fl.getSwfPanel(_panelName, false);
	panel&&panel.call("onDocumentSaved");
}

function _onTimelineChanged() {
	var panel = fl.getSwfPanel(_panelName, false);
	panel&&panel.call("onTimelineChanged");
}
function _onThemeChanged() {
	var panel = fl.getSwfPanel(_panelName, false);
	panel&&panel.call("onThemeChanged");
}
