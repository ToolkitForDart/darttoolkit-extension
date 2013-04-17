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


/************************************************************************
IMPORTS
************************************************************************/

include("utils");
include("exportUtils");

include("FileChangeManager");

include("BitmapSymbol");
include("LayerObj");
include("MaskLayerObj");
include("GuideLayerObj");
include("StateObj");
include("ContainerSymbol");
include("SoundSymbol");

include("SymbolInst");
include("TextInst");
include("ShapeInst");

include("BoundsHelper");


/************************************************************************
GLOBAL VARS
************************************************************************/
//var EASELJS_FILES = ["easeljs-0.6.0.min.js"];
//var TWEENJS_FILES = ["tweenjs-0.4.0.min.js","movieclip-0.6.0.min.js"];
//var SOUNDJS_FILES = ["soundjs-0.4.0.min.js"];
//var PRELOADJS_FILES = ["preloadjs-0.3.0.min.js"];
var CANVAS_ID = "canvas";
//var USE_TICKS_STRING = ",{useTicks:true}";
var CACHE_PAD = 2; // defines padding amount for bitmap cache bounds
var SYMBOL_PATH = "LIBRARY/";
//var CREATEJS_DEFAULT_NS = "createjs";

var CREATEJS_VAR = "cjs";
var IMAGES_VAR = "img";
var LIB_VAR = "lib";
var CREATEJS_VAR_ = CREATEJS_VAR+".";
var IMAGES_VAR_ = IMAGES_VAR+".";
var LIB_VAR_ = LIB_VAR+".";

var JSX_HANDLED_ERROR_CODES = {
	// maps JSX error codes to locale values.
	kFLMInverseKinematicsNotSupported: "EJS_W_F_IK",
	kFLMCompiledClipNotSupported: "EJS_W_F_COMPILED",
	kFLMEmbeddedVideoNotSupported: "EJS_W_F_VIDEO",
	kFLMComponentNotSupported: "EJS_W_F_COMPONENT",
	kFLMMotionTweenSimplificationFailed: "EJS_W_MOTIONTWEEN",
	kFLMVideoNotSupported: "EJS_W_F_VIDEO",
	kFLMMultiFrameSymbolInMaskNotSupported: "EJS_W_F_MASKSYMBOL"
}

var JSX_IGNORED_ERROR_CODES = {
	// errors that will not be reported as an unhandled error.
	// 1 = not applicable
	kFLMTLFInlineLinkedNotSupported: 1,
	kFLMVerticalTextNotSupported: 1,
	kFLMTLFAttributeNotSupported: 1,
	kFLMClassicTextAttributeNotSupported: 1,
	kFLMActionScriptVersionNotSupported: 1, // no /* js comment.
	kFLMSoundNotSupported: 1,
	kFLMBitmapAssetNotFound: 1,
	kFLMMultiFrameSymbolInMaskNotSupported: 1, // movieclips in masks.

	// 2 = handled elsewhere
	kFLMScale9NotSupported: 2,
	kFLM3DNotSupported: 2,
	kFLMBlendModeNotSupported: 2,
	kFLMFilterTypeNotSupported: 2,
	kFLMStrokeTypeNotSupported: 2,
	kFLMBlendModeNotSupported: 2
}

/************************************************************************
EXPORTER CLASS
************************************************************************/
Exporter = function(doc, props) {
	this.doc = doc;
	this.outputPath = props.outputPath;
	this.imagesPath = props.imagesPath;
	this.soundsPath = props.soundsPath;
	//this.libraryPath = props.libraryPath;
	this.exportImages = props.exportImages;
	this.exportSounds = props.exportSounds;
	//this.exportLibs = props.exportLibs;
	this.exportHTML = props.exportHTML;
	this.includeHiddenLayers = props.includeHiddenLayers;
	this.compactPaths = props.compactPaths;
	//this.hostedLibs = props.hostedLibs && HOSTED_LIBS_ENABLED;
	this.frameBounds = props.frameBounds;
	this.libNS = props.libNS;
	this.imagesNS = props.imagesNS;
	//this.createjsNS = props.createjsNS;
	this.loopTimeline = props.loop;

	/*for(var p in props)
		fl.trace(p +"=" + props[p]);
	return;*/

	//if (this.hostedLibs) { this.libraryPath = HOSTED_LIB_PATH; }
	
	this.docName = extractFileName(doc.name, false);
	this.docSymbolName = getVarName(doc.docClass||this.docName, "__DART_LIB", "Symbol");
	this.bitmaps = [];
	this.sounds = [];
	this.symbols = [];
	this.symbolMap = {};
	//this.dartFiles = EASELJS_FILES;

	this.projectPath = this.getDirPath(this.docName + "-dart", "EJS_E_JSPATH", true);
	this.webPath = this.getDirPath("web", "EJS_E_JSPATH", true);
	
	this.fileChangeManager = new FileChangeManager(CHANGE_LOG_PATH);
}
var p = Exporter.prototype;

