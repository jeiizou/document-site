//责任链模式

/*职责链 */
var order500 = function (orderType, isPaid, stock) {
    if (orderType === 1 && isPaid === true) {
        console.log("500元定金预购，得到100优惠券");
    } else {
        return "nextSuccessor";
    }
};

var order200 = function (orderType, isPaid, stock) {
    if (orderType === 2 && isPaid === true) {
        console.log("200元定金预购，得到50优惠券");
    } else {
        return "nextSuccessor";
    }
};

var orderNormal = function (orderType, isPaid, stock) {
    if (stock > 0) {
        console.log("普通购买，无优惠券");
    } else {
        console.log("库存不足");
    }
};

Function.prototype.after = function (fn) {
    var self = this;
    return function () {
        var ret = self.apply(this, arguments);
        if (ret === "nextSuccessor") {
            return fn.apply(this, arguments);
        }
        return ret;
    };
}

var order = order500.after(order200).after(orderNormal);
order(1, true, 10);