window.AW = window.AW||{};
(function( _win ){
	/**
	 *
	 * AW lazyload 图片懒加载
	 * @namespace AW
	 *
	 * @author 雷骏 <leijun.wulj@alipay.com>
	 * @version 1.0.0
	 *
	 * @modify 王员外 <i@yuanwai.wang>
	 * + 支持 webp 格式图片 ： lazyAttr: 'data-webp-src|data-src' （安卓 4.1及以上支持 ）
	 * */

	'use strict';
	var lazyload = {
		/**
		 * 默认配置参数
		 *
		 * @memberof AW.lazyload
		 * @param {!Boolean} auto - 是否自动执行
		 * @param {!Number} offsetPre - 懒加载提前偏移量，使体验更好
		 * @param {!String} lazyAttr - 懒加载替换图片放置路径 //从左到右顺序优先加载，找到为止。申明：webp 格式。注意：webp 格式必须是：data-webp-src
		 * @param {!Boolean} overget - 加载在加载位置之前的图片（当前屏幕之外的上方或者左方）
		 * @param {!Boolean} log - 对没有高宽的图片打出log提醒
		 * @param {!Array} tfsDomain - tfs 服务器白名单（ 在 tfs 图片地址 后面 加 _q50 ，可改变 jpg 质量）
		 * @param {!Number} performanceTime - 单位：毫秒。网络连接耗时，判断网络情况：高于此数据 && tfs 服务器图片 && JPG 格式，会自动切换低质量图片

		 * @param {!String} lowNetTitle - 低网速下的提示
		 * @param {!String} highNetTitle - 如果是高网络，则不提示，如果上次低网提示
		 * @param {!Number} netTitleIntervalTime - 单位：秒，180秒内不重复提示

		 * @desc 默认配置参数
		 *
		 */
		options: {
			auto: true,
			offsetPre: 10,//预加载偏移量，默认10，提升懒加载体验
			lazyAttr: 'data-webp-src|data-src',
			overget: false,
			log: true,



			//--- 未来功能
			tfsDomain : [ 't.alipayobjects.com' ],//
			performanceTime : 2500, //网络连接耗时,
			lowNetTitle : '网络较慢，为您呈现普通质量图片',
			highNetTitle : '网络给力，为您呈现高质量图片',
			netTitleIntervalTime : 180 // 秒，180秒内不重复提示
		},

		/*
		 * 是否是低速网络
		 * */
		isLowNetwork : false,

		/*
		 * 检查浏览器是否支持 WebP 格式图片
		 * Android 4.0+ 支持 webP
		 * */
		isSupportWebP : (function(){
			//因为在钱包内，追求稳定，安全，所以此处只做了版本判断。
			/* 这里可以修改为 var img = new Image();
			 img.onload = 允许webp ;
			 img.onerror = 不允许 webp;
			 img.src = 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAsAAAABBxAREYiI/gcAAABWUDggGAAAADABAJ0BKgEAAQABABwlpAADcAD+/gbQAA==';
			 */
			var version = window.navigator.userAgent.match( /Android\s*(\d+\.\d+)/i ),
				isSupport = false;

			if( version && parseFloat( version[1] )  >= 4.1 ){ // 4.0 透明度有问题
				isSupport = true;
			}

			return isSupport;
		})(),
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
			var self = this,
				lazyOption = document.querySelector('body').getAttribute('data-lazy');
			lazyOption = parseObj(lazyOption);
			this.options = simpleExtend(this.options, lazyOption);
			this.options = simpleExtend(this.options, options);
			this.runLock = true;

			//低网速
			(function(){
				var isLow = false, //低速网络
					timing =  _win.performance && _win.performance.timing ;
				if( timing && timing.connectStart && timing.responseStart){
					if( timing.responseEnd - timing.requestStart > self.options.performanceTime ){
						self.isLowNetwork = true;
					}
				}
			})();

			if (this.options.auto) {
				var initStack = this.getImage();
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

		/*
		 * 根据属性获取图片
		 *
		 * */

		getImage : function( area ){
			area = area || document;

			var lazyAttr = this.options.lazyAttr.split('|'),
				images = area.getElementsByTagName('img'),
				targetImage = [];

			//寻找属性匹配的
			for(var i = 0, len = images.length; i < len ; i++ ){
				for(var j in lazyAttr ){
					if( images[i].getAttribute( lazyAttr[j] ) ){
						targetImage.push( images[i] );
						break;
					}
				}
			}
			return targetImage ;
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
						addStack = this.getImage( addStack );
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

	/*
	 * 是否为 tfs 图片  @元外 2015/04
	 * */
	function lowQualityUrl( url ) {
		var hostReg = lazyload.options.tfsDomain.join('|').replace(/\./g, '\\.');
		var reg = new RegExp('\\:\/\/('+ hostReg +')[a-z0-9\/\\.]+?\\.jpe?g$', 'i');
		if( reg.test( url ) ){
			url += '_q50'; //90 ,75 ,50, 30  todo
		}
		return url;

	}

	/*图片节点执行懒加载时属性变换*/
	function lazyimgReplace(elem, lazyObj) {
		var lazyAttr = lazyObj.options.lazyAttr.split('|'),
			isReplace = false, //是否已经替换过了
			isLowNetwork = lazyload.isLowNetwork, //低速网络
			imgUrl = ''
			;
		// @元外 2015/04
		for( var i in lazyAttr ){
			if ( elem.getAttribute( lazyAttr[i] ) ) {
				//只替换一次
				if( ! isReplace ){
					// 如果是 webp 格式
					if( lazyAttr[i] === 'data-webp-src' && ! lazyload.isSupportWebP ){
						continue;
					}

					imgUrl = elem.getAttribute( lazyAttr[i] );
					//是否 是 低速网络
					if( isLowNetwork ){
						imgUrl = lowQualityUrl( imgUrl );
					}
					elem.src = imgUrl ;
					isReplace = true;
				}
				elem.removeAttribute( lazyAttr[i] );
			}
		}

	}
	/*过滤重复节点或者无效节点*/
	function filter(addStack, lazyObj) {
		var lazyAttr = lazyObj.options.lazyAttr.split('|'),
			hasOneAttr = false // 至少有一个要寻找的属性
			;
		for (var i = addStack.length; i--;) {
			if (lazyObj.matchStack.indexOf(addStack[i]) !== -1) {
				//重复节点删除
				addStack.splice(i, 1);
			} else {
				for( var j in lazyAttr){
					if ( typeof addStack[i].getAttribute( lazyAttr[ j ] ) !== 'undefined'
						&& addStack[i].getAttribute( lazyAttr[ j ] ) !== ''
					) {
						hasOneAttr = true;
					}
				}

				//连一个都没有
				if( ! hasOneAttr ){
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
			return ((elAxis.bottom + offsetPre >= 0 && elAxis.top - offsetPre < viewport.height) && (elAxis.right + offsetPre >= 0 && elAxis.left - offsetPre < viewport.width));
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
})(window);