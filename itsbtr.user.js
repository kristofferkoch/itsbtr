// ==UserScript==
// @name           itsbtr
// @namespace      http://koch.dns6.org
// @description    Viser en nedstrippet versjon av it's learning med direkte tilgang til filene
// @copyright      2009, Kristoffer Ellersgaard Koch
// @version        0.0.2
// @license        GPL version 3 or any later version; http://www.gnu.org/licenses/gpl-3.0.html
// @include        https://www.itslearning.com/main.aspx?starturl=main/mainmenu.aspx
// ==/UserScript==

// Function for swapping out a DOM object
var swap = function (newDom, oldDom) {
	if (oldDom.parentNode) {
		oldDom.parentNode.replaceChild(newDom, oldDom);
	} else {
		GM_log("dom dont have parent: "+oldDom);
	}
};

// Crude test for arrays
function isArray(testObject) {   
    return testObject && typeof testObject === 'object' && typeof testObject.length === 'number';
}

var txt = document.createTextNode;
var create = function (type, content) {
	var e = document.createElement(type);
	var i;
	
	if (typeof content === "string") {
		e.appendChild(txt(content));
	} else if (isArray(content)) {
		for(i=0;i<content.length;i++) {
			e.appendChild(content[i]);
		}
	} else if (e.appendChild) {
		e.appendChild(content);
	} else {
		GM_log("not a dom element: "+e);
	}
	return e;
};

// some crude rippoffs from MochiKit
var DIV = function(c) { return create("div", c); };
var H1 = function(c) { return create("h1", c); };
var P = function(c) { return create("p", c); };
var UL = function(c) { return create("ul", c); };
var LI = function(c) { return create("li", c); };
var SPAN = function(c) { return create("SPAN", c); };
var A = function(href, c) { 
	var r = create("a", c);
	r.href = href;
	return r;
};
var IMG = function(src) {
	var r = create("img", "");
	r.src = src;
	return r;
};

// For generating multipart-strings for POSTing
var encodeObject = function(obj) {
	var ret = "";
	for (var k in obj) {
		ret += k+"="+encodeURIComponent(obj[k])+"&";
	}
	ret = ret.substr(0, ret.length-1);
	return ret;
};

