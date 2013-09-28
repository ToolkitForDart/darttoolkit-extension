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
include("SpriteSheetHelper");


/************************************************************************
GLOBAL VARS
************************************************************************/
var CANVAS_ID = "canvas";
var CACHE_PAD = 2; // defines padding amount for bitmap cache bounds
var SYMBOL_PATH = "LIBRARY/";

var IMAGES_VAR = "img";
var LIB_VAR = "lib";
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
	this.exportImages = props.exportImages;
	this.exportSounds = props.exportSounds;
	this.exportHTML = props.exportHTML;
	this.includeHiddenLayers = props.includeHiddenLayers;
	this.compactPaths = props.compactPaths;
	this.frameBounds = props.frameBounds;
	this.webNS = props.webNS;
	this.libNS = props.libNS;
	this.imagesNS = props.imagesNS;
	this.loopTimeline = props.loop;
	this.atlas_enabled = props.autoAtlas;
	this.atlas_maxPng = props.maxPng || 1024;
	this.atlas_maxSize = props.maxAtlas || 2048;
	this.dartImports = [
		'import \'package:stagexl/stagexl.dart\';'
	];
	
	this.docName = extractFileName(doc.name, false);
	this.docSymbolName = getVarName(doc.docClass||this.docName, "__DART_LIB", "Symbol");
	this.bitmaps = [];
	this.sounds = [];
	this.symbols = [];
	this.symbolMap = {};

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
p.exportImages;
p.exportSounds;
p.exportHTML;
p.compactPaths;
p.includeHiddenLayers;
p.useTicks = true;
p.webNS;
p.libNS;
p.imagesNS;
p.loopTimeline;
p.atlas_enabled;
p.atlas_maxPng;
p.atlas_maxSize;

// working data:
p.docName;
p.docSymbolName;
p.dartImports;
p.bitmaps;
p.sounds;
p.symbols;
p.rootSymbol;
p.symbolMap;
p.fps;
p.pubspecFilePath;
p.dartFilePath;
p.dartMainPath;
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
	this.detectProjectPath();
	this.webPath = this.getDirPath(this.webNS, "EJS_E_JSPATH", true);
	this.libPath = this.getDirPath(this.libNS, "EJS_E_JSPATH", true);

	this.hasTweens = this.enableMouseOver = false;
	this.pubspecFilePath = this.projectPath+"pubspec.yaml";
	this.htmlFilePath = this.webPath+"index.html";
	this.dartFilePath = this.webPath+"index.dart";
	this.dartMainPath = this.libPath+this.docName+".dart";
	this.dartLibFilePath = this.libPath+this.docName+"Lib.dart";

	var conflicts = [];
	//if (this.exportHTML && this.fileChangeManager.checkFile(this.htmlFilePath)) conflicts.push("HTML");
	//if (this.exportHTML && this.fileChangeManager.checkFile(this.dartFilePath)) conflicts.push("INDEX");
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
	
	if (this.atlas_enabled)
		this.optimizeMedias();

	this.exportMedia(this.bitmaps, this.webNS+"/"+this.imagesPath, this.exportImages, "EJS_E_IMGPATH");
	this.exportMedia(this.sounds, this.webNS+"/"+this.soundsPath, this.exportSounds, "EJS_E_SNDPATH");

	this.writeDartLib();
	if (!this.fileChangeManager.checkFile(this.dartMainPath)) 
		this.writeDartMain();

	if (this.enableMouseOver && this.bitmaps.length) { Log.warning("EJS_W_BITMAPBTN"); }

	if (this.exportHTML) { 
		if (!this.fileChangeManager.checkFile(this.dartFilePath))
			this.writeDartIndex();
		if (!this.fileChangeManager.checkFile(this.htmlFilePath))
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

p.optimizeMedias = function() {
	var ssh = new SpriteSheetHelper("_atlas_");

	var imgPath = this.getDirPath(this.webNS+"/"+this.imagesPath, "EJS_E_IMGPATH", this.bitmaps.length > 0);

	if (ssh.optimize(this.doc, this.bitmaps, imgPath, this.atlas_maxPng, this.atlas_maxSize))
		this.spritesheets = ssh; 
}

p.validateSettings = function() {
	if (this.imagesPath.charAt(this.imagesPath.length-1) != "/") { this.imagesPath += "/"; }
	if (this.soundsPath.charAt(this.soundsPath.length-1) != "/") { this.soundsPath += "/"; }
	if (this.outputPath.charAt(this.outputPath.length-1) != "/") { this.outputPath += "/"; }
	
	if (!this.libNS) this.libNS = "lib";
	if (!this.webNS) this.webNS = "web";
	
	this.fps = this.doc.frameRate;
}

p.detectProjectPath = function() {

	// use the output path if it's empty or already a Dart project
	var content = getFolderContent(this.outputPath);
	if (!content.length || listContains(content, "pubspec.yaml")) {
		this.projectPath = this.outputPath;
		return;
	}
	// if not, create a sub-directory
	this.projectPath = this.getDirPath(this.docName + "-dart", "EJS_E_JSPATH", true);
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
	var excludedBitmaps = 0;
	for (var i=0,l=bitmaps.length(); i<l; i++) {
		var xml = bitmaps[i];
		var symbol = new BitmapSymbol(xml);
		var sname = ""+xml.@name;
		var name = sname.split("/").pop();
		if (name.charAt(0) == '!') { // excluded
			excludedBitmaps++;
			continue;
		}
		this.addSymbol(sname, xml.@linkageClassName, "Bitmap", symbol);
		this.bitmaps.push(symbol);
	}
	if (excludedBitmaps) 
		Log.warning(excludedBitmaps + " image(s) omitted from export");
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
	if (this.symbolMap[id]) { Log.error("EJS_E_JSXEXPORT","DUPSYMB ("+id+")"); return null; }
	var name = String(linkage) || extractFileName(id, false, true);
	symbol.name = getVarName(name, "__DART_LIB", defaultName);
	
	this.symbols.push(symbol);
	this.symbolMap[id] = symbol;
	
	return symbol;
}

p.getSymbol = function(id) {
	var symbol = this.symbolMap[id];
	if (!symbol) { 
		if (id.charAt(0) != '!') 
			Log.error("EJS_E_JSXEXPORT","NOSYMB ("+id+")"); return null; 
	}
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
	var rel = /*this.webPath;
	if (!rel) rel =*/ this.projectPath;
	if (!rel) rel = this.outputPath;
	var dirPath = resolveRelativePath(rel,path);
	if (dirPath == null) { Log.error(errCode); return null; }
	
	if (dirPath.charAt(dirPath.length-1) != "/") { dirPath += "/"; }
	if (!createDir) { return dirPath; }
	
	FLfile.createFolder(dirPath);
	if (!FLfile.exists(dirPath)) { Log.error(errCode); return null; }
	
	return dirPath;
}

p.writePubSpec = function() {
	Log.time("write pubspec " + this.pubspecFilePath);

	var str =
		 'name: '+this.docName+'\n'
		+'description: '+this.docName+'\n'
		+'dependencies:\n'
		+'  browser: any\n'
		+'  stagexl: any\n'
		+'  meta: any\n';

	if (!FLfile.exists(this.pubspecFilePath))
		FLfile.write(this.pubspecFilePath, str);
	Log.time();
}

p.writeHTML = function() {
	Log.time("write HTML " + this.htmlFilePath);
	var str = 
		 '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">'
		+'\n<title>'+this.docName+'</title>\n</head>'
	
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

	var str = "";

	// set up the manifest for sounds and images:
	if (this.bitmaps.length || this.sounds.length)
	{
		var i;

		//var defIDs = '';
		var resList = '';
		if (this.spritesheets) {
			for(i=0; i<this.spritesheets.sheets.length; i++) {
				var sheet = this.spritesheets.sheets[i];
				if (resList.length) resList += '\n';
				resList += '  ..addTextureAtlas("' + sheet +'", "${basePath}'+this.imagesPath+sheet+'.json", "json")';
			}
		}

		for (i=0; i<this.bitmaps.length; i++) {
			var image = this.bitmaps[i];
			if (image.frame) continue;
			if (resList.length) resList += '\n';
			var IID = image.name;//.toUpperCase();
			//defIDs += 'const String '+IID+' = "'+image.name+'";\n';
			resList += '  ..addBitmapData("'+IID+'", "${basePath}'+this.imagesPath+extractFileName(image.src,true)+'")';
		}
		for (i=0; i<this.sounds.length; i++) {
			var sound = this.sounds[i];
			if (resList.length) resList += '\n';
			var SID = sound.name;//.toUpperCase();
			//defIDs += 'const String '+SID+' = "'+sound.name+'";\n';
			resList += '  ..addSound("'+SID+'", "${basePath}'+this.soundsPath+extractFileName(sound.src,true)+'")';
		}

		str +=
			 '/* ASSETS PRELOADING */\n'
			//+'\n'+defIDs
			+'\nResourceManager resources;\n\n'
			+'ResourceManager initResources([String basePath = ""]) {\n'
			+'  resources = new ResourceManager()\n'
			+resList+';\n'
			+'  return resources;\n'
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

	// add header
	str =
		'library '+this.rootSymbol.name+'Lib;\n'
		+'\n/* WARNING: code generated using the Dart Toolkit for Adobe Flash Professional - do not edit */\n\n'
		+this.dartImports.join('\n')+'\n\n'
		+str;

	// append API filler
	str += '\n\n' + FLfile.read(BASE_PATH+"libs/shapefactory.dart");
	if (this.sounds.length)
		str += '\n\n' + FLfile.read(BASE_PATH+"libs/soundfactory.dart");
		
	FLfile.write(this.dartLibFilePath, str);
	this.fileChangeManager.updateFile(this.dartLibFilePath);
	Log.time();
}

p.writeDartMain = function() {
	Log.time("write main " + this.dartMainPath);
	var str = 
		 'library '+this.rootSymbol.name+';\n'
		+'\n'
		+'import \'dart:html\' as html;\n'
		+'import \'package:stagexl/stagexl.dart\';\n'
		+'import \'$DOCNAMELib.dart\' as lib;\n'
		+'\n'
		+'class $DOCSYMBOL\n'
		+'{\n'
		+'  Stage stage;\n'
		+'  RenderLoop renderLoop;\n'
		+'  $LIB.$DOCSYMBOL exportRoot;\n'
		+'\n'
		+'  $DOCSYMBOL() {\n'
		+'    stage = new Stage("$STAGE", html.document.query("#$STAGE"), '+this.doc.width+', '+this.doc.height+', '+this.fps+');\n'
		+'\n'
		+'    renderLoop = new RenderLoop();\n'
		+'    renderLoop.addStage(stage);\n'
		+'  \n';

	if (this.bitmaps.length || this.sounds.length) 
		str += 
			 '    $LIB.initResources("./")\n'
			+'      ..load().then(_start).catchError(_loadError)\n'
			+'      ..onProgress.listen(_loadProgress);\n'
			+'  }\n'
			+'\n'
			+'  void _loadError(e) {\n'
			+'    print("One or more resource failed to load.");\n'
			+'  }\n'
			+'\n'
			+'  void _loadProgress(e) {\n'
			+'    // total: lib.resources.resources.length\n'
			+'    // loaded: lib.resources.finishedResources.length\n'
			+'  }\n'
			+'\n'
			+'  void _start(result) {\n';

	str += '    exportRoot = new $LIB.$DOCSYMBOL();\n';

	if (!this.loopTimeline && this.symbols[0].movieclip) 
		str += '    exportRoot.loop = false;\n';

	str +=
		 '\n'
		+'    stage.addChild(exportRoot);\n'
		+'  }\n'
		+'}\n';

	str = str.replace("$LIB", this.libNS, "g")
		.replace("$DOCNAME", this.docName, "g")
		.replace("$STAGE", CANVAS_ID, "g")
		.replace("$DOCSYMBOL", this.docSymbolName, "g");

	FLfile.write(this.dartMainPath, str);
	this.fileChangeManager.updateFile(this.dartMainPath);
	Log.time();
}

p.writeDartIndex = function() {
	Log.time("write index " + this.dartFilePath);

	str = 'import \'../lib/$DOCNAME.dart\';\n'
		+ '\n'
		+ 'void main() {\n'
		+ '  new '+this.docSymbolName+'();\n'
		+ '}\n';

	str = str.replace("$DOCNAME", this.docName, "g");

	FLfile.write(this.dartFilePath, str);
	this.fileChangeManager.updateFile(this.dartFilePath);
	Log.time();
}

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

p.addImport = function(decl) {
	if (!decl || !decl.length) return;

	var len = (decl.indexOf(';')+1) || decl.length;
	var comp = decl.substr(0, len);

	for(var i=0; i<this.dartImports.length; i++) {
		var prev = this.dartImports[i];
		if (prev.length >= len && prev.substr(0, len) == comp) 
			return; // duplicated
	}
	this.dartImports.push(decl);
}

