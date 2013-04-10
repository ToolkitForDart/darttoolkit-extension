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

// GENERAL PURPOSE UTILS:

BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
FILE_SUFFIXES = {"png":1, "jpg":1, "gif":1, "mp3":1, "jpeg":1, "bmp":1};

resolveRelativePath = function(target,path) {
	if (path.substr(0,7) == "file://") { return path; }
	if (path.indexOf("://") != -1) { return null; }

	if (target.substr(target.length-4) == ".xfl") {
		target = target.substring(0,target.lastIndexOf("/"));
	}
	var dir = target.substring(0,target.lastIndexOf("/"));
	if (path.charAt(0) == "/") {
		return dir+path;
	}
	
	while (path.charAt(0) == ".") {
		if (path.substr(0,2) == "./") {
			path = path.substr(2);
		} else if (path.substr(0,3) == "../") {
			path = path.substr(3);
			var index = dir.lastIndexOf("/");
			if (index == -1) { return null; }
			dir = dir.substring(0, index);
		} else {
			return null;
		}
	}
	return dir+"/"+path;
}


extractFileName = function(path, includeSuffix, smart) {
	if (!path) return "#PATHERROR#"
	var index = path.lastIndexOf("/");
	if (index != -1) { path = path.substr(index+1); }
	if (includeSuffix || (index = path.lastIndexOf(".")) == -1) { return path; }
	if (!smart || FILE_SUFFIXES[path.substr(index+1).toLowerCase()]) { path = path.substr(0,index); }
	return path;
}

decomposeMatrix = function(matrix) {
	var o = {};
	
	var Ux = matrix.a;
	var Uy = matrix.b;
	var Vx = matrix.c;
	var Vy = matrix.d;
	
	o.scaleX = Math.sqrt(Ux*Ux + Uy*Uy);
	o.scaleY = Math.sqrt(Vx*Vx + Vy*Vy );
	
	// sign of the matrix determinant will tell us if the space is inverted by a 180 degree skew or not.
	var determinant = Ux*Vy - Uy*Vx;
	if (determinant < 0) {
		// choose y-axis scale as the skewed one.  Unfortunately, its impossible to tell if it originally was the y or x axis that had the negative scale/skew.
		o.scaleY *= -1;
		Vx = -Vx;
		Vy = -Vy;
	}
	
	o.rotation = Math.atan2( Uy, Ux );
	o.x = matrix.tx;
	o.y = matrix.ty;
	
	return o;
}

fix = function(num, dec) {
	if (dec == null) { dec = 1; }
	var m = Math.pow(10,dec);
	return (num*m+0.5|0)/m;
}

limit = function(num, range) {
	if (num > range) { return range; }
	if (num < -range) { return -range; }
	return num;
}

getCSSColor = function(color, alpha) {
	color = color||"#000000";
	if (alpha == null || alpha == 1) {
		return "\""+color+"\"";
	} else {
		var val = parseInt(color.substr(1),16);
		var r = val >> 16 & 0xFF;
		var g = val >> 8 & 0xFF;
		var b = val & 0xFF;
		return "\"rgba("+r+","+g+","+b+","+fix(alpha,3)+")\"";
	}
}

extendRect = function(x,y,width,height,rect) {
	if (!rect) { return {x:x,y:y,width:width,height:height}; }
	var r = rect.x+rect.width, b = rect.y+rect.height;
	if (x<rect.x) { rect.x = x; }
	if (y<rect.y) { rect.y = y; }
	rect.width = (r>x+width) ? r-rect.x : x+width-rect.x;
	rect.height = (b>y+height) ? b-rect.y : y+height-rect.y;
	return rect;
}

getHash = function(str){
	var seed=65521, a=1, b=0, i=0, char;
	while (char = str.charCodeAt(i++)) {
		b=(b+(a=(a+char)%seed))%seed;
	}
	return (b<<16)|a;
}

matrixToString = function(mtx) {
	return "[Matrix a="+mtx.a+" b="+mtx.b+" c="+mtx.c+" d="+mtx.d+" tx="+mtx.tx+" ty="+mtx.ty+"]";
}

copyFile = function(sourceURI, destURI, overwrite) {
	if (FLfile.exists(destURI)) {
		if (!overwrite) { return false; }
		FLfile.remove(destURI);
	}
	return FLfile.copy(sourceURI, destURI);
}