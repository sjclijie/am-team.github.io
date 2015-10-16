window.AW = window.AW||{};
(function(){
/**
 * @namespace   AW
 *
 * @author      途皖 <xiaochen.lxc@alibaba-inc.com>
 * @version     1.0.0
 * @date        2014-05-27
 */

/**
 * @namespace
 *
 * @memberof    AW
 * @name        AW.InputFormatter
 */

'use strict';

var kbc = {},
	ua = navigator.userAgent.toLowerCase();

/**
 * @desc        格式化内容
 * @access      private
 * @param       {string}    val         需要格式化的值
 * @param       {string}    [rule]      格式化值需要用的规则
 * @returns     {string}    根据规则格式化后的值
 *
 * @memberof    AW.InputFormatter
 *
 * @example
 * formatVal('abcdefghijkmln', '4 ');
 * // returns 'abcd efgh ijkm ln'
 */
function formatVal(val, rule) {
	var result = [];

	if (!rule) {
		return val;
	}

	var // 字符长度集合
		lenLimitUnit = rule.split(/[^\d]+/g),
	// 分隔符集合
		delimUnit = rule.split(/\d+/g),
		limitLen = lenLimitUnit.length;

	if (delimUnit[0] === '') {
		delimUnit.shift();
	}
	if (delimUnit[delimUnit.length - 1] === '') {
		delimUnit.pop();
	}

	// 在字符串中将分割符过滤掉
	var delimPattern = new RegExp('(\\' + delimUnit.join('|\\') + ')', 'g');
	val = val.replace(delimPattern, '');

	var valLen = val.length,
		fullLen = lenLimitUnit.reduce(function (a, b) {
			return (+a) + (+b);
		}),
		loopLen = Math.ceil(valLen / fullLen);

	/**
	 * @desc        将指定的字符片段格式化
	 * @access      private
	 *
	 * @memberof    formatVal
	 */
	function getPartFormat(v) {
		var start = 0, end,
			vlen = v.length,
			vArr = [],
			offset = 0,
			i;

		// 分隔符在前，特殊处理
		if (lenLimitUnit[0] === '') {
			offset = 1;
			vArr.push(delimUnit[0]);
		}

		// 根据长度单元获取字符
		for (i = 0; i < limitLen; i++) {
			if (!lenLimitUnit[i]) {
				continue;
			}

			end = +lenLimitUnit[i] + start;

			// 汇总根据长度分割出的字符片段
			vArr.push(v.slice(start, end));

			// 检测是否在整个字符末尾
			if (end > vlen) {
				break;
			}

			// 加入分隔符
			vArr.push(delimUnit[i + offset]);

			start = end;
		}

		return vArr.join('');
	}

	// 格式化所有字符
	var posMark = 0, j;
	for (j = 0; j < loopLen; j++) {
		result.push(getPartFormat(val.slice(posMark, posMark + fullLen)));
		posMark = posMark + fullLen;
	}

	return result.join('');
}

/**
 * @desc        基于文本框的输入监听
 * @access      private
 * @param       {HTMLInputElement}  ele     要监听的文本框元素
 *
 * @memberof    AW.InputFormat
 */
function bindInputEvent(ele) {
	ele.addEventListener('input', function (e) {
		var formatRules = this.getAttribute('data-format'),
			coord = this.getAttribute('coord'),
			val = this.value,
			fmtVal = formatVal(val, formatRules),
			oldVal = this.getAttribute('oldval') || '',
			selStart = this.selectionStart,
			offset = 0;

		// 修正部分android机光标获取错误问题
		if (ua.indexOf('linux; u') > -1 && fmtVal.length > oldVal.length) {
			selStart++
		}

		if (ua.indexOf('iphone os 6') > -1 && selStart == 0) {
			selStart++;
		}

		// 设置光标偏移量与内容
		if (fmtVal === oldVal && fmtVal.slice(selStart, selStart + 1) === ' ') {
			val = val.slice(0, ((selStart - 1) >= 0 ? selStart - 1 : 0)) + val.slice(selStart);
			fmtVal = formatVal(val, formatRules);
			offset = 1;
		} else if (fmtVal.slice(selStart - 1, selStart) === ' ') {
			if (fmtVal.length > oldVal.length) {
				offset = -1;
			} else if (fmtVal.length < oldVal.length) {
				offset = 1;
			}
		}

		this.value = fmtVal;

		var inp = this,
			setPos;

		if (ua.indexOf('iphone os 6') > -1) {
			// 设置光标位置
			setPos = function () {
				var strLen = 0, temp;
				if (inp.selectionEnd + 1 >= fmtVal.length) {
					strLen = Math.abs(oldVal.length - fmtVal.length);
				} else if ((temp = fmtVal.slice(selStart).length - oldVal.slice(selStart).length) > 0) {
					offset = 0;
					if (fmtVal.slice(selStart, selStart + 1) === ' ') {
						offset = -1;
					} else {
						offset = 0;
					}
					strLen = 1;
				} else {
					strLen = Math.abs(oldVal.slice(0, selStart).length - fmtVal.slice(0, selStart).length);
				}

				if (fmtVal.replace(/\s/g, '') === oldVal.slice(1).replace(/\s/g, '')) {
					offset = 1;
				}

				inp.selectionStart = selStart + strLen - offset;
				inp.selectionEnd = inp.selectionStart;
			};
		} else {
			// 设置光标位置
			setPos = function () {
				inp.selectionStart = selStart + Math.abs(oldVal.slice(0, selStart).length - fmtVal.slice(0, selStart).length) - offset;
				inp.selectionEnd = inp.selectionStart;
			}
		}

		if (ua.indexOf('linux; u') > -1 || ua.indexOf('iphone os 6') > -1) {
			// 延迟设置光标位置，用于修正填充导致的问题
			setTimeout(function () {
				setPos();
			}, 0);
		} else {
			setPos();
		}

		this.setAttribute('oldval', this.value);
	}, false);
}

/**
 * @desc        基于文本框的输入监听
 * @access      private
 * @param       {HTMLInputElement}  ele     要监听的文本框元素
 *
 * @memberof    AW.InputFormat
 */
function bindKbEvent(ele) {
	// 绑定监听事件，便于虚拟键盘动态触发
	ele.addEventListener('inputFormatter', function (e) {
		var val = this.value,
			rule = this.getAttribute('data-format');

		this.value = formatVal(val, rule);
	});
}

/**
 * @desc        输入事件监听
 * @param       {HTMLInputElement[]}    list    要监听的文本框元素
 * @name        AW.InputFormat.listen
 */
kbc.listen = function (list) {
	if (list && !list.length) {
		list = [list];
	}

	// 元素获取
	list = list || document.querySelectorAll('input[data-format]');

	[].forEach.call(list, function (ele, idx) {
		// jQuery 元素容错
		if (ele[0] && ele[0].addEventListener) {
			ele = ele[0];
		}

		// 防重复绑定
		if (ele._InputFormatBinded) {
			return;
		}

		// 格式化初始值
		if (ele.value) {
			ele.value = formatVal(ele.value, ele.getAttribute('data-format'));
		}

		if (ele._customKeyboard) {
			bindKbEvent(ele);
		} else {
			bindInputEvent(ele);
		}

		ele._InputFormatBinded = true;
	});
};

// 文档初始化完成后监听
if (document.readyState === 'complete') {
	kbc.listen();
} else {
	document.addEventListener('DOMContentLoaded', function (e) {
		kbc.listen();
	}, false);
}
var inputFormatter = kbc;

window.AW.inputFormatter = inputFormatter;

})();