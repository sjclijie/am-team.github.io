window.AW = window.AW||{};
(function(){
/**
 *
 * AW.dialog
 * @namespace AW
 * @author 叶清 <yeqing@alipay.com>
 * @version 1.0.0
 * @example AW.dialog.show('您的资金已经成功转入！');
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
     * @description 调用容器方法（dialog）
     *
     */
    callApi : function () {
        if (dialog.options.type === 'alert') {
            this.callBridge('alert', {
                title  : dialog.options.title,
                message: dialog.options.message,
                button : dialog.options.okButton
            }, function () {
                var result = {};
                result.ok = true;
                dialog.callback(result);
            });
        } else if(dialog.options.type === 'confirm') {
            AlipayJSBridge.call('confirm', {
                title       : dialog.options.title,
                message     : dialog.options.message,
                okButton    : dialog.options.okButton,
                cancelButton: dialog.options.cancelButton
            }, function (result) {
                dialog.callback(result);
            });
        }
    }
}

/**
 * @desc        js
 * @param       {string|object}    options      调用API参数
 *
 * @memberof    AW.dialog
 */
var _dialogSetup = {
    /**
     * @description 初始化
     *
     */
    init: function () {
        //开启容器，在容器内并且容器支持该方法，走容器
        if(dialog.options.callContainer === 'true' && _alipayContainer.attr.isIn) {
            _alipayContainer.checkJSAPI(dialog.options.type, function(isPass){
                if(isPass) {
                    _alipayContainer.callApi();
                } else {
                    this.setCSS().setHTML().show();
                }
            });
        } else {
            this.setCSS().setHTML().show();
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
            style.dataset.amwid = 'dialog';
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
        var HTMLText = this.HTMLText().replace('<%dialog-title%>', dialog.options.title);
        HTMLText = HTMLText.replace('<%dialog-message%>', dialog.options.message);
        if (this.isSetHTML) {
            this.dialogDom.innerHTML = HTMLText;
        } else {
            //dialogDom
            var dialogDom = document.createElement('div');
            dialogDom.className = 'am-dialog am-dialog-hide';
            dialogDom.innerHTML = HTMLText;
            document.body.appendChild(dialogDom);
            this.dialogDom = dialogDom;

            //dialogMaskDom
            var dialogMaskDom = document.createElement('div');
            dialogMaskDom.className = 'am-dialog-mask am-dialog-mask-hide';
            document.body.appendChild(dialogMaskDom);
            this.dialogMaskDom = dialogMaskDom;

            this.isSetHTML = true;
        }
        this.setButton();
        return this;
    },
    /**
     * @description 设置Button
     *
     */
    setButton : function(){
        var that = this;
        //创建按钮Dom
        var cancelButtonHTMLText = this.cancelButtonHTMLText().replace('<%dialog-cancelButton%>', dialog.options.cancelButton);
        var okButtonHTMLText = this.okButtonHTMLText().replace('<%dialog-okButton%>', dialog.options.okButton);

        //区分alert&confirm
        if(dialog.options.type === 'alert'){
            this.dialogDom.querySelector(".am-dialog-button-container").innerHTML = okButtonHTMLText;
        } else if (dialog.options.type === 'confirm') {
            this.dialogDom.querySelector(".am-dialog-button-container").innerHTML = cancelButtonHTMLText + okButtonHTMLText;
        }

        //绑定事件，增加回调
        if(dialog.options.type === 'confirm'){
            var cancelButtonEvent = function (ele) {
                var result = {};
                result.ok = false;
                dialog.callback(result);
                that.hide();
            }
            this.dialogDom.querySelector("#J-dialog-cancel").addEventListener("click", cancelButtonEvent, false);
        }

        var okButtonEvent = function (ele) {
            var result = {};
            result.ok = true;
            dialog.callback(result);
        }
        this.dialogDom.querySelector("#J-dialog-ok").addEventListener("click", okButtonEvent, false);
    },
    /**
     * @description 显示dialog
     *
     */
    show: function () {
        this.hide();
        this.dialogDom.classList.remove('am-dialog-hide');
        this.dialogDom.classList.add('am-dialog-show');
        this.dialogMaskDom.classList.remove('am-dialog-mask-hide');
        this.dialogMaskDom.classList.add('am-dialog-mask-show');
    },
    /**
     * @description 隐藏dialog
     *
     */
    hide: function () {
        if (this.dialogDom) {
            this.dialogDom.classList.remove('am-dialog-show');
            this.dialogDom.classList.add('am-dialog-hide');
            this.dialogMaskDom.classList.remove('am-dialog-mask-show');
            this.dialogMaskDom.classList.add('am-dialog-mask-hide');
        }
    }
}

/**
 * @desc        基本调用方法
 * @param       {string|object}    options      调用API参数
 *
 * @memberof    AW.dialog
 */
var dialog = {}

/**
 * @description 默认配置参数
 *
 * @param {String} message - 默认文案
 * @param {String} type - 类型（none | success | error）
 * @param {String} hideDelay - 延迟隐藏时间（毫秒）
 * @param {Boolean} callContainer - 是否开启容器native调用
 *
 * @memberof    AW.dialog
 *
 */
dialog.options = {
    'title'        : '',
    'message'      : '',
    'type'         : 'alert',
    'okButton'     : '确定',
    'cancelButton' : '取消',
    'callContainer': true
}
/**
 * @description        回调函数
 *
 * @memberof    AW
 */
dialog.callback = function(){};
/**
 * @description        显示dialog
 * @param {string|object} options
 *
 * @memberof    AW
 */
dialog.show = function (options, fn) {
    //对象 参数覆盖
    if (typeof(options) === 'object') {
        for (var p in options) {
            this.options[p] = options[p];
        }
        if(!options.title || options.title === '') { this.options.title = '' }
        if(!options.type || options.type === '') { this.options.type = 'alert' }
        if(!options.okButton || options.okButton === '') { this.options.okButton = '确定' }
        if(!options.cancelButton || options.cancelButton === '') { this.options.cancelButton = '取消' }
    }
    //字符串 直接替换message
    else if (typeof(options) === 'string') {
        this.options.message = options;
        this.options.title = '';
        this.options.type = 'alert';
        this.options.okButton = '确定';
        this.options.cancelButton = '取消';
    }
    if(typeof(fn) === 'function') {
        this.callback = fn;
    } else {
        this.callback = null;
    }
    _dialogSetup.init();
}
/**
 * @description        显示dialog
 * @param {string|object} options
 *
 * @memberof    AW
 */
dialog.alert = function (message, fn) {
    var options = {};
    options.type = 'alert';
    options.message = message;
    dialog.show(options, fn);
}
/**
 * @description        显示dialog
 * @param {string|object} options
 *
 * @memberof    AW
 */
dialog.confirm = function (message, fn) {
    var options = {};
    options.type = 'confirm';
    options.message = message;
    dialog.show(options, fn);
}
/**
 * @description        隐藏dialog
 *
 * @memberof    AW.dialog
 */
dialog.hide = function () {
    _dialogSetup.hide();
}

/**
 * @description        CSSText
 *
 */
_dialogSetup.CSSText = function () {
    var csstext = '.am-dialog{-webkit-box-sizing:border-box;-ms-box-sizing:border-box;box-sizing:border-box;position:fixed;top:45%;z-index:101;width:100%;padding:0 20px;margin-top:-80px}' +
        '.am-dialog-show,.am-dialog-mask-show{display:block;}' +
        '.am-dialog-hide,.am-dialog-mask-hide{display:none;}' +
        '.am-dialog p{margin:14px 0 24px 0;text-align:center}' +
        '.am-dialog-title{padding-top:7px;text-align:center;font-weight:700}' +
        '.am-dialog-content{margin:auto;max-width:320px;padding:10px;background:#e8e8e8;border-radius:8px}' +
        '.am-dialog-mask{position:fixed;top:0;left:0;z-index:99;width:100%;height:100%;background:rgba(0,0,0,0.5)}'
    return csstext;
}
/**
 * @description        dialog HTMLText
 *
 */
_dialogSetup.HTMLText = function() {
    var htmltext = '<div class="am-dialog-content">'
        + '    <div class="am-dialog-title"><%dialog-title%></div>'
        + '    <p><%dialog-message%></p>'
        + '    <div class="am-dialog-button-container am-flexbox am-flexbox-average"></div>'
        + '</div>'
    return htmltext;
}
/**
 * @description        mask HTMLText
 *
 */
_dialogSetup.maskHTMLText = function() {
    var htmltext = '<div class="am-dialog-mask"></div>'
    return htmltext;
}
/**
 * @description        cancelButton HTMLText
 *
 */
_dialogSetup.cancelButtonHTMLText = function() {
    var htmltext = '<div class="am-flexbox-item"><button type="button" id="J-dialog-cancel"  class="am-button am-button-white"><%dialog-cancelButton%></button></div>'
    return htmltext;
}
/**
 * @description        okButton HTMLText
 *
 */
_dialogSetup.okButtonHTMLText = function() {
    var htmltext = '<div class="am-flexbox-item"><button type="button" id="J-dialog-ok" class="am-button am-button-blue"><%dialog-okButton%></button></div>'
    return htmltext;
}

window.AW.dialog = dialog;
})();