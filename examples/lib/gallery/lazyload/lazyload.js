window.AW = window.AW||{};
(function(){
/**
 *
 * AW lazyload 图片懒加载
 * @namespace AW
 *
 * @author 雷骏 <leijun.wulj@alipay.com>
 * @version 1.0.0
 *
 * */

'use strict';
var lazyload = {
	/**
	 * 默认配置参数
	 *
	 * @memberof AW.lazyload
	 * @param {!Boolean} auto - 是否自动执行
	 * @param {!Number} offsetPre - 懒加载提前偏移量，使体验更好
	 * @param {!String} lazyAttr - 懒加载替换图片放置路径
	 * @param {!Boolean} overget - 加载在加载位置之前的图片（当前屏幕之外的上方或者左方）
	 * @param {!Boolean} log - 对没有高宽的图片打出log提醒
	 *
	 * @desc 默认配置参数
	 *
	 */
	options: {
		auto: true,
		offsetPre: 10,//预加载偏移量，默认10，提升懒加载体验
		lazyAttr: 'data-src',
		overget: false,
		log: true
	},
	//lazyload资源池
	matchStack: [],
	/**
	 * 初始化方法
	 *
	 * @memberof AW.lazyload
	 *
	 * @param {?Object} options - 配置参数
	 *
	 * @desc 初始化方法(可供外部调用)
	 *
	 * @example
	 * AW.lazyload.init();
	 * AW.lazyload.init({offsetPre:20});
	 */
	init: function (options) {
		var lazyOption = document.querySelector('body').getAttribute('data-lazy');
		lazyOption = parseObj(lazyOption);
		this.options = simpleExtend(this.options, lazyOption);
		this.options = simpleExtend(this.options, options);
		this.runLock = true;
		if (this.options.auto) {
			var initStack = document.querySelectorAll('img[' + this.options.lazyAttr + ']');
			this.load(initStack);
		}
	},
	/**
	 * 资源池新增图片并触发加载监控
	 *
	 * @memberof AW.lazyload
	 * @param {?String|?Object} addStack - 可以为选择器，可以为节点数据集，可以为节点
	 *
	 * @desc 资源池新增图片并触发加载监控
	 *
	 * @example
	 * AW.lazyload.load('.lazy img');//选择器
	 * AW.lazyload.load([Nodelist]);//节点Nodelist（伪数组）
	 * AW.lazyload.load([Array]);//节点Array
	 * AW.lazyload.load(ImageElement);//图片节点
	 * AW.lazyload.load(OtherElement);//除图片外其它节点，找寻内部图片节点
	 * AW.lazyload.load(jQueryObject);//jQuery节点集（伪数组）
	 * AW.lazyload.load(ZeptoObject);//Zepto节点集（伪数组）
	 *
	 */
	load: function (addStack) {
		this.add(addStack);
		this.addLoadListener();
	},
	/**
	 * 资源池新增图片
	 *
	 * @memberof AW.lazyload
	 * @param {?String|?Object} addStack - 可以为选择器，可以为节点数据集，可以为节点
	 *
	 * @desc 资源池新增图片
	 *
	 * @example
	 * AW.lazyload.add('.lazy img');//选择器
	 * AW.lazyload.add([Nodelist]);//节点Nodelist（伪数组）
	 * AW.lazyload.add([Array]);//节点Array
	 * AW.lazyload.add(ImageElement);//图片节点
	 * AW.lazyload.add(OtherElement);//除图片外其它节点，找寻内部图片节点
	 * AW.lazyload.add(jQueryObject);//jQuery节点集（伪数组）
	 * AW.lazyload.add(ZeptoObject);//Zepto节点集（伪数组）
	 *
	 */
	add: function (addStack) {
		//将addStack进行处理，获得指定节点集。
		switch (isElement(addStack)) {
			case 'element':
				//如果是对象，首先判断是否element节点
				if (type(addStack) === 'htmlimageelement') {
					//如果是img节点，添加进栈，如果其它节点，找寻子节点中是否有满足的img节点
					addStack = [addStack];
				} else {
					addStack = addStack.querySelectorAll(this.options.lazyAttr);
				}
				break;
			//如果是字符串，姑且认为是选择器
			case 'string':
				addStack = document.querySelectorAll(addStack);
				break;
		}
		//将伪数组转为数组
		if (addStack.length && addStack.length > 0) {
			addStack = Array.prototype.slice.call(addStack);
		} else {
			return;
		}
		addStack = filter(addStack, this);
		this.matchStack = this.matchStack.concat(addStack);
	},
	/**
	 * 对资源池添加懒加载监听，同一时间内有限运行仅一次
	 *
	 * @memberof AW.lazyload
	 *
	 * @desc 对资源池添加懒加载监听，同一时间内有限运行仅一次
	 *
	 * @example
	 * AW.lazyload.addLoadListener();
	 */
	addLoadListener: function () {
		this.run();
		if (this.runLock) {
			this.runLock = false;
			window.addEventListener('scroll', this.run, false);
			window.addEventListener('resize', this.run, false);
			window.addEventListener('orientchange', this.run, false);
		}
	},
	/**
	 * 对资源池移除懒加载监听
	 *
	 * @memberof AW.lazyload
	 *
	 * @desc 对资源池移除懒加载监听
	 *
	 * @example
	 * AW.lazyload.addLoadListener();
	 */
	removeLoadListener: function () {
		window.removeEventListener('scroll', this.run, false);
		window.removeEventListener('resize', this.run, false);
		window.removeEventListener('orientchange', this.run, false);
		this.runLock = true;
	},
	/**
	 * 当前时机，执行一次懒加载遍历尝试
	 *
	 * @memberof AW.lazyload
	 *
	 * @desc 当前时机，执行一次懒加载遍历尝试
	 *
	 */
	run: function () {
		var matchStack = lazyload.matchStack;
		if (matchStack.length === 0) {
			lazyload.removeLoadListener();
			return;
		}
		for (var index = 0; index < matchStack.length; index++) {
			var elem = matchStack[index];
			if (isNeedLoad(elem, lazyload)) {
				lazyimgReplace(elem, lazyload);
				//实时从堆栈中删除懒加载已完成节点
				matchStack.splice(index, 1);
				index--;
			}
		}
	}

};

/*类型判断*/
function type(obj) {
	return Object.prototype.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
}
function isElement(obj) {
	return (type(obj).indexOf('element') === -1) ? type(obj) : 'element';

}
/*图片节点执行懒加载时属性变换*/
function lazyimgReplace(elem, lazyObj) {
	var lazyAttr = lazyObj.options.lazyAttr;
	if (elem.getAttribute(lazyAttr)) {
		elem.src = elem.getAttribute(lazyAttr);
		elem.removeAttribute(lazyAttr);
	}
}
/*过滤重复节点或者无效节点*/
function filter(addStack, lazyObj) {
	for (var i = addStack.length; i--;) {
		if (lazyObj.matchStack.indexOf(addStack[i]) !== -1) {
			//重复节点删除
			addStack.splice(i, 1);
		} else {
			if (typeof addStack[i].getAttribute(lazyObj.options.lazyAttr) === 'undefined' || addStack[i].getAttribute(lazyObj.options.lazyAttr) === '') {
				//无效节点删除
				addStack.splice(i, 1);
			}
		}
	}
	return addStack;
}
/*判断当前时机，指定节点是否需要加载*/
function isNeedLoad(elem, lazyObj) {
	var viewport = {
		width: window.innerWidth,
		height: window.innerHeight,
		top: document.body.scrollTop | document.documentElement.scrollTop,
		left: document.body.scrollLeft | document.documentElement.scrollLeft
	};
	var offsetPre = lazyObj.options.offsetPre;
	var elAxis = {
		top: 0,
		left: 0,
		bottom: 0,
		right: 0
	};
	if (typeof elem.getBoundingClientRect !== "undefined") {
		//此处如果图片未定宽高，那么domready时获取出来的top可能不准确，但不妨碍大局：）
		elAxis = elem.getBoundingClientRect();
		if (lazyObj.options.log) {
			if (elAxis.top === elAxis.bottom) {
				console.warn(elem, 'need height');
			}
			if (elAxis.left === elAxis.right) {
				console.warn(elem, 'need width');
			}
		}
	}
	if (lazyObj.options.overget) {
		return ((elAxis.top - offsetPre < viewport.height) && (elAxis.left - offsetPre < viewport.width))
	} else {
		return ((elAxis.bottom + offsetPre >= 0 && elAxis.top - offsetPre < viewport.height) && (elAxis.right + offsetPre >= 0 && elAxis.left - offsetPre < viewport.width))
	}
}
/*继承实现*/
function simpleExtend(target, source) {
	for (var p in source) {
		if (source.hasOwnProperty(p)) {
			target[p] = source[p];
		}
	}
	return target;
}
/*字符串转对象*/
function parseObj(data) {
	try {
		return (new Function("return " + data))();
	} catch (e) {
		return {};
	}
}
/**
 * 内部DOMReady后懒加载函数自执行部分功能
 *
 * @desc 内部DOMReady后懒加载函数自执行部分功能
 *
 */
// 文档初始化完成后监听
if (document.readyState === 'complete') {
	lazyload.init();
} else {
	document.addEventListener('DOMContentLoaded', function (e) {
		lazyload.init();
	}, false);
}

window.AW.lazyload = lazyload;
})();