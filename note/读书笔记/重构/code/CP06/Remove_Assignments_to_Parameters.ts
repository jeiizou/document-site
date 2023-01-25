/**
 * 移除对参数的赋值
 */

function discount(inputVal, quantity, yearToDate) {
    if (inputVal > 50) inputVal -= 2;
    if (quantity > 100) inputVal -= 1;
    if (yearToDate > 10000) inputVal -= 4;
    return inputVal;
}

// 以临时变量取代对参数的赋值动作
function discount_v1(inputVal, quantity, yearToDate) {
    let result = inputVal;
    if (inputVal > 50) result -= 2;
    if (quantity > 100) result -= 1;
    if (yearToDate > 10000) result -= 4;
    return result;
}