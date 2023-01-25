// 命令模式示意

//发送者
var setCommond=function(button,fn){
    button.onClick=function(){
        fn();
    }
};
//执行者
var menu={
    reFresh:function(){
        console.log('reFresh');
    }
}
//命令对象
var CommondObj=function(reciver){
    return function(){
        reciver.reFresh();
    }
}
var commonObj=CommondObj(menu);

setCommond(btn,commonObj);

