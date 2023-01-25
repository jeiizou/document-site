// 外观模式示意

function startCPU(){
    console.log('CPU started');
}

function startMainboard(){
    console.log('MainBoard started');
}

function startPower(){
    console.log('Power started');
}

//外部接口
function startComputer(){
    startCPU();
    startMainboard();
    startPower();
}

(function main(){
    //调用外部接口
    startComputer();
})()