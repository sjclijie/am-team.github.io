window.AW = window.AW||{};
(function(){
/**
 *
 * AJ aliButton
 * @namespace AJ
 * @author 仈爪 <haibin.zhb@alipay.com>
 * @version 1.0.0
 *
 * */
'use strict';

/**
 * 当dom ready后自动检索所有拥有data-active-class属性的element，绑定为aliButton对象
 */
bind(document, 'DOMContentLoaded', function () {
	aliButton('[data-active-class]');
});

/**
 * 根据选择器来获取一组button实例，并同时绑定tap事件
 * @param {string|object|Array} selecter dom选择器，可传字符串或直接一个或一组element对象
 * @param {function} [fn] 绑定tap事件
 * @returns {Array}
 */
var aliButton = function (selecter, fn) {
	var Els = [], btns = [];
	if ('string' === type(selecter)) {
		Els = getEle(selecter);
	} else if (isNl(selecter)) {
		Els = nodeList2arr(selecter);
	} else if (isEl(selecter)) {
		Els = [selecter];
	}
	each(Els, function (i, el) {
		var btn = Button(el);
		btn.tap(fn);
		btns.push(btn);
	});
	/**
	 * 为一组Button实例自动透传至包含的所有button实例的对应接口
	 * @returns {Array}
	 */
	var intArr = ['tap', 'unlock'];
	each(intArr, function (i, s) {
		btns[s] = function () {
			var a = arguments;
			each(this, function (i, el) {
				el[s].apply(el, a);
			});
			return this;
		}
	});
	return btns;
};

/**
 * 全局设置是否开启timelock功能
 * @param {number} time 小于等于0则代表关闭，大于0则代表timelock的时间间隔
 */
aliButton.setTimeLock = function (time) {
	Button.prototype.timeLock = time;
};

/**
 * 全局设置是否启用autoDisabled功能
 * @param {boolean} enable true代表开启，false代表关闭
 */
aliButton.setAutoDisabled = function (enable) {
	Button.prototype.autoDisabled = enable;
};

/**
 * 已被实例化的button集合
 * @type {Array}
 */
var buttonStorage = [];

/**
 * @name Button
 * @class 封装的单个button类
 * @param {Object} ele 传入Element类型的值
 *
 * @example
 * var button = new Button(document.getElementById('button')});
 */
var Button = function (ele) {
	var btn, t = this;
	var el = isNl(ele) ? ele.item(0) : ele;
	if (t instanceof Button) {
		t.ele = el;
		t.queue = {
			tap: []
		};
		t.isLocked = false;
		t.lsto = null;
		bindTap(t);
		buttonStorage.push(t);
		btn = t;
	} else {
		btn = findInStorage(el) || new Button(ele);
	}
	return btn;
};

/**
 * Button类的prototype值，如果大于0则代表该button将启用timeLock功能，时间间隔内不能再次触发tap事件.
 * @enum {number}
 */
Button.prototype.timeLock = 0;

/**
 * Button类的prototype值，如果为true则代表该button在timeLock期间会在dom结构上增加[disabled='disabled']属性
 * @enum {boolean}
 */
Button.prototype.autoDisabled = false;

/**
 * 绑定tap事件，并开启模拟active功能
 * 当手指按下时获取element的data-active-class属性值后新增到当前class；手指放开后删除该class。如果没有data-active-class属性则默认为active
 *
 * @param {Button} button - Button类的实例
 * @returns {void}
 * @example
 * bindTap(new Button(document.getElementById('button')}));
 */
function bindTap(button) {
	button.ele.style['-webkit-user-select'] = 'none';
	bind(button.ele, 'touchend touchmove touchcancel', function () {
		var t = this;
		var ctmClass = t.getAttribute('data-active-class') || "active";
		t.classList.remove(ctmClass);
	});
	bind(button.ele, 'touchstart', function () {
		if (!(button.timeLock > 0 && button.isLocked === true)) {
			var t = this, sto;
			var ctmClass = t.getAttribute('data-active-class') || "active";
			t.classList.add(ctmClass);

			var cancelHandle = function () {
				clearTimeout(sto);
				unBind(t, 'touchmove', cancelHandle);
				unBind(t, 'touchcancel', cancelHandle);
				unBind(t, 'touchend', endHandle);
			};

			var endHandle = function () {
				if (button.queue.tap.length) {
					if (button.timeLock > 0) {
						button.isLocked = true;
						!!button.autoDisabled && t.setAttribute('disabled', 'disabled');
						button.lsto = setTimeout(function () {
							button.unlock();
						}, button.timeLock);
					}
					each(button.queue.tap, function (i, fn) {
						try {
							isFn(fn) && fn.call(t);
						} catch (e) {
							console && console.error(e);
						}
					});
				}
				cancelHandle();
			};

			bind(t, 'touchmove', cancelHandle);
			bind(t, 'touchcancel', cancelHandle);
			bind(t, 'touchend', endHandle);
			sto = setTimeout(cancelHandle, 500);
		}
	});
}

/**
 * 为一个Button实例绑定一个tap事件
 * @param {function|number|boolean} [fn] 需要绑定的tap事件。如果为number类型则自动识别为timelock;如果为boolean自动识别为enableAutoDisabled
 * @param {function|number|boolean} [timelock] 私有的timelock值。如果为boolean自动识别为enableAutoDisabled
 * @param {function|number|boolean} [enableAutoDisabled] 私有的autoDisabled
 * @returns {Button}
 *
 * @example
 * var button = new Button(document.getElementById('button')}).tap(function(){});
 */
Button.prototype.tap = function (fn, timelock, enableAutoDisabled) {
	if ('boolean' === type(fn)) {
		enableAutoDisabled = fn;
		fn = undefined;
		timelock = undefined;
	}
	if ('number' === type(fn)) {
		enableAutoDisabled = timelock;
		timelock = fn;
		fn = undefined;
	}
	(isFn(fn) && this.queue.tap.indexOf(fn) < 0) && this.queue.tap.push(fn);
	('number' === type(timelock)) && (this.timeLock = timelock);
	('boolean' === type(enableAutoDisabled)) && ( this.autoDisabled = enableAutoDisabled);
	return this;
};

/**
 * 强制解锁一个button的锁定状态
 */
Button.prototype.unlock = function () {
	var t = this;
	clearTimeout(t.lsto);
	t.isLocked = false;
	!!t.autoDisabled && t.ele.removeAttribute('disabled');
};

/**
 * 使用原生query实现dom selecter，并转换为数组
 * @param {string} selecter 选择器的关键词
 * @returns {Array}
 */
function getEle(selecter) {
	var els = document.querySelectorAll(selecter);
	return nodeList2arr(els);
}

/**
 * 转换一组dom为数组类型，为了兼容某些奇葩机，必须使用item获取
 * @param {Array} nodeList 原生选择器生成的htmlcollection或nodelist
 * @returns {Array}
 */
function nodeList2arr(nodeList) {
	var arr = [];
	each(nodeList, function (i) {
		arr.push(nodeList.item(i));
	});
	return arr;
}

/**
 * 在现有已被实例化的button集合内查找是否已存在相同的button实例
 * @param {object} ele 一个原生element对象
 * @returns {Button|undefined} 如果存在则直接返回现有button实例，不存在则返回undefined
 */
function findInStorage(ele) {
	var rtv;
	each(buttonStorage, function (i, btn) {
		if (btn.ele === ele) {
			rtv = btn;
			return false;
		}
	});
	return rtv;
}

function bind(el, event, fn, useCapture) {
	var evs = 'string' === type(event) ? event.split(' ') : [];
	each(evs, function (i, e) {
		el.addEventListener(e, fn, !!useCapture);
	});
}

function unBind(el, event, fn, useCapture) {
	el.removeEventListener(event, fn, !!useCapture);
}

/**
 * 压缩代码，轮询一个数组
 * @param {Array} arr 需要轮询的数组
 * @param {function} fn 轮询事件，第一个入参为索引，第二个入参为对应的值
 */
function each(arr, fn) {
	for (var i = 0; i < arr.length; i++) {
		var rtv = fn.call(null, i, arr[i]);
		if (rtv === false) break;
	}
}

/**
 * 判断变量是否为function类型
 * @param {*} fn 需要判断的变量
 * @returns {boolean}
 */
function isFn(fn) {
	return 'function' === type(fn);
}

/**
 * 判断变量是否为原生elements集合
 * @param {*} nodeList 需要判断的变量
 * @returns {boolean}
 */
function isNl(nodeList) {
	return ('htmlcollection' === type(nodeList) || 'nodelist' === type(nodeList));
}

/**
 * 判断变量是否为单个原生element对象类型
 * @param {*} ele 需要判断的变量
 * @returns {boolean}
 */
function isEl(ele) {
	return (/^html.+element$/i).test(type(ele));
}

/**
 * 判断一个变量的类型，返回为全部小写的类型名称
 * @param {*} obj 需要判断的变量
 * @returns {string}
 */
function type(obj) {
	return Object.prototype.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
}

var button = aliButton;

window.AW.button = button;
})();