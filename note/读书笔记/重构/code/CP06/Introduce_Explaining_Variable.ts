/**
 * 引入解释性变量
 */

function price() {
    return this.quantity * this.itemPrice -
        Math.max(0, this.quantity - 500) * this.itemPrice * 0.05 +
        Math.min(this.quantity * this.itemPrice * 0.1, 100.0);
}


// 提取解释性变量
function price_v1() {
    const basePrice = this.quantity * this.itemPrice;
    const quantityDiscount = Math.max(0, this.quantity - 500) * this.itemPrice * 0.05;
    const shipping = Math.min(basePrice * 0.1, 100.0);
    return basePrice - quantityDiscount + shipping;
}

// 提取函数
function price_v2() {
    return basePrice() - quantityDiscount() + shipping();
}

function basePrice() {
    return this.quantity * this.itemPrice;
}

function shipping() {
    return Math.min(basePrice() * 0.1, 100.0)
}

function quantityDiscount() {
    return Math.max(0, this.quantity - 500) * this.itemPrice * 0.05;
}