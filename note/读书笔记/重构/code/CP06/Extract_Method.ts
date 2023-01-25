/**
 * Extract Method
 */

// Demo01: 无局部变量

// before
function printOwing_v1() {
    let e = this.order.elements();
    let outstanding = 0.0;

    // print banner
    console.log('*********************');
    console.log('****Customer Owes****');
    console.log('*********************');

    // calculate outstanding
    while (e.hasMoreElemnets()) {
        let each = e.nextElement();
        outstanding += each.getAmount();
    }

    // print details
    console.log("name:" + this.name);
    console.log("amount" + outstanding);
}

// after
function printOwing_v2() {
    let e = this.order.elements();
    let outstanding = 0.0;

    printBanner()

    // calculate outstanding
    while (e.hasMoreElemnets()) {
        let each = e.nextElement();
        outstanding += each.getAmount();
    }

    // print details
    console.log("name:" + this.name);
    console.log("amount" + outstanding);
}

function printBanner() {
    // print banner
    console.log('*********************');
    console.log('****Customer Owes****');
    console.log('*********************');
}

// demo02: 有局部变量
function printOwing_v3() {
    let e = this.order.elements();
    let outstanding = 0.0;

    printBanner()

    // calculate outstanding
    while (e.hasMoreElemnets()) {
        let each = e.nextElement();
        outstanding += each.getAmount();
    }

    printDetails(outstanding);
}

function printDetails(outstanding) {
    // print details
    console.log("name:" + this.name);
    console.log("amount" + outstanding);
}

// demo03:  对局部变量再复制
function printOwing_v4(preAmount) {
    printBanner()
    let outstanding = preAmount;
    outstanding = getOutStanding(outstanding);
    printDetails(outstanding);
}

function getOutStanding(initialValue) {
    let e = this.order.elements();
    let result = initialValue;
    // calculate outstanding
    while (e.hasMoreElemnets()) {
        let each = e.nextElement();
        result += each.getAmount();
    }
    return result;
}