// Some icons used
var icons = {
	// loading image gotten from http://commons.wikimedia.org/wiki/File:Loading.gif under CC licence
	loading: "data:image/gif;base64,R0lGODlhEgASAMQaAHl5d66urMXFw3l5dpSUk5WVlKOjoq%2BvrsbGw6Sko7u7uaWlpbm5t3h4doiIhtLSz4aGhJaWlsbGxNHRzrCwr5SUkqKiobq6uNHRz4eHhf%2F%2F%2FwAAAAAAAAAAAAAAAAAAACH%2FC05FVFNDQVBFMi4wAwEAAAAh%2BQQFCgAaACwAAAAAEgASAAAFaqAmjmRplstyrkmbrCNFaUZtaFF0HvyhWRZNYVgwBY4BEmFJOB1NlYpJoYBpHI7RZXtZZb4ZEbd7AodFDIYVAjFJJCYA4ISoI0hyuUnAF2geDxoDgwMnfBoYiRgaDQ1WiIqPJBMTkpYaIQAAIfkEBQoAGgAsAQABABAAEAAABWSgJo4aRZEoeaxHOiqKFsyBtizopV9ynfwJ0o43MhgNKAYjZbGQJBLXKBLRIK4IaWFbEHgFUoKYoPFKRZUK6fFIORwojBxDytgzpDkdANDc8SQTExp8fBoQEGcDiwNnJA0NLiEAACH5BAUKABoALAEAAQAQABAAAAVloCaOmqKQKHmtVzpKksa2FIUiOKIxjHb8B5JgKCAFjgHUMHUkPR6u0WKhwVgx0YQ2ccW6DGCDZjKJiiwWEgCQikRQ6zWpQC%2BQBviBxuHQEP4EKA0NGhmGGRoVFWaHiGYjEBAuIQAAIfkEBQoAGgAsAQABABAAEAAABWSgJo6aJJEoiaxIOj6PJsyCpigopmNyff0X0o43AgZJk0mKwSABAK4RhaJ5PqOH7GHAHUQD4ICm0YiKwCSHI7VYoDLwDClBT5Di8khEY%2BgbUBAQGgWEBRoWFmYEiwRmJBUVLiEAACH5BAUKABoALAEAAQAQABAAAAVloCaO2vOQKImtWDoCgMa2koTCsDZNGuIjpIFwQBIYBahGI2UkORyukUKhyVgz0Yv2csW6thcNBBIVMRikSCRFoaAK8ALpQD%2BQCHiCZrHQBP4BKBUVGgmGCX6BUQaMBmUkFhYuIQAAIfkEBQoAGgAsAQABABAAEAAABWagJo4aAJAoaZrp6DjaIA%2Fa86BZnmlNo2FADEm3GwWFJAgkNZmQIpHWSCLRFK4FKWKLIHgJUoFYoKlUpCIxabFIKRSohDxButgvJIPeoKFQNHd4JBYWGgeHBxoMDGgBjgFoJI4tIQAAIfkEBQoAGgAsAQABABAAEAAABWSgJo6a45Aoma1ZOkaRxrYAgBZ4oUGQVtckgpBAGhgHqEol1WiQFgvX6PHQJK4JKWaLMXgNWq7GYpGKJhMShZKSSFCH%2BIGEqCNIgXxAo1BoBIACKHkaF4YXf4JSh4hmIwwMLiEAACH5BAUKABoALAEAAQAQABAAAAVloCaOWhSRKFmsRToui0bMhOY4aKInWlVpmWCGZCgaSMIhyWJJQSAkCsU1AgA0h%2ByBarUGvgHqYDzQfKmiRoOkUKQeD9RlfiFh7hgSvS6RaPB5JAwMGgiGCBoTE2gCjQJoJI0uIQAAOw%3D%3D",
	file  :"data:image/gif;base64,R0lGODlhEAAQAPc9AG5rgvD5/W9rguPs9qbI5avP6LHV7Lbc7/z9/qDC4cHo9uDq9bzi8+n0+uv1+uXx+O32+9jn8v7//3R0dNTi8eDt9uLu9sfj8sXr99zn9HVzdevx+enx+Orz+dDu+Ofz+ejv+O74/NXk8Nrn8trm89Xi8d7r9LjT6szo9b3Z7Pb5+9fk8vn7/ePw9+bv993o9O33+9jl88ra7+fu9+bu98Le7+v2+7PO59zq9G5qgXBwcG1pgP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAD0ALAAAAAAQABAAAAiKAHsIHEiw4MAdCBMiNChwB4+HEBcadAjx4Q4MOyZWtJiwoMMAISA46MDBxYYcHnkoYHDAQAECCWagJEjxoQQELFQMmHlQJUuXMBcASBkARoMHFkyMyDCUJg8PKC7USHHiRoymBxHY+NCiAo4IIkoI8AiCxoAFL0isoCBjLE2FO3LIBYCVod27dgMCADs=",
	folder:"data:image/gif;base64,R0lGODlhEAAQAOZQALmPGrmOGb2SF//MAf3xc/3rYLiOHLiOG+vIL7mRIvz/qf7NALmPG7mOF/z8mP/kAqRxALiOGP7fOvzyiP/TFf3pWv7jR/z+nf/lBbiPGv33hv7dNP3tZ//RD+KvALyTIP/VAJVrDP7ZJ/DsnfPAAP7bLvz7kv3uVriea/3nVLiQI/z2s7eOHr2SFrmOGuy5APnGALaLF7uTJP/OBv3zef31f/7qK/7pJP/dAPz/pv3/xP3/uv3ygf3/sP/cALiPG//VG/3uXf3vbfjhG9+sAf7tT7aNG/7lTaZzAP7hQf7XIf/NA/z5jP7lTriOGbiOGv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAFAALAAAAAAQABAAAAd7gFCCg4SFhoeIiYcJMh8MilAqKzxFQ0aKLBMnNw8+Ap8tMYUGQTYYOCALMCQvDYNPB0+yTxkAtk4eEa86Oz05DhoEBU0ITk6DKCMKF0w0HClJJUBPx4M/JjVCFRYbSh1LRBCEBsJHEiIUMwPrSIUHti4B8sYBIZD3+PmBADs=",
	pdf   :"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8%2F9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn%2FAACA6QAAdTAAAOpgAAA6mAAAF2%2BSX8VGAAACYUlEQVR42mLs7%2B%2F%2Fz0ABAAhAthwaAQwCAQCLqGDcH%2BUtw7AGWxRDOSS96pq4XB8RQa2UQmv0zlrMh3Gz93%2BeIzO9AvAsxigAgDAQi6C4%2BCrf4P8fIY7t1Q7ikCUk9Yu1wAzmhFIId3Q2ah2ZZ68kCAkl421XACEMEBZGseDP1hUMv%2Bf3M%2Fydso6BVUKa4R%2FQQLBmoCEgA2AAIICYsPkLHCg3rzL8v3qB4debVwyM%2F4AiP38y%2FAfhHz8Y%2FiF5CSCAmDC99h9igIUDAwPQZgY%2BQYh3%2FkG9AMS%2Ff%2F%2BGqwcIIKwGgB2oqsPADPQ3460rDH9ZWMCBBtMMomEAIICYMDSDbAKx799g%2BCMgzMC0dCrDz9cvGf4xszD8BgfmfwZmZma4HoAAghvwDxq6sDD4d%2F44w5foXAZWLX1gFHcw%2FASKMbIwMzCzsTEwMSHsBQggeCx8%2BvSJgRkkAXQu47evDH%2BePmb4a%2BHG8E9MgoGto5jh34tHDMw8vAw%2Fg5IZmHSM4QYABBDcKEZg3P9jYWX4x87JwHh0NzAWLjKw7d%2FM8PPpI4af9dMYWETEGb58%2BMjwhYmF4dfPn3ADAAII7gJmHh4Gxod3GP7t3sDwF4h%2FplUysJvaMjDz8jMwMzIwfNM0YDiwYwcDw71HEAwFAAGEMGDvJoYfB7Yz%2FAWFdEQmA4%2BLHwPLL2C8%2F%2FoBdt1%2FaNSFh4eDaVAyLiws5AQIILgBjB%2FeMjAD%2Ff%2Ff0oWBz8mHgeXPLwZQimAEhgvIAEak2IJqBun9CxBAcAM4wlKAGHeug4U8VDPcPIAAYoEJEguQNYMAQIABAKit%2BxRNKZdrAAAAAElFTkSuQmCC",
	word  :"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADdgAAA3YBfdWCzAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAM9SURBVHjatZVNS1RhFMf%2F93nuvN1xrm%2FkyxglSgYRURTRwkUfoE1Mq4g27cLKoiDctPIDFCQuWgeBBGEb3ZiRootCcSf5UojOOCqjdtW5d2Zu5xxxGMaZFkUHj8%2F77%2Fyf85zhGr7v43%2BYWTowDKMTwMV%2FZM6Rz5eCwdDuey%2BHfKWhtQmlTBjkSnOrYRTntMyp8jkzgNXh571TE2Pfy8EwwzY4OQNPb2BxLYOOeD16B75QIC0AHLbiRajJrUJAK9Cf2DFwZzwGN6%2BwnHLw%2BuM8Hty8gJBlF0GikpRpQ5FqA6YBmjNoTH0eoAo4ma0FoDD7w0Fv4jLam6MIRmwBagYRRLEzSDEU0AxWPFbVwR1NYXgFja8%2FXcysrIkSKxKELgFxvzTI4RigLv3TlcGJ613Iex5gKD4gBw05rKSVMSBjWhYHtwzTCuMD2UJFcFdDHgVa2thYRyRioS0eR2Z7G%2FB9BAIBeBTUtm3s7u6irq4OBwcHyGazsCwLsVgNbcv5FcE1NTXIui7XNCnQpFJhz3G4KgRgmiYF3aDghSIwl8thb2%2BPwLEiR5VxZXMhn4fSWtSk19cRCAYZJIobGxs5OKvlOYHW1tayEPLqVSGb%2BWd%2Bsq1N6jlACre2thAkONeqPgwoQVpaWqTvOI6sk1UHR6NR5ElxJpOR3EYtS5REIhG57ubmJqvkPdyyiKL%2FCSxAMrm%2BTTlrbW3lW4jq9vZ2BrBydoazF29JgaqDTzQ1Ied5%2FOqSu52dHTkcDodF%2Bf0phRUHZKzSINcANK41uHh45lc2mUxmeLEczI%2FFAM6Z5C8UCoGs%2BDBhPw07Qg9nmCjkPDQ4K7hUV0CX6WFw8MP7paWlEVJ%2FHNzc3Cy1mkqlsL%2B%2Fz2O%2BKudXKsGcfYNWRcDT3fA2k3hx5zYWFxYwPPJ5tK%2Bv7zEx0xVTkU6nOX%2BsmGuWgaxcUsG2OvYO58%2FZOJX%2FhqtXbmF5aRET4yOTT3p67hI0dcQp%2BYLIdROkdogeQR7ryCgAB5Kcz316hYK7C8uqhxM8i8npmdGeR89KoWLl5ZKgh%2FIJ7hPcp744pUKcTFrXdX2qnmx%2Ff%2F9bzh6fLXNR%2FLefJpd8ms6vo4L9t4%2FpbxSgqrXiYbTLAAAAAElFTkSuQmCC"
};

