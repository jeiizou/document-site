//桥接模式示意

//事件监控中的示例

//抽象的功能
function getBeerById(id, callback) {
    // 通过ID发送请求，然后返回数据
    asyncRequest('GET', 'beer.uri?id=' + id, function (resp) {
        // callback response
        callback(resp.responseText);
    });
}

//实现
addEvent(element, 'click', getBeerByIdBridge);　　

//桥 
function getBeerByIdBridge(e) {　　　　
    getBeerById(this.id, function (beer) {　　　　　　
        console.log('Requested Beer: ' + beer);　　
    });
}

