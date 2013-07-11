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

function SpriteSheetHelper(name) { 
	this.sheets = [];
	this.name = name;
}

var p = SpriteSheetHelper.prototype;

p.optimize = function(doc, bitmaps, imagePath, maxPngSize, maxAtlasSize) {
	// all bitmap symbols
	var symbols = this.findBitmapSymbols(doc);

	// match with exported images
	var optimize = this.filterMedias(symbols, bitmaps, maxPngSize);
	if (optimize.length < 3) return false;

	// export spritesheet
	var metas = this.export(optimize, imagePath + this.name, maxAtlasSize);
	if (!metas.length) return false;

	// control that each bitmap has a corresponding frame in the spritesheet
	// so they can be excluded from export
	var count = this.verifyFrames(optimize, metas);

	Log.warning(count + " PNG(s) packed successfully into " + metas.length + " spritesheet(s).");
	return count > 0;
}

p.verifyFrames = function(optimize, metas) {
	var cpt = 0;
	for(var i in metas) {
		var meta = metas[i];
		var json;
		eval("json=" + meta.raw);
		if (!json || !json.frames) continue;

		for(var i in optimize) {
			var obj = optimize[i];
			var id = obj.symbol.name.split("/").pop();
			var frame = json.frames[id];
			if (!frame) continue;
			frame.atlas = meta.sheet;
			frame.name = id.split(".").shift();
			obj.media.frame = frame;
			cpt++;
		}
	}
	return cpt;
}

p.export = function(optimize, out, maxSize) {
	var exp = this.createExporter();
	var index = 0;
	var metas = [];

	for(var i in optimize) {
		var obj = optimize[i];
		exp.addBitmap(obj.symbol);

		if (exp.sheetWidth > maxSize || exp.sheetHeight > maxSize) { // start new spritesheet
			exp.removeBitmap(obj.symbol);
			var meta = this.publish(exp, out + index);
			if (meta) metas.push(meta);
			index++;
			exp = this.createExporter();
			exp.addBitmap(obj.symbol);
		}
	}

	var meta = this.publish(exp, out + index);
	if (meta) metas.push(meta);
	return metas;
}

p.createExporter = function() {
	var exp = new SpriteSheetExporter();
	exp.shapePadding = 2;
	exp.sheetWidth = exp.sheetHeight = 128;
	exp.autoSize = true;
	exp.layoutFormat = "JSON";
	exp.stackDuplicateFrames = false;
	exp.algorithm = "maxRects";
	return exp;
}

p.publish = function(exp, out) {
	var options = { format:"png", bitDepth:32, backgroundColor:"#00000000" };
	var raw = exp.exportSpriteSheet(out, options);

	if (FLfile.exists(out + ".png") && raw && raw.length) {
		FLfile.write(out + ".json", raw);
		var name = out.split("/").pop();
		this.sheets.push(name);
		return { raw:raw, sheet:name };
	}
	else return null;
}


p.filterMedias = function(symbols, medias, maxSize) {
	var found = [];
	var reAtX = /@[0-9.]+x/;
	for (i=0; i<medias.length; i++) {
		var image = medias[i];
		var filename = extractFileName(""+image.xml.@href, true);
		if (/^[_=!-]/.exec(filename)) continue; // ignore image names starting with special chars
		if (filename.split(".").pop() != "png") continue; // only PNGs
		if (reAtX.exec(filename)) continue; // @1x, @2x

		var name = "" + image.xml.@name;
		var item = symbols[name];
		if (item) {
			var width = parseInt(image.xml.@frameRight) / 20;
			var height = parseInt(image.xml.@frameBottom) / 20;
			if (width > maxSize || height > maxSize) continue;
			found.push({
				symbol:item,
				media:image
			});
		}
	}
	return found;
}

p.findBitmapSymbols = function(doc) {
	var lib = doc.library;
	var symbols = {}
	for(var i in lib.items) {
		var item = lib.items[i];
		if (item instanceof BitmapItem) {
			symbols[item.name] = item;
		}
	}
	return symbols;
}

