/**
 * 已查询取代临时变量
 */
function getPrice() {
    let basePrice = this.quantity * this.itemPrice;
    let discountFactor;
    if (basePrice > 1000) discountFactor = 0.95;
    else discountFactor = 0.99;
    return basePrice * discountFactor;
}

// refactor
function getPrice_v1() {
    return basePrice() * discountFactor();
}

function basePrice() {
    return this.quantity * this.itemPrice;
}

function discountFactor() {
    if (basePrice() > 1000) return 0.95;
    else return 0.99;
}