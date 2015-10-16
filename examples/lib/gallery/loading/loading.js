window.AW = window.AW||{};
(function(){
/**
 *
 * AW.loading
 * @namespace AW
 * @author 叶清 <yeqing@alipay.com>
 * @version 1.0.0
 * @example loading.show('加载中，请稍后');
 *
 * */

'use strict';

var ua = navigator.userAgent;
//var ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A4449d Safari/9537.53 AlipayClient/8.1.0.0422302';

/**
 * @description        容器相关
 *
 */
var _alipayContainer = {
    attr : {
        /**
         * @description 是否在容器内
         *
         * @returns {Boolean}
         *
         */
        isIn : ua.indexOf('AlipayClient') >= 0,
        /**
         * @description 容器版本
         *
         * @returns {Number} 8.x
         *
         */
        version : (function() {
            var version = [].concat(ua.match(/AlipayClient\/([^\s]+)/)||'')[1]||'';
            if (version != '') {
                version = parseFloat(version);
            }
            return version;
        })()
    },
    /**
     * @description 容器api统一调用方法
     *
     */
    callBridge : function () {
        var args = arguments,
            fn = function () {
                var bridge = window.AlipayJSBridge;
                bridge.call.apply(bridge, args);
            };
        window.AlipayJSBridge ? fn() : document.addEventListener("AlipayJSBridgeReady", function () {
            fn();
        }, !1);
    },
    /**
     * @description 检测容器接口是否可用
     *
     * @returns {Boolean}
     *
     */
    checkJSAPI : function (apiName, isPassCallback) {
        //异常判断
        if (typeof(apiName) === 'undefined' || apiName === '') {
            isPassCallback(false);
        }
        //容器版本低于8.1，不支持checkJSAPI方法
        if (this.attr.version < 8.1) {
            if (apiName === 'tradePay' || apiName === 'startApp' || apiName === 'titlebar' || apiName === 'toolbar' || apiName === 'showLoading' || apiName === 'hideLoading' || apiName === 'toast' || apiName === 'login' || apiName === 'sendSMS' || apiName === 'contact') {
                isPassCallback(true);
            } else {
                isPassCallback(false);
            }
        }
        //调用容器checkJSAPI
        this.callBridge('checkJSAPI', {
            api: apiName
        }, function (result) {
            isPassCallback(result.available);
        });
    },
    /**
     * @description 调用容器方法（loading）
     *
     */
    callApi : function (action) {
        //执行容器loading
        if(action === 'show') {
            this.callBridge('showLoading', {
                text: loading.options.message,
                delay: loading.options.showDelay
            });
        } else if(action === 'hide') {
            this.callBridge('hideLoading');
        }

    }
}

/**
 * @desc        js
 * @param       {string|object}    options      调用API参数
 *
 * @memberof    AW.loading
 */
var _loadingSetup = {
    /**
     * @description 初始化
     *
     */
    init: function () {
        //开启容器，在容器内并且容器支持该方法，走容器
        if(loading.options.callContainer === 'true' && _alipayContainer.attr.isIn) {
            _alipayContainer.checkJSAPI('showLoading', function(isPass){
                if(isPass) {
                    _alipayContainer.callApi('show');
                } else {
                    this.setCSS().setHTML().showDelay();
                }
            });
        } else {
            this.setCSS().setHTML().showDelay();
        }
    },
    /**
     * @description 是否第一次设置CSS
     *
     */
    isSetCSS: false,
    /**
     * @description 设置CSS
     *
     */
    setCSS: function () {
        var that = this;
        if (!that.isSetCSS) {
            var style = document.createElement('style');
            style.dataset.amwid = 'loading';
            style.innerHTML = this.CSSText();
            document.head.appendChild(style);
            that.isSetCSS = true;
        }
        return this;
    },
    /**
     * @description 是否第一次设置HTML
     *
     */
    isSetHTML: false,
    /**
     * @description 设置HTML
     *
     */
    setHTML: function () {
        var that = this;
        var HTMLText = this.HTMLText().replace('<%loading-type%>', loading.options.type);
        HTMLText = HTMLText.replace('<%loading-message%>', loading.options.message);
        if (this.isSetHTML) {
            this.loadingDom.innerHTML = HTMLText;
        } else {
            var loadingDom = document.createElement('div');
            loadingDom.className = 'am-loading am-loading-hide';
            loadingDom.innerHTML = HTMLText;
            document.body.appendChild(loadingDom);
            this.loadingDom = loadingDom;
            this.isSetHTML = true;
        }
        return this;
    },
    /**
     * @description 显示loading
     *
     */
    show: function () {
        this.hide();
        this.loadingDom.classList.remove('am-loading-hide');
        this.loadingDom.classList.add('am-loading-show');
    },
    /**
     * @description 隐藏loading
     *
     */
    hide: function () {
        var that = this;
        function hideLoading(){
            clearTimeout(that.showDelayTimeout);
            if (that.loadingDom) {
                that.loadingDom.classList.remove('am-loading-show');
                that.loadingDom.classList.add('am-loading-hide');
            }
        }

        //开启容器，在容器内并且容器支持该方法，走容器方法
        if(loading.options.callContainer === 'true' && _alipayContainer.attr.isIn) {
            _alipayContainer.checkJSAPI('hideLoading', function(isPass){
                if(isPass) {
                    _alipayContainer.callApi('hide');
                } else {
                    hideLoading();
                }
            });
        } else {
            hideLoading();
        }

    },
    showDelayTimeout: {},
    /**
     * @description 延时隐藏loading
     *
     */
    showDelay: function () {
        var that = this;
        if (!isNaN(parseFloat(loading.options.showDelay)) && parseFloat(loading.options.showDelay) > 0) {
            that.showDelayTimeout = window.setTimeout(function () {
                that.show();
            }, parseFloat(loading.options.showDelay));
        } else {
            that.show();
        }
    }
}

/**
 * @desc        基本调用方法
 * @param       {string|object}    options      调用API参数
 *
 * @memberof    AW.loading
 */
var loading = {}

/**
 * @description 默认配置参数
 *
 * @param {String} message - 默认文案
 * @param {String} showDelay - 延迟隐藏时间（毫秒）
 * @param {Boolean} callContainer - 是否开启容器native调用
 *
 * @memberof    AW.loading
 *
 */
loading.options = {
    'message': '',
    'showDelay': '0',
    'callContainer': true
}
/**
 * @description        loading
 * @param {string|object} options
 *
 * @memberof    AW.loading
 */
loading.show = function (options) {
    //对象 参数覆盖
    if (typeof(options) === 'object') {
        for (var p in options) {
            this.options[p] = options[p];
        }
        _loadingSetup.init();
    }
    //字符串 直接替换message
    else if (typeof(options) === 'string') {
        this.options.message = options;
        _loadingSetup.init();
    }
}
/**
 * @description        隐藏loading
 *
 * @memberof    AW.loading
 */
loading.hide = function () {
    _loadingSetup.hide();
}

/**
 * @description        CSSText
 *
 */
_loadingSetup.CSSText = function () {
    var csstext = '.am-loading{position:fixed;z-index:100;top:45%;width:100%;height:1px;text-align:center;font-size:16px;font-family:sans-serif;}' +
        '.am-loading .am-loading-text{display:inline-block;margin:-24px auto auto;padding:9px 20px;border-top-left-radius:5px;border-top-right-radius:5px;border-bottom-left-radius:5px;border-bottom-right-radius:5px;-webkit-background-clip:padding-box;color:#FFF;background-color:rgba(0,0,0,0.8);}' +
        '.am-loading .am-loading-text .iconfont{font-size:16px;}' +
        '.am-loading-show{display:block;}' +
        '.am-loading-hide{display:none;}' +
        '.am-loading .am-icon-error,.am-loading .am-icon-success{display:inline-block;height:15px;vertical-align:middle;}' +
        '.am-loading .am-icon-error:before,.am-loading .am-icon-success:before{content:"";display:block;width:100%;height:100%;background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAUCAYAAADLP76nAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyQzM4RDk3M0NEMzkxMUUzOTA5QkQ5NjEwMTU4QkI2MCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoyQzM4RDk3NENEMzkxMUUzOTA5QkQ5NjEwMTU4QkI2MCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjJDMzhEOTcxQ0QzOTExRTM5MDlCRDk2MTAxNThCQjYwIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjJDMzhEOTcyQ0QzOTExRTM5MDlCRDk2MTAxNThCQjYwIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+wRxj8gAAAclJREFUeNrEl79KxEAQxnPnO9gJhwgWiiDKgeIf0HdI7OysLA4ULxbqNVd4gmBhJVrY6UP4AL6BIIp4WFxQVLSTi9/iHKzrJNnZcHHgl4RkJvt9kOzsluI49ijq4B5cerLwQQW0vP8IZQCE8U98AZ/u2eBTjYq6oE7KAFij869nHg2sh60JXXwvtvogvgRO6f3npgl1WGGEZJnwE2qCPog/McY5A2XdgNREkeKP479xCwZNA7YmihR/xIi/A0PmJ2RroijxikNG/AOocD+xrQmp+Bo4cBDfYsQ/gmEuP+klnAmJ+HXQpdymQHyTGasNRpJq0l4WJJjIEr+qie9Fw0J8gxnrCYym1ZXTepzjs2sQGff2wG5KzQ7l6NEBy+DGphPbTJWSPjEGOkxdyOSGTJ6qHbf57CRNStrsJkDEiNvUcjaY5xHVei4GgpTZJnAwMQmeGZE1wowXqvFcDAQWU6WLiSnwatR0mR9d5UxLp12J+DwmqowJU3zVpelJxecxMQPeGPHvYNa1a3OzgO3ygDORtSeYAx9avrqez7Ps6F1sO65tdBOhZc0C+CQW866bStqWMqQt5YVwUxfQlnJfULNE56u8O8pvAQYAUnCy4ged31IAAAAASUVORK5CYII=") no-repeat;-webkit-background-size:32px auto;}' +
        '.am-loading .am-icon-error{width:13px;}' +
        '.am-loading .am-icon-error:before{background-position:0 0;}' +
        '.am-loading .am-icon-success{width:16px;}' +
        '.am-loading .am-icon-success:before{background-position:-14px 0;}';
    return csstext;
}
/**
 * @description        HTMLText
 *
 */
_loadingSetup.HTMLText = function() {
    var htmltext = '<div class="am-loading-text"><span class="am-icon-loading"></span> <%loading-message%></div>';
    return htmltext;
}

window.AW.loading = loading;
})();