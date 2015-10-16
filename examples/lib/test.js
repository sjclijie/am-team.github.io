function showRet(content) {
//	clearRet(this);
	content = typeof content === "undefined" ? "undefined" : content;
	$(this).parent().find(".ret").html(typeof content === "object" ? JSON.stringify(content) : content);
}

function clearRet(context) {
	$(context).parent().find(".ret").html("");
}

function createUnitLayout() {
	testUnits.forEach(function (unit, index) {
		$("#tests").append(paresTpl(testUnits[index], index));
	});

}

function paresTpl(data, count) {
//        var id = "testId_" + 1000 + parseInt(Math.random() * 8999);
	var tpl = $(".tpl").clone(true).removeClass("tpl").show().html();
	for (var name in data) {
		if (name === "command") {
			tpl = tpl.replace("$$" + name, "testUnits[" + count + "].command(this)");
		} else {
			tpl = tpl.replace("$$" + name, typeof data[name] === "function" ? data[name]() : data[name]);
		}
	}
	return tpl;
}