Exporter.instance;
Exporter.createInstance = function(doc, props) {
	return Exporter.instance = new Exporter(doc, props);
}

Exporter.EXPORT_INVISIBLE = 0x00400000;
Exporter.VERBOSE_PATHS = 0x01000000;
Exporter.OVERRIDE_INVISIBLE = 0x00200000;
Exporter.EXCLUDE_XML_NS = 0x02000000;

// settings:
p.doc;
p.outputPath;
p.projectPath;
p.webPath;
p.imagesPath;
p.soundsPath;
//p.libraryPath;
p.exportImages;
//p.exportLibs;
p.exportSounds;
p.exportHTML;
p.compactPaths;
p.includeHiddenLayers;
p.useTicks = true;
//p.hostedLibs;
//p.frameBounds;
p.libNS;
p.imagesNS;
//p.createjsNS;
p.libNS_dot;
p.imagesNS_dot;
//p.createjsNS_dot;
p.loopTimeline;

// working data:
p.docName;
p.docSymbolName;
p.bitmaps;
p.sounds;
p.symbols;
p.rootSymbol;
p.symbolMap;
p.dartFiles;
p.fps;
p.pubspecFilePath;
p.dartFilePath;
p.dartLibFilePath;
p.htmlFilePath;
p.fileChangeManager;
p.hasTweens;
p.xmlPath;
p.xml;
p.boundsHash;
p.enableMouseOver;
p.includeMotionGuidePlugin;

p.run = function(preview) {

	Log.clear();
	
	if (!FLCreateJS) {
		Log.error("EJS_E_FLCREATEJS");
		return false;
	}

	Log.time("run export");
	this.validateSettings();
	this.hasTweens = this.enableMouseOver = false;
	this.pubspecFilePath = this.projectPath+"pubspec.yaml";
	this.htmlFilePath = this.webPath+"index.html";
	this.dartFilePath = this.webPath+"index.dart";
	this.dartLibFilePath = this.getDirPath(this.libNS, "EJS_E_JSPATH", true)+this.docName+".dart";

	var conflicts = [];
	if (this.exportHTML && this.fileChangeManager.checkFile(this.htmlFilePath)) conflicts.push("HTML");
	if (this.exportHTML && this.fileChangeManager.checkFile(this.dartFilePath)) conflicts.push("INDEX");
	if (this.fileChangeManager.checkFile(this.dartLibFilePath)) conflicts.push("LIB");
	if (conflicts.length && !confirm(Locale.get("EJS_UI_"+conflicts.join("")+"MOD"))) { return; }
	
	Log.time("save as copy");
	var flaURI = fl.configURI+"DartJS/.TMP.fla";
	if (FLfile.exists(flaURI)) { FLfile.remove(flaURI); }
	doc.saveAsCopy(flaURI);
	Log.time();
	
	Log.time("JSX export");
	var platformPath = FLfile.uriToPlatformPath(flaURI);
	var opts = (this.includeHiddenLayers*Exporter.EXPORT_INVISIBLE)|(!this.compactPaths*Exporter.VERBOSE_PATHS);
	opts = opts | Exporter.EXCLUDE_XML_NS | Exporter.OVERRIDE_INVISIBLE;
	fl.trace(Locale.get("EJS_E_JSXEXPORT","JSX"));
	var outputPath = FLCreateJS.convertToJSX(platformPath, opts, 8);
	if (!DEBUG) { fl.outputPanel.clear(); }
	if (!outputPath) { return false; }
	
	outputPath = FLfile.platformPathToURI(outputPath)+"/";
	if (!FLfile.exists(outputPath+MAIN_XML_PATH)) { alert(Locale.get("EJS_E_JSXEXPORT", "write")); return false; }
	this.xmlPath = outputPath;
	Log.time();
	
	Log.time("read & constitute main XML");
	this.xml = this.loadXML(outputPath+MAIN_XML_PATH);
	if (!this.xml) { alert(Locale.get("EJS_E_JSXEXPORT", "read")); return false; }
	Log.time();
	
	this.getBounds();
	this.readLibrary();
	this.readStage();
	this.writePubSpec();
	
	this.exportMedia(this.bitmaps, this.libNS+"/"+this.imagesPath, this.exportImages, "EJS_E_IMGPATH");
	this.exportMedia(this.sounds, this.libNS+"/"+this.soundsPath, this.exportSounds, "EJS_E_SNDPATH");

	this.writeDartLib();

	//if (this.hasTweens) { this.dartFiles = this.dartFiles.concat(TWEENJS_FILES); }
	//if (this.sounds.length || this.bitmaps.length) { this.dartFiles = this.dartFiles.concat(PRELOADJS_FILES); }
	//if (this.sounds.length) { this.dartFiles = this.dartFiles.concat(SOUNDJS_FILES); }
	
	if (this.enableMouseOver && this.bitmaps.length) { Log.warning("EJS_W_BITMAPBTN"); }

	//if (this.exportLibs && !this.hostedLibs) { this.copyJsFiles(); }
	if (this.exportHTML) { 
		this.writeDartIndex();
		this.writeHTML(); 
	}
	
	this.readErrors();

	Log.time("clean up");
	FLfile.remove(flaURI);
	if (!DEBUG) { FLfile.remove(outputPath); }
	else if (preview) { openDirectory(outputPath); }
	Log.time();
	
	Log.time(); // "run export"
	return preview; //&&this.preview();
}

