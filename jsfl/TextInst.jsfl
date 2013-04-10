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
	
	var str = name+" = new TextField(\""+this.getText(e)+"\"";
	
	var attrs = e.DOMTextRun[0].DOMTextAttrs[0];
	var offset = {x:0,y:0}
	var width = fix(e.@width*1,0);
	if (attrs)
	{
		str += ", new TextFormat("+this.getFont(attrs);
		
		var textAlign = attrs.@alignment;
		if (textAlign[0] && textAlign != "justify" && textAlign != "left") 
			str += ", align:\""+textAlign+"\"";		
		if (e.name() == "DOMStaticText" || e.@lineType != "single") {
			// potentially multiline.
			str += this.getLeading(attrs);
		}		
		str += ')';
		//if (textAlign == "center") { offset.x = width/2; }
		//else if (textAlign == "right") { offset.x = width; }
	}
	str += ')';
	str += exportTransform(e, name, "\n"+t, offset, true);
	str += exportFilters(e.filters.*, name, "\n"+t);
	str += ';'
	
	//if (e.@autoExpand != "true")
	str += "\n"+t+name+".width = "+(width+4)+";";
	
	return str;
}

p.getText = function(e) {
	var textruns = e.DOMTextRun;
	var l = textruns.length();
	var str = "";
	for (var i=0; i<l; i++) {
		str += textruns[i].characters+"";
	}
	return str.split("\"").join("\\\"").split("\r").join("\\n");
}

p.getFont = function(attrs) {
	if (!attrs[0]) { return '"Arial", 12, 0'; }
	var face = attrs.@face+"";	
	var bold = attrs.@bold == "true";
	var italic = attrs.@italic == "true";
	var size = fix(attrs.@size*1||12,0);
	var color = getColor(attrs.@fillColor);
	var str = '"'+face+'", '+size+', '+color;
	if (bold) { str += ", bold:true"; }
	if (italic) { str += ", italic:true"; }
	return str;
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
	o.color = (attrs.@fillColor+"")||"#000000";
	o.textAlign = textAlign;
	o.lineHeight = (attrs.@lineSpacing*1);
	o.lineWidth = fix(e.@width*1,0);
	return o;
}