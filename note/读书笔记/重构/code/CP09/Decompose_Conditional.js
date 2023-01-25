/**
 * 分解独立表达式
 */

if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
    charge = quantity * _winterRate + _winterServiceCharge;
} else {
    charge = quantity * _summerRate
}


// => 重构
if (notSummer(date)) {
    charge = winterCharge(quantity);
} else {
    charge = summerCharge(quantity);
}

function notSummer(date) {
    return date.before(SUMMER_START) || date.after(SUMMER_END);
}

function winterCharge(quantity) {
    return quantity * _winterRate + _winterServiceCharge;
}

function summerCharge(quantity) {
    return quantity * _summerRate;
}