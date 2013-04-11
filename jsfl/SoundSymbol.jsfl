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

	// TODO do we support loops? would require to link the sound to the MC to be able to stop it eventually.
	// TODO support basic sound envelope for volume
	/*
	<DOMFrame index="73" duration="16" soundEffect="custom" soundName="_SOUND/misc003.wav" soundLoopMode="loop" soundLoop="32767" outPoint44="11520" soundZoomLevel="2">
      <SoundEnvelope>
        <SoundEnvelopePoint level0="8004" level1="7754"/>
      </SoundEnvelope>
      <elements/>
    </DOMFrame>
    */

	// TODO do we support transcoded MP3s in Dart?
	/*var suffix = ".mp3"; 
	var transcoded = this.xml.*[0]; // don't get transcoded .mp3
	var source = transcoded ? transcoded.@href : this.xml.@href;*/

	var source = ""+this.xml.@href;
	var suffix = "."+source.split('.').pop();

	// NOTE: fixAssetName should be removed in future versions:
	this.src = destPath+  fixAssetName(this.name)  +suffix;
	if (exportPath && !copyFile(sourcePath+source, exportPath+  fixAssetName(this.name)  +suffix, true)) {
		Log.error("EJS_E_SNDEXP",this.src);
	}
}

p.isEmpty = function() {
	return true;
}
