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

	var suffix = ".mp3"; 
	var transcoded = this.xml.*[0]; // don't get transcoded .mp3
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