// Global variable with the course-list
var courses = {};

// Cache for fileid as in "https://www.itslearning.com/file/fs_folderfile.aspx?FolderFileID=1140992"
// to object {"id":id,"code":code,"link":link,"name":name,"updated":updated,"active":active}
var fileMetaCache = {};

// Cache for each course-menu on coursecode (e.g "TMA4100") -> tree structure
var courseItems = {};

// Redraw the courselist
var updateCourseList = function() {
	var course, li, list = [], newdom, a, fun;
	
	fun = function(event) {
		getCourse(event.target.href, function(items) {
			if (items.length === 0) {
				event.target.parentNode.parentNode.removeChild(event.target.parentNode );
			} else {
				// TODO: indicate that we are loading
				updateCourse(items);
			}
		});
		return false;
	};
	for (var c in courses) {
		course = courses[c];
		a = A(course.link, c);
		a.id="a"+c;
		li = LI([/*IMG(icons.loading),*/ a, txt(" "+course.name)]);
		list.push(li);
	}
	newdom = UL(list);
	swap(newdom, courselistDiv.childNodes[0]);
	
	unsafeWindow.onclickcourse = fun;
	for (var c in courses) {
		a = unsafeWindow.document.getElementById("a"+c);
		a.onclick = fun;
	}
};

// Extract data from the html courselist and trigger redraw
var parseCourseList = function(courseList) {
	var parser, dom;
	if (typeof courseList === "string") {
		parser = new DOMParser();
		dom = parser.parseFromString(courseList, "application/xhtml+xml");
	} else {
		dom = courseList;
	}
	var trs = dom.getElementsByTagName("tr");
	var i;
	var tds, id, link, text, m, code, name_, updated, active;
	for(i=1; i < trs.length; i++) {
		tds = trs[i].getElementsByTagName("td");
		link = tds[2].getElementsByTagName("a")[0];
		m = /CourseID=(\d+)/.exec(link);
		id = parseInt(m[1]);
		text = link.textContent;
		m = /^([A-ZÆØÅ]{2,4}[0-9]{1,4})\ (.*)/.exec(text);
		if (m) {
			code = m[1];
			name_ = m[2];
		} else {
			code = "";
			name_ = text;
		}
		updated = tds[4].textContent;
		active = tds[6].textContent === "Aktiv";
		courses[code] = {"id":id,"code":code,"link":link,"name":name_,"updated":updated,"active":active};
		//GM_log(id + ": " + name_ + ", "+code+" "+active+" "+link);
	}
	updateCourseList();
};

// Start fetching a list of all courses
var getAllCourses = function() {
	GM_xmlhttpRequest({
		method:"GET",
		url   :"https://www.itslearning.com/course/AllCourses.aspx",
		onload:function(details) {
			var parser = new DOMParser();
			var dom = parser.parseFromString(details.responseText, "application/xhtml+xml");
			var form = dom.getElementsByTagName("form")[0];
			var inputs = form.getElementsByTagName("input");
			var select = form.getElementsByTagName("select")[0];
			var i;
			var data = {};
			//GM_log(details.responseText);
			
			for(i=0; i < inputs.length; i++) {
				if (inputs[i].type !== "checkbox") {
					data[inputs[i].name] = inputs[i].value;
				}
			}
			//courses = {};
			parseCourseList(dom);
			
			data = encodeObject(data)+"&"+select.name+"=0";
			//GM_log("POSTing with: " + data);
			GM_xmlhttpRequest({
				method:"POST",
				url   :"https://www.itslearning.com/course/AllCourses.aspx",
				headers: {
				    "Content-Type": "application/x-www-form-urlencoded"
				},
				data  :data,
				onload:function(details) {
					parseCourseList(details.responseText);
				}
			});
		}
	});
};

