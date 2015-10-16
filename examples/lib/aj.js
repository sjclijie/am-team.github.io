window.AJ = window.AJ||{};
(function(){
/**
 *
 * date 日期格式
 *
 * @memberof AJ
 *
 * @author 雷骏
 * @version 1.0.0
 *
 * */
var date = {
	/**
	 * 日期格式化方法
	 *
	 * @param {?Date|Number} date - 日期对象（或时间戳）
	 * @param {?String} formatter - 指定格式化格式 格式说明 y代表年份，M代表月份，d代表天数，h代表时，m代表分，s代表秒
	 *
	 * @returns {String}
	 *
	 * @desc 日期格式化方法
	 * @example
	 * var d = new Date();
	 * var ds = AJ.date.format(d,'yy-MM-dd'); //2014-05-03
	 * var ds = AJ.date.format('yy/M/d'); //2014/5/3（不传date，默认去当前)
	 * var ds = AJ.date.format(d.getTime(),'yy/M/d'); //2014/5/3（传入时间戳)
	 * var ds = AJ.date.format(d); //2014/5/3 18:31:24（不传formatter）
	 * var ds = AJ.date.format(); //2014/5/3 18:31:24（不传date和formatter
	 *
	 */
	format: function () {
		var date, formatter;
		if (arguments.length === 0) {
			date = new Date();
			formatter = 'yyyy-MM-dd hh:mm:ss';
		} else if (arguments.length === 1) {
			if (typeof arguments[0] === 'string') {
				date = new Date();
				formatter = arguments[0];
			} else {
				date = arguments[0];
				if (typeof date === 'number') {
					var tmpDate = new Date();
					tmpDate.setTime(date);
					date = tmpDate;
				}
				formatter = 'yyyy-MM-dd hh:mm:ss';
			}
		} else {
			date = arguments[0];
			formatter = arguments[1];
		}
		if (typeof date === 'number') {
			var tmpDate = new Date();
			tmpDate.setTime(date);
			date = tmpDate;
		}
		if (typeof arguments)
			var z = {
				y: date.getFullYear(),
				M: date.getMonth() + 1,
				d: date.getDate(),
				h: date.getHours(),
				m: date.getMinutes(),
				s: date.getSeconds()
			};
		return formatter.replace(/([yMdhms])+/g, function (v, t) {
			switch (t) {
				case 'y':
					return z[t].toString().slice(-v.length);
				default:
					return ((v.length > 1 ? '0' : '') + z[t]).slice(-2);
			}
		});
	},
	/**
	 * 当前时间时间戳
	 *
	 *
	 * @returns {Number}
	 *
	 * @desc 当前时间时间戳
	 *
	 * @example
	 * var nowStamp= AJ.date.now();
	 */
	now: function () {
		if (!Date.now) {
			return Date.now();
		} else {
			return (new Date).getTime();
		}
	}
};

window.AJ.date = date;

})();
window.AJ = window.AJ||{};
(function(){
/**
 *
 * image 图片方法
 *
 * @memberof AJ
 *
 * @author 杜黑
 * @version 1.0.0
 *
 * */
var image = {};
/**
 * image转换base64编码方法
 *
 * @param {!path} path - 图片地址（需要同域,项目目录）
 * @param {!function} callback - 返回数据
 *
 * @returns {string}
 *
 * @desc image转换base64编码方法
 *
 * @example
 * AJ.image.toBase64("abc.png",function(base64Data){
     *  //data:image/png;base64.....
     * })
 */
image.toBase64 = function (path, callback) {
	var eleCanvas = document.createElement('canvas'),
		ctx = eleCanvas.getContext('2d'),
		img = new Image();

	img.onload = function () {
		var dataValue = "", error;

		eleCanvas.width = img.width;
		eleCanvas.height = img.height;
		ctx.drawImage(img, 0, 0, img.width, img.height);
		try {
			dataValue = eleCanvas.toDataURL();
			eleCanvas = null;
		} catch (e) {
			console.error(e);
			error = e;
		}
		callback(dataValue, error);
	};
	img.onerror = function () {
		alert("图片无法加载，请检查对应地址的图片是否存在");
	};
	img.src = path;
};

window.AJ.image = image;
})();
window.AJ = window.AJ||{};
(function(){
/**
 *
 * storage 本地存储
 *
 * @memberof AJ
 * @author 轩与
 * @version 1.0.0
 * */
var storage = {},
	ls,
	isStorable = true,
	methods,
	expiredListTableKey = "aj.storage.expiredList";

// storage接口定义
methods = {
	/**
	 *
	 * 获取储存内容
	 * @param {string} key 存储内容的key值
	 * @returns {string|undefined} 返回值为undefined没找到该内容
	 *
	 * @example
	 * var content = AJ.storage.get("name");
	 *
	 * */
	get: function (key) {
		var val = ls.getItem(key);
		//safari返回null,chrome返回undefined，一律做undefined处理
		return val === undefined || val === null ? undefined : getValueByExpire(key, val);
	},
	/**
	 * 设置储存内容
	 * @param {string} key 存储的key值，区分大小写
	 * @param {*} val 设置的存储数值
	 * @param {?number|date} expire 过期时间,如果是date类型，则是过期日期，如果是number则是过几秒后过期 单位：秒
	 *
	 * @returns {undefined|object} 成功返回undefined，不成功，返回一个异常对象
	 *
	 * */
	set: function (key, val, expire) {
		//fix iphone/ipad bug
		this.remove(key);

		expire && addExpire(key, expire);

		return setValue(key, val);
	},
	/**
	 * 删除存储值
	 * @param {string} key 储存的键值
	 *
	 * */
	remove: function (key) {
		deleteExpiredDate(key);
		ls.removeItem(key);
	},
	/**
	 * 清空所有键值
	 *
	 * */
	clear: function () {
		ls.clear();
	},
	/**
	 *
	 * 获取过期日期
	 * @param {string} key 键值
	 * @returns {undefined|date} 如果该key不存在或者没有日期，则返回undefined,否则返回date对象
	 *
	 * */
	getExpiredDate: function (key) {
		if (!ls.getItem(key)) {
			return undefined;
		} else {
			return getExpiredDate(key);
		}
	}
};

/*
 *
 * storage模块初始化
 *
 * */
function init() {
	if ("localStorage" in window) {
		try {
			ls = window.localStorage;
			if (ls !== null) {
				ls.setItem("aj.storage.test.key", "");
				isStorable = true;
				ls.removeItem("aj.storage.test.key");
			} else {
				isStorable = false;
			}
		} catch (e) {
			console.info(e);
			// safari private browser mode
			if (e.code == 22 && ls.length === 0) {
				isStorable = false;
			}
		}
	} else {
		isStorable = false;
	}
}

/*
 *
 * 为storage对象增加方法，之所以采用方法来增加对象，是为了在此对象，横切入storage的方法来判断storage的可用性，不需要为每个方法都进行处理
 * @param {object} methods storage定义的方法 json对象，key为方法名，value为具体方法实现
 *
 * */
function addMethod(methods) {
	var unSupportTip = function () {
		console.warn('抱歉，您的浏览器暂不支持localstoarage的使用! 无法使用该接口!');
		return undefined;
	};
	for (var methodName in methods) {
		storage[methodName] = isStorable ? methods[methodName] : unSupportTip;
	}
}

/*
 *
 * 根据过期标志来获取内容
 * @param {string} key 储存的名称
 * @param {string} storageValue 存储内容
 * @returns {string|undefined} 如果键值不存在，则返回undefined
 *
 * */
function getValueByExpire(key, storageValue) {
	if (isExpired(key)) {
		ls.removeItem(key);
		return undefined
	} else {
		return storageValue;
	}
}

/*
 *
 * 设置storage的内部实现方法
 * @param {string} key 存储的key值
 * @param {*} val 存储的value值
 * @returns {undefined|object}  如果设置成功，返回undefined,否则是个异常对象
 *
 * */
function setValue(key, val) {
	try {
		Object.prototype.toString.apply(val) === '[object Object]' && (val = JSON.stringify(val));
		ls.setItem(key, val);
		return undefined;
	} catch (e) {
		if (e.code == 22) {
			console.log("storage已满，无法在储存新的数据");
		} else {
			console.error(e);
		}
		return e;
	}
}

/*
 *
 * 在过期索引表中增加此key的设置
 * @param {*} key 用户设置的key数值
 * @param {number|Date} expire 过期时间 单位：秒
 *
 * */
function addExpire(key, expire) {
	if (expire !== undefined) {
		try {
			var indexTable = ls.getItem(expiredListTableKey);
			indexTable = indexTable ? JSON.parse(indexTable) : {};

			expire = Object.prototype.toString.apply(expire) === '[object Date]' ? expire.getTime() : ((+new Date()) + expire * 1000);

			indexTable[key] = expire;

			ls.setItem(expiredListTableKey, JSON.stringify(indexTable));
		} catch (e) {
			console.warn(e);
		}
	}
}

/*
 *
 * 判断是否过期，从index表中查找
 * @param {string} key 储存键值
 * @returns {boolean}
 *
 * */
function isExpired(key) {
	var indexTable = ls.getItem(expiredListTableKey);
	if (!indexTable) return false;

	indexTable = JSON.parse(indexTable);
	for (var indexKey in indexTable) {
		if (indexKey == key) {
			var expired = Number(indexTable[indexKey]) - (+new Date()) < 0;
			expired && deleteExpiredDate(key);
			return expired;
		}
	}
	return false;
}

/*
 *
 * 获取过期日期
 * @param {string} key 储存键值
 * @returns {undefined|Date} 未查询到日期则返回undefined,否则为Date日期对象
 *
 * */
function getExpiredDate(key) {
	var indexTable = ls.getItem(expiredListTableKey);
	if (!indexTable) return undefined;

	indexTable = JSON.parse(indexTable);
	for (var indexKey in indexTable) {
		if (indexKey == key) {
			//查询下如果key值在storage已经不存在，则删除此键值，并且返回undefined
			if (!ls.getItem(key)) {
				deleteExpiredDate(key);
				return undefined;
			} else {
				return new Date(indexTable[key]);
			}

		}
	}
	return undefined;
}

/*
 *
 * 删除过期日期索引表中的key
 * @param {!string} key 储存键值
 *
 * */
function deleteExpiredDate(key) {
	var indexTable = ls.getItem(expiredListTableKey);
	if (!indexTable) return;

	indexTable = JSON.parse(indexTable);
	delete indexTable[key];

	ls.setItem(expiredListTableKey, JSON.stringify(indexTable));
}

init();
addMethod(methods);

window.AJ.storage = storage;
})();
window.AJ = window.AJ||{};
(function(){
/**
 *
 * 字符串方法
 *
 * @memberof AJ
 * @author 杜黑
 * @version 1.0.0
 *
 * */
var string = {};

/**
 * 计算字符串长度的方法，中文算两个，英文算一个，特殊字符不算
 *
 * @param {!str} str - 需要计算长度的字符串
 *
 * @returns {int|undefined} 如果传入的不是string字符串，一律返回undefined
 *
 * @desc 计算字符串长度的方法
 *
 * @example
 * AJ.string.getFullLen($(this).val())
 */
string.getFullLen = function (str) {
	if (!isStr(str)) {
		return undefined;
	}

	var len = 0;

	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
			len++;
		} else {
			len += 2;
		}
	}
	return len;
};