p.validateSettings = function() {
	if (this.imagesPath.charAt(this.imagesPath.length-1) != "/") { this.imagesPath += "/"; }
	if (this.soundsPath.charAt(this.soundsPath.length-1) != "/") { this.soundsPath += "/"; }
	//if (this.libraryPath.charAt(this.libraryPath.length-1) != "/") { this.libraryPath += "/"; }
	if (this.outputPath.charAt(this.outputPath.length-1) != "/") { this.outputPath += "/"; }
	
	if (!this.libNS) this.libNS = "lib";
	this.libNS_dot = this.libNS?this.libNS+".":"";
	this.imagesNS_dot = this.imagesNS?this.imagesNS+".":"";
	//this.createjsNS_dot = this.createjsNS?this.createjsNS+".":"";
	
	this.fps = this.doc.frameRate;
}

p.loadXML = function(path) {
	if (!FLfile.exists(path)) { return null; }
	var str = FLfile.read(path);
	var xml = XML(str);
	return xml;
}

p.checkForFileUpdates = function(path, date) {
	if (FLfile.exists(path)) {
		if (date == null || date == 0) { return true; } // file exists, but wasn't written by panel
		if (parseInt(FLfile.getModificationDate(path),16) > date) { return true; } // file has been updated
	}
	return false;
}

p.preview = function() {
	Log.time("preview");
	var path = FLfile.uriToPlatformPath(this.htmlFilePath);
	if (!FLfile.exists(this.htmlFilePath)) {
		 alert(Locale.get("EJS_UI_HTMLMISSING",path));
		 return;
	}
	
	if (MAC) {
		FLfile.runCommandLine('open "'+path+'"');
	} else {
		//FLfile.runCommandLine('start "Open With Default Application" "'+path+'" /B');
		FLCreateJS.openFolder(path);
	}
	
	
	Log.time();
	return "";
}

p.getBounds = function() {
	Log.time("getBounds");
	this.boundsHash = {};
	var boundsHelper = new BoundsHelper(this.doc, this.frameBounds, this.includeHiddenLayers);

	// get symbol bounds:
	var symbols = this.xml.Include;
	for (var i=0,l=symbols.length(); i<l; i++) {
		var name = symbols[l-i-1].@itemID; // thought going backwards would reduce copies to the scratch FLA, but there is no appreciable perf difference.
		if (!this.doc.library.itemExists(name)) { // both checks, because find will return partial matches
			Log.error("EJS_E_JSXEXPORT","MISSINGSYMB ("+name+")");
			continue;
		}
		this.boundsHash[name] = boundsHelper.getSymbolBounds(name, true);
	}

	// get stage bounds:
	this.boundsHash[".scene0"] = boundsHelper.getTimelineBounds(this.doc.timelines[0], true, this.doc.width/2, this.doc.height/2);

	boundsHelper.cleanup();
	Log.time();
}

p.setBounds = function(symbol, name) {
	var o = this.boundsHash[name];
	if (!o) { return; }
	symbol.rect = o.rect;
	if (!o.bounds) { return; }

	// assemble the nominalBounds and frameBounds strings:
	var bounds = o.bounds;
	symbol.nominalBounds = (this.frameBounds ? "rect = " : "")+bounds[0];
	if (this.frameBounds) {
		bounds[0] = "rect";
		symbol.frameBounds = "["+bounds.join(", ")+"]";
	}
}

p.readStage = function() { 
	Log.time("read stage");
	// TODO: support for multiple scenes? What do we name them??
	if (this.xml.DOMTimeline.length() > 1) { Log.warning("EJS_W_F_SCENE"); }
	var data = deserialize(this.xml.persistentData.PD.(@n == TIMELINE_DATA_NAME).@v.toString())||{};
	var symbol = new ContainerSymbol(this.xml.DOMTimeline[0], true, data);
	this.setBounds(symbol, ".scene0");
	symbol.name = this.docSymbolName;
	this.symbols.unshift(symbol);
	this.rootSymbol = symbol;
	Log.time();
}

p.readLibrary = function() {
	Log.time("read library");
	// check for unsupported content:
	if (this.xml.DOMVideoItem.length()) { Log.warning("EJS_W_F_VIDEO"); }
	if (this.xml.fonts.DOMFontItem[0]) { Log.warning("EJS_W_F_EMBEDFONT"); }

	this.readBitmaps();
	this.readSounds();
	this.readMovieClips();
	Log.time();
}

p.readBitmaps = function() {
	var bitmaps = this.xml.DOMBitmapItem;
	for (var i=0,l=bitmaps.length(); i<l; i++) {
		var xml = bitmaps[i];
		var symbol = new BitmapSymbol(xml);
		this.addSymbol(xml.@name, xml.@linkageClassName, "Bitmap", symbol);
		this.bitmaps.push(symbol);
	}
}

p.readSounds = function() {
	var sounds = this.xml.DOMSoundItem;
	for (var i=0,l=sounds.length(); i<l; i++) {
		var xml = sounds[i];
		var symbol = new SoundSymbol(xml);
		this.addSymbol(xml.@name, xml.@linkageClassName, "Sound", symbol);
		this.sounds.push(symbol);
	}
}

p.readMovieClips = function() {
	var symbols = this.xml.Include;
	for (var i=0,l=symbols.length(); i<l; i++) {
		this.loadMovieClipXML(this.xmlPath+SYMBOL_PATH+symbols[i].@href);
	}
}

p.loadMovieClipXML = function(path) {
	path = this.decodePath(path);
	var xml = this.loadXML(path);
	if (xml && xml.DOMTimeline.length()) { this.exportMovieClip(xml); }
}

p.decodePath = function(path) {
	var chars = {};
	chars["<"] = "&lt;";
	chars[">"] = "&gt;";
	for (var n in chars) {
		path = path.replace(n, chars[n]);
	}
	return path;
}

p.exportMovieClip = function(xml) {
	Log.time("read movieclip ("+xml.@name+")");
	
	// movieclip
	//if (xml.@symbolType == "button") { Log.warning("EJS_W_BUTTON"); }
	if (String(xml.@scaleGridLeft)) { Log.warning("EJS_W_F_SCALE9"); }
	var data = deserialize(xml.persistentData.PD.(@n == TIMELINE_DATA_NAME).@v.toString())||{};
	var symbol = new ContainerSymbol(xml.DOMTimeline[0], false, data);
	symbol.read();
	this.setBounds(symbol, xml.@name);
	this.addSymbol(xml.@name, xml.@linkageClassName, "Symbol", symbol);
	
	Log.time();
	return symbol;
}

p.addSymbol = function(id, linkage, defaultName, symbol) {
	if (this.symbolMap[id]) { Log.error("EJS_E_JSXEXPORT","DUPSYMB ("+id+")"); return; }
	var name = String(linkage) || extractFileName(id, false, true);
	symbol.name = getVarName(name, "__DART_LIB", defaultName);
	
	this.symbols.push(symbol);
	this.symbolMap[id] = symbol;
	
	return symbol;
}

p.getSymbol = function(id) {
	var symbol = this.symbolMap[id];
	if (!symbol) { Log.error("EJS_E_JSXEXPORT","NOSYMB ("+id+")"); return; }
	return symbol;
}

p.exportMedia = function(symbols,destPath,exportFiles,errCode) {
	Log.time("export media " + destPath);
	var l = symbols.length;
	
	// only create the directory if we are exporting the files:
	var exportPath = exportFiles ? this.getDirPath(destPath,errCode,l>0) : "";
	
	for (var i=0; i<l; i++) {
		symbols[i].exportFile(this.xmlPath+SYMBOL_PATH, destPath, exportPath);
	}
	Log.time();
}

p.getDirPath = function(path,errCode, createDir) {
	var rel = this.webPath;
	if (!rel) rel = this.projectPath;
	if (!rel) rel = this.outputPath;
	var dirPath = resolveRelativePath(rel,path);
	if (dirPath == null) { Log.error(errCode); return; }
	
	if (dirPath.charAt(dirPath.length-1) != "/") { dirPath += "/"; }
	if (!createDir) { return dirPath; }
	
	FLfile.createFolder(dirPath);
	if (!FLfile.exists(dirPath)) { Log.error(errCode); return; }
	
	return dirPath;
}

p.writePubSpec = function() {
	Log.time("write pubspec " + this.pubspecFilePath);

	var str =
		 'name: '+this.docName+'\n'
		+'description: Dart StageXL export from '+this.docName+'\n'
		+'dependencies:\n'
		+'  browser: any\n'
		//+'  stagexl: any\n'
		+'  stagexl:\n'
		+'    git: https://github.com/bp74/StageXL.git\n'
		+'  meta: any\n';

	if (!FLfile.exists(this.pubspecFilePath))
		FLfile.write(this.pubspecFilePath, str);
	Log.time();
}

p.writeHTML = function() {
	Log.time("write HTML " + this.htmlFilePath);
	var str = 
		 '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">'
		+'\n<title>Dart StageXL export from '+this.docName+'</title>\n</head>'
	
	// write the body:
		+'\n\n<body style="background-color:#D4D4D4">'
		+'\n\t<canvas id="'+CANVAS_ID+'" width="'+this.doc.width+'" height="'+this.doc.height+'" style="background-color:'+this.doc.backgroundColor+'"></canvas>'
		+'\n\n\t<script type="application/dart" src="index.dart"></script>'
    	+'\n\t<script src="packages/browser/dart.js"></script>'
		+"\n</body>\n</html>";
	
	FLfile.write(this.htmlFilePath, str);
	this.fileChangeManager.updateFile(this.htmlFilePath);
	Log.time();
}

p.writeDartLib = function() {
	Log.time("write library " + this.dartLibFilePath);

	var str =
		'library '+this.rootSymbol.name+';\n'
		+'\n/* Code generated using the Dart Toolkit for Adobe Flash Pro */\n\n'
		+'import \'dart:html\' as html;\n'
		+'import \'dart:async\';\n'
		+'import \'dart:math\';\n'
		+'import \'package:stagexl/stagexl.dart\';\n\n';

	// set up the manifest for sounds and images:
	if (this.bitmaps.length || this.sounds.length)
	{
		//var defIDs = '';
		var resList = '';
		for (i=0; i<this.bitmaps.length; i++) {
			if (resList.length) resList += '\n';
			var image = this.bitmaps[i];
			var IID = image.name;//.toUpperCase();
			//defIDs += 'const String '+IID+' = "'+image.name+'";\n';
			resList += '  ..addBitmapData("'+IID+'", "${basePath}'+this.imagesPath+extractFileName(image.src,true)+'")';
		}
		for (i=0; i<this.sounds.length; i++) {
			if (resList.length) resList += '\n';
			var sound = this.sounds[i];
			var SID = sound.name;//.toUpperCase();
			//defIDs += 'const String '+SID+' = "'+sound.name+'";\n';
			resList += '  ..addSound("'+SID+'", "${basePath}'+this.soundsPath+extractFileName(sound.src,true)+'")';
		}

		str +=
			 '/* ASSETS PRELOADING */\n'
			//+'\n'+defIDs
			+'\nResourceManager resources;\n\n'
			+'Future loadResources([String basePath = ""]) {\n'
			+'  resources = new ResourceManager()\n'
			+resList+';\n'
			+'  return resources.load();\n'
			+'}\n\n';
	}

	str += '/* STAGE CONTENT */\n\n'

	// use .length, because we may be adding symbols as we write, though this is very unlikely with JSX:
	for (var i=0; i<this.symbols.length; i++) {
		if (i == 1) { str += "\n\n/* LIBRARY */\n\n"; }
		var symbol = this.symbols[i];
		if (symbol instanceof SoundSymbol) { continue; }
		if (symbol.isEmpty()) { Log.warning("EJS_E_EMPTYSYMBOL",symbol.name); }
		Log.time("write symbol ("+symbol.name+")");
		str += (i>1?"\n":"")+symbol.toString("");
		Log.time();
	}

	// include API filler
	str += '\n\n' + FLfile.read(BASE_PATH+"libs/shapefactory.dart");
	if (this.sounds.length)
		str += '\n\n' + FLfile.read(BASE_PATH+"libs/soundfactory.dart");
		
	FLfile.write(this.dartLibFilePath, str);
	this.fileChangeManager.updateFile(this.dartLibFilePath);
	Log.time();
}

p.writeDartIndex = function() {
	Log.time("write index " + this.dartFilePath);
	var str = 
		 'library '+this.rootSymbol.name+';\n'
		+'\n'
		+'import \'dart:html\' as html;\n'
		+'import \'package:stagexl/stagexl.dart\';\n'
		+'import \'$LIB/$DOCNAME.dart\' as lib;\n'
		+'\n'
		+'Stage stage;\n'
		+'RenderLoop renderLoop;\n'
		+'$LIB.$DOCSYMBOL exportRoot;\n'
		+'\n'
		+'void main() {\n'
		+'  stage = new Stage("$STAGE", html.document.query("#$STAGE"));\n'
		+'  stage.frameRate = '+this.fps+';\n'
		+'\n'
		+'  renderLoop = new RenderLoop();\n'
		+'  renderLoop.addStage(stage);\n'
		+'  \n';

	if (this.bitmaps.length || this.sounds.length) 
		str += '  $LIB.loadResources("$LIB/").then(start)\n'
			+'    .catchError((e) => print(e.error));\n'
			+'}\n'
			+'\n'
			+'void start(result) {\n';

	str += '  exportRoot = new $LIB.$DOCSYMBOL();\n';

	if (!this.loopTimeline && this.symbols[0].movieclip) 
		str += '  exportRoot.loop = false;\n';

	str +=
		 '\n'
		+'  stage.addChild(exportRoot);\n'
		+'}';

	str = str.replace("$LIB", this.libNS, "g")
		.replace("$DOCNAME", this.docName, "g")
		.replace("$STAGE", CANVAS_ID, "g")
		.replace("$DOCSYMBOL", this.docSymbolName, "g");

	FLfile.write(this.dartFilePath, str);
	this.fileChangeManager.updateFile(this.dartFilePath);
	Log.time();
}

p.getNSStr = function(ns) {
	if (!ns) { return "this"; }
	return ns+" = "+ns+"||{}";
}

/*p.copyJSFiles = function() {
	Log.time("copy js files");
	var l = this.dartFiles.length;
	var jsPath = this.getDirPath(this.libraryPath,"EJS_E_JSPATH",l>0);
	if (!jsPath) { return; }
	
	for (var i=0; i<l; i++) {
		var file = this.dartFiles[i];
		var destURI = jsPath+file;
		
		if (!FLfile.exists(JS_LIB_PATH+file)) {
			Log.error("EJS_E_LIBMISSING",FLfile.uriToPlatformPath(JS_LIB_PATH+file));
			continue;
		} else if (FLfile.exists(destURI)) {
			FLfile.remove(destURI);
		}
		
		FLfile.copy(JS_LIB_PATH+file, destURI);
	}
	Log.time();
}*/

p.readErrors = function() {
	var path = this.xmlPath+"errors.xml";
	var xml = this.loadXML(path);
	var errors = xml && xml.warning.error+xml.error.error;
	if (!errors) { return; }

	for (var i=0,l=errors.length(); i<l; i++) {
		var id = errors[i].@errorid;
		var errCode = JSX_HANDLED_ERROR_CODES[id];
		if (errCode) {
			Log.warning(errCode);
		} else if (!JSX_IGNORED_ERROR_CODES[id]) {
			Log.error("EJS_E_JSXEXPORT",id);
		}
	}
}
