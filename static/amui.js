//搜索-输入状态和按钮激活联动
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var searchInputField = document.querySelectorAll('.am-search');
        if(searchInputField){
            Array.prototype.forEach.call(searchInputField, function (elem) {
                var searchTrigger = elem.querySelector('.am-search-button .am-button');
                var searchInput = elem.querySelector('input[type="text"],input[type="password"],input[type="number"],input[type="tel"],input[type="email"],input[type="url"],input[type="search"]');
                if (searchTrigger && searchInput) {
                    searchActive(searchInput,searchTrigger);
                    searchInput.addEventListener('input', function () {
                        searchActive(searchInput,searchTrigger);
                    }, false);
                    function toggleClass (elem,className,switchClass) {
                        elem.className=elem.className.replace(className,switchClass);
                    }
                    function searchActive(elem,trigger){
                        if(elem.value.length > 0){
                            trigger.setAttribute('disabled','');
                            toggleClass(trigger,'am-button-white','am-button-blue');
                        }else{
                            trigger.setAttribute('disabled','disabled');
                            toggleClass(trigger,'am-button-blue','am-button-white');
                        }
                    }
                }
            }); 
        }
    }, false);
})();
//输入清除功能
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var autoClearFiled = document.querySelectorAll('.am-input-autoclear');
        if(autoClearFiled){
            Array.prototype.forEach.call(autoClearFiled, function (elem) {
                var clearTrigger = elem.querySelector('.iconfont-clear');
                var clearInput = elem.querySelector('input[type="text"],input[type="password"],input[type="number"],input[type="tel"],input[type="email"],input[type="url"],input[type="search"]');
                if (clearTrigger && clearInput) {
                    if (clearInput.value.length > 0) {
                        clearTrigger.style.visibility = 'visible';
                    }
                    clearTrigger.addEventListener('click', function () {
                        clearInput.value = '';
                        clearInput.focus();
                        clearTrigger.style.visibility = 'hidden';
                    }, false);
                    clearInput.addEventListener('input', function () {
                        clearTrigger.style.visibility = (clearInput.value.length > 0) ? 'visible' : 'hidden';
                    }, false);
                }
            });           
        }
    }, false);
})();
//6位便捷密码框需要逻辑：实现输入框超过或者达到六个时，自动聚焦到第6个
(function () {
    document.addEventListener("DOMContentLoaded", function () {
        var amPWNode=document.querySelectorAll('.am-password-handy');
        if(amPWNode){
            Array.prototype.forEach.call(amPWNode, function (elem) {
                var PWInput=elem.querySelector('input[type="password"],input[type="tel"]')
                    ,securityBox=elem.querySelector('.am-password-handy-security')
                    ,securityNodes=securityBox.querySelectorAll('li i')
                    ,securityTimer
                    ,cacheInput='';
                if(PWInput.value.length>0){
                    securityText(false);
                }
                //Android 2.1中，opacity:0不能点击聚焦，补充下层点击代替聚焦。
                securityBox.addEventListener('click',function(){
                    PWInput.focus();
                },false);
                PWInput.addEventListener('focus',function(){
                    //focus后，需要一个同步的异步计数器抢占进程，使聚焦在你需要的位置上，而不是最前面
                    setTimeout(inputFocus,0);
                },false);
                PWInput.addEventListener('keyup',function(e){
                    var keycode = e.which;
                    var needEcho=true;
                    if (keycode === 8 || keycode === 46){ //如果按下退格或者删除键
                        needEcho=false;
                    }
                    securityText(needEcho);
                },false);
                //needEcho是否回显最后输入
                function securityText(needEcho){
                    var inputLen=PWInput.value.length;
                    for(var index=securityNodes.length;index--;){
                        securityNodes[index].style.visibility=(index<inputLen)?'visible':'hidden';
                        securityNodes[index].innerHTML='';
                    }
                    if(PWInput.getAttribute('data-cache')!=='false' && PWInput.getAttribute('data-cache')!=='0'){
                        clearTimeout(securityTimer);
                        if(needEcho&&cacheInput.length<inputLen&&inputLen>0){
                            securityNodes[inputLen-1].innerHTML=PWInput.value[inputLen-1];
                            securityTimer=setTimeout(function(){
                                securityNodes[inputLen-1].innerHTML='';
                            },2000);
                        }
                        cacheInput=PWInput.value;
                    }
                }
                function inputFocus(){
                    var len = PWInput.value.length;
                    try{
                        PWInput.setSelectionRange(len, len);
                    }catch(ex){}
                }           
            });
        }   
    }, false);
})();