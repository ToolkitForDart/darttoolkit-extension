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

TextInst = function(xml, name) {
	this.xml = xml;
	this.name = name;
	
	Log.warning("EJS_W_TEXT");
}
var p = TextInst.prototype;

p.xml;
p.name;

p.toString = function(t,scope) {
	var e = this.xml;
	var name = (scope?scope+".":"")+this.name;
	
	if (e.name() != "DOMDynamicText") { Log.warning("EJS_W_TEXTFIELD"); }
	
	var text = this.getText(e);
	var str = name+" = new TextField(\""+text+"\"";

	var attrs = e.DOMTextRun[0].DOMTextAttrs[0];
	var offset = {x:0,y:0}
	var size = fix(attrs.@size*1||12,0);
	var padLeft = fix(e.@left*1,0);
	var padTop = fix(e.@top*1,0);
	var width = fix(e.@width*1,0) + padLeft*2;
	var height = fix(e.@height*1,0) + padTop*2;
	var multiline = false;
	var wordWrap = false;
	var autoSize = e.@autoExpand == "true";
	if (attrs)
	{
		str += ", \n"+t+"  new TextFormat("+this.getStyle(attrs);
		
		var textAlign = attrs.@alignment;
		if (textAlign[0] && textAlign != "justify" && textAlign != "left") 
			str += ", align:\""+textAlign+"\"";		

		var textType = e.name();
		var lineType = e.@lineType;
		if (textType == "DOMStaticText" || lineType != "single") {

			str += this.getLeading(attrs);

			if (textType == "DOMStaticText") {
				multiline = (!autoSize || text.split("\\n").length > 1);
				if (!autoSize && multiline) wordWrap = true;
			}
			else {
				multiline = true;
				wordWrap = lineType != "multiline no wrap";
			}
		}
		var leftMargin = fix(attrs.@leftMargin*1 + padLeft);
		//str += ", topMargin:" + padTop;
		str += ", leftMargin:" + leftMargin;
		str += ')';
	}
	str += ')';
	str += exportTransform(e, name, "\n"+t, offset, true);
	str += exportFilters(e.filters.*, name, "\n"+t);
	
	str += "\n"+t+"..width = "+(width);
	str += "\n"+t+"..height = "+(height);
	if (multiline) str += "\n"+t+"..multiline = true";
	if (wordWrap) str += "\n"+t+"..wordWrap = true";
	if (autoSize) str += "\n"+t+"..autoSize = 'left'";
	str += ';'
	
	return str;
}

p.getText = function(e) {
	var textruns = e.DOMTextRun;
	var l = textruns.length();
	var str = "";
	for (var i=0; i<l; i++) {
		str += textruns[i].characters+"";
	}
	return str.split("\"").join("\\\"").split("\r").join("\\n").split("$").join("\\$");
}

p.getStyle = function(attrs) {
	if (!attrs[0]) { return '"Arial", 12, 0'; }
	var face = this.getFont(attrs);	
	var bold = attrs.@bold == "true";
	var italic = attrs.@italic == "true";
	var size = fix(attrs.@size*1||12,0);
	var color = getColor(attrs.@fillColor);
	var str = '"'+face+'", '+size+', '+color;
	if (bold) { str += ", bold:true"; }
	if (italic) { str += ", italic:true"; }
	return str;
}

p.getFont = function(attrs) {
	if (!attrs[0]) { return 'Arial'; }
	return attrs.@face+"";
}

p.getLeading = function(attrs) {
	var leading = fix(attrs.@lineSpacing*1,0) - fix(attrs.@size*1||12,0);
	if (leading) return ", leading:"+leading;
	else return "";
}

p.stripEnd = function(str, end) {
	if (str.lastIndexOf(end) == str.length-end.length) {
		return str.substring(0, str.length-end.length);
	}
	return str;
}

p.isEmpty = function() {
	return false;
}

p.getProps = function(e) {
	if (!e) { e = this.xml; }
	var attrs = e.DOMTextRun[0].DOMTextAttrs;
	
	var textAlign = attrs.@alignment+"";

	var offset = {x:0,y:0}
	if (textAlign == "center") { offset.x = e.@width*1/2; }
	else if (textAlign == "right") { offset.x = e.@width*1; }
	var o = getElementTransform(e, offset, true);

	o.text = this.getText(e);
	o.font = this.getFont(attrs);
	o.textColor = getColor(attrs.@fillColor+"");
	o.textAlign = textAlign;
	o.leading = (attrs.@lineSpacing*1) - fix(attrs.@size*1||12,0);
	o.width = fix(e.@width*1,0) + 4;
	return o;
}
