/**
 * 以函数对象取代函数
 */

class Account {


    gamma(inputVal, quantity, yearToDate) {
        console.log('this is gamma');
    }
}


// => refact


// 提取函数对象
class Gamma {
    _account: Account;
    inputVal;
    quantity;
    yearToDate;

    constructor(inputVal, quantity, yearToDate) { }

    print() {
        console.log('this is gamma');
    }
}

// 修改旧函数

class Account_v1 {
    gamma(inputVal, quantity, yearToDate) {
        return new Gamma(inputVal, quantity, yearToDate)
    }
}