function isStr(o) {
	return Object.prototype.toString.call(o) === "[object String]";
}

window.AJ.string = string;
})();
window.AJ = window.AJ||{};
(function(){
/**
 *
 * uri对象
 *
 * @author 双十
 * @version 1.0.0
 *
 * uri对象name value键值对照表
 * source：源url
 * protocol：协议名 http https file
 * host：域名
 * port：端口号
 * query：query string数值
 * params：query string 对象
 * hast：hash数值
 * path：路径
 *
 * */
var uri = {
	/**
	 * 解析url，将url解析成uri对象
	 * @param {string|object} url url字符串,如果传入的是uri对象，这不做任何处理，返回
	 * @returns {object} uri对象
	 * @example
	 * AJ.uri.parse(location.href);
	 * */
	parse: function (url) {
		if (isUriObj(url))return url;

		var a = document.createElement('a');
		a.href = url;
		var uriObj = {
			source: url,
			protocol: a.protocol.replace(':', ''),
			host: a.hostname,
			port: a.port,
			query: a.search,
			params: parseQueryString(a.search),
			file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
			hash: a.hash.replace('#', ''),
			path: a.pathname.replace(/^([^\/])/, '/$1'),
			relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
			segments: a.pathname.replace(/^\//, '').split('/'),
			__type__: "uri"
		};
		/**
		 *
		 * uri对象提供toString的方法，其内部调用stringify方法
		 *
		 * */
		uriObj.toString = function () {
			return uri.stringify(uriObj);
		};
		return uriObj;
	},
	/**
	 *
	 * 将uri对象转换成string对象
	 * @param {object} uri uri对象
	 * @returns {string}
	 *
	 * @example
	 * console.log(AJ.uri.stringify(uri)); // http://www.alipay.com
	 *
	 * */
	stringify: function (uri) {
		var url = "";
		url += uri.protocol + "://";
		url += uri.host + (uri.port ? (":" + uri.port) : "");
		url += uri.path;
		url += uri.query;
		uri.hash && (url += "#" + uri.hash);
		return url;
	},
	/**
	 *
	 * 设置queryString的值
	 * @param {!string|object} url url字符串或者是uri对象
	 * @param {!string|object} name query string的名字 如果是对象的话，则进行批量设置
	 * @param {?string} value queryString的值
	 *
	 * @returns {string|object} 如果传入的参数是string，则返回string，否则返回uri对象
	 *
	 * */
	setParam: function (url, name, value) {
		var uri = this.parse(url);

		if (isObj(name)) {
			for (var n in name) {
				setQueryString(uri, n, name[n]);
			}
		} else {
			setQueryString(uri, name, value);
		}

		return isString(url) ? uri.toString() : uri;
	},
	/**
	 * 获取QueryString的值
	 * @param {!string|object} url url字符串或者是uri对象
	 * @param {!string} name 需要查找的名称
	 * @returns {string|undefined} 如果未找到，则返回undefined
	 *
	 * */
	getParam: function (url, name) {
		var uri = this.parse(url);
		return uri.params[name];
	},
	/**
	 *
	 * 删除param中的name
	 * @param {string|object} url url字符串或者是uri对象
	 * @param {string} name queryString 中的名字
	 *
	 * @returns {string|object}  如果传入的参数是string，则返回string，否则返回uri对象
	 *
	 * */
	removeParam: function (url, name) {
		var uri = isUriObj(url) ? url : this.parse(url);

		uri = setQueryString(uri, name, null);

		return isUriObj(url) ? uri : uri.toString();
	}
};

function parseQueryString(search) {
	var ret = {},
		seg = search.replace(/^\?/, '').split('&'),
		len = seg.length, i = 0, s;
	for (; i < len; i++) {
		if (!seg[i]) {
			continue;
		}
		s = seg[i].split('=');
		//有些queryString没有value只有key
		ret[s[0]] = s.length > 0 ? decodeURIComponent(s[1]) : "";
	}
	return ret;
}

function setQueryString(uri, key, value) {
	if (value === null) {
		delete uri.params[key];
	} else {
		uri.params[key] = value;
	}

	//重新构成uri.search
	var search = [];
	for (var paramName in uri.params) {
		//在设置name之前，会把value强制decode一次，防止传入的value已经被encode过而产生两次encode的问题
		search.push(paramName + "=" + encodeURIComponent(decodeURIComponent(uri.params[paramName])));
	}
	uri.query = "?" + search.join("&");

	return uri;
}

function type(o) {
	return Object.prototype.toString.call(o);
}

function isString(o) {
	return type(o) == '[object String]';
}

function isObj(o) {
	return type(o) == '[object Object]';
}

function isUriObj(o) {
	return isObj(o) && o.__type__ === "uri";
}

window.AJ.uri = uri;
})();