// Function to actually fetch the url to a file, without the intermediate meta-data page
var getFileInfo = function(link, cb) {
	//GM_log("Getting "+link);
	var m = /FolderFileID=(\d+)/.exec(link);
	var id = parseInt(m[1]);
	
	if (fileMetaCache[id]) {
		// using setTimeout to give the DOM a chance to settle.
		window.setTimeout(function () { cb(fileMetaCache[id]); }, 10);
		return undefined;
	}
	
	GM_xmlhttpRequest({
		method:"GET",
		url:"https://www.itslearning.com"+link,
		onload:function(details) {
			//GM_log(details.responseText);
			var txt = details.responseText;
			var m, obj;
			var url, kb, kommentar, mime,filename;
			
			m = /\<a href=\"([^\"]*)\".*title=\"Last ned\".*\>\<img.*\>\<span\>Last\ ned\ (.+)\ \((\d+) kb\)/.exec(txt);
			
			url = m[1];
			filename = m[2];
			kb = parseInt(m[3]);
			
			m = /Kommentar\<\/th[^\<]*\<td[^\>]*\>(.*)\ \<\/td\>/m;
			m = m.exec(txt);
			kommentar = m[1];
			m = /MIME-type\<\/th[^\<]*\<td[^\>]*\>(.*)\ \<\/td\>/m;
			m = m.exec(txt);
			mime=m[1];
			
			//GM_log(mime+" "+filename+" "+kb+" "+url+ " " + kommentar);
			obj = {"url":url, "kb":kb,"kommentar":kommentar,"mime":mime,"filename":filename};

			fileMetaCache[id] = obj;
			cb(obj);
		}
	});
};

// Draw a course's contents
var updateCourse = function(items) {
	var i;
	var list = [],ul;
	var menuToDOM = function(item) {
		var img, a, r, ul, i, list=[];
		
		if (item.icon === "element_file.gif") {
			img = icons.loading;
			a = A(item.link, item.name_);
			getFileInfo(item.link, function(info) {
				var newimg = icons.file, newr;
				if (info.mime === "application/pdf") {
					newimg = icons.pdf;
				}
				newr = LI([IMG(newimg), txt(item.name_+": "), A(info.url, info.filename), txt(" ("+info.kb+" kb)")]);
				swap(newr, r);
			});
		} else if (item.sub) {
			img = icons.folder;
			a = A(item.link, item.name_);
		} else {
			a = A(item.link, item.name_);
		}
		a.target = "_blank";
		if (img) {
			r = LI([IMG(img), a]);
		} else {
			r = LI(a);
		}
		if(item.sub) {
			for(i=0; i < item.sub.items.length; i++) {
				list.push(menuToDOM(item.sub.items[i]));
			}
			ul = UL(list);
			r.appendChild(ul);
		}
		return r;
	};
	for(i=0; i < items.length; i++) {
		list.push(menuToDOM(items[i]));
	}
	ul = UL(list);
	swap(ul, courseDiv.childNodes[0]);
};

// Fetch a course-menu from it's learning
var getCourse = function(link, cb) {
	// This first request is ignored, and is just for setting the server in the right state
	// Yes; it's learning uses GET to change state, and POST to change views.
	
	if (courseItems[link]) {
		// using setTimeout to give the DOM a chance to settle.
		if (cb) {
			setTimeout(function() { cb(courseItems[link]); }, 10);
		}
		return;
	}
	//GM_log("Getting " + link);
	
	GM_xmlhttpRequest({
		method:"GET",
		url:link,
		onload:function(details) {
			GM_xmlhttpRequest({
				method:"GET",
				url:"https://www.itslearning.com/course/course.aspx",
				onload:function(details) {
					var parser = new DOMParser();
					var dom = parser.parseFromString(details.responseText, "application/xhtml+xml");
					//GM_log("content-area: "+details.responseText);
					var newtable = dom.getElementById("NewsElementsSection_ctl05_newelements");
					var newelements, i, a;
					if (newtable) {
						newelements = newtable.getElementsByTagName("tr");
											
						for(i = 1; i < newelements.length; i++) {
							a = newelements[i].getElementsByTagName("a")[0];
							// TODO: don't ignore this data.
							GM_log("New element: "+a.textContent+": "+a.href);
						}
					}
				}
				
			});
			// Load and parse menu:
			GM_xmlhttpRequest({
				method:"GET",
				url:"https://www.itslearning.com/treemenu.aspx",
				onload:function(details) {
					var script = details.responseText.substr(details.responseText.indexOf("var MTM"));
					script = script.substr(0,script.indexOf("\n//]]>"));
					//GM_log("treemenu:"+script);
					var dummy = function() {};
					var MTMenu = function() {
						this.items = [];
						this.MTMAddFunctions = dummy;
						this.MTMAddItem = function(item) {
							this.items.push(item);
						};
					};
					var MTMenuItem = function(ign1, name_, link, ign2, icon) {
						this.MTMakeSubmenu = function(n) {
							this.sub = n;
						};
						this.name_ = name_;
						this.link  = link;
						this.icon  = icon;
					};
					var IconList = function() {
						this.addIcon = dummy;
					};
					var MTMIcon = dummy;
					var MTMFunctionItem = dummy;
					eval(script); //this is probably evil
					//GM_log(menu.items);
					courseItems[link] = menu.items;
					if (cb) {
						cb(menu.items);
					}
				}
			});
		}
	});
};
//getCourse("https://www.itslearning.com/main.aspx?CourseID=8373");

//location.href="about:blank";
var courseDiv = DIV("Velg et fag...");
var courselistDiv = DIV("Laster liste...");

var newpage = [
	create("head", create("title", "It's learning (itsbtr)")),
	create("body", [
		// H1("It's learning"), 
		//P("-Slik som det burde være?"),
		A("https://www.itslearning.com/main.aspx?starturl=main/mainmenu.aspx?", 
		  "Vanlig it's learning"),
		courseDiv,
		courselistDiv
	])
];

var old = unsafeWindow.document.getElementsByTagName("html")[0];
var i;

// Remove all the horrible it's learning tags
for(i=old.childNodes.length-1; i >= 0; i--) {
	old.removeChild(old.childNodes[i]);
}
// And insert our own simple ones
for(i=0; i < newpage.length; i++) {
	old.appendChild(newpage[i]);
}
/*GM_addStyle(
	"html, body {margin:0; padding:0; } "
);*/
//courseDiv.style["background"] = "green";
courseDiv.style["width"] = "70%";
courseDiv.style["cssFloat"] = "right";

courselistDiv.style["background"] = "#ddd";
courselistDiv.style["width"] = "30%";
courselistDiv.style["cssFloat"] = "left";

getAllCourses();


