//空对象模式 示意

class RealCustomer {
    constructor(name) {
        this.name = name;
    }
    getName() {
        return this.name;
    }
    isNil() {
        return false;
    }
}

class NullCustomer {
    getName() {
        return "Not availble in customer DataBase";
    }
    inNil() {
        return true;
    }
}

class CustomerFactory {
    constructor() {
        this.names = ["Rob", "Joe", "Julie"];
    }
    getCustomer(name) {
        for (let i = 0; i < this.names.length; i++) {
            const el = this.names[i];
            if (el == name) {
                return new RealCustomer(name);
            }
        }
        return new NullCustomer();
    }
}

(function () {
    let cusfac=new CustomerFactory();
    let customer1 = cusfac.getCustomer("Rob");
    let customer2 = cusfac.getCustomer("Joe");
    let customer3 = cusfac.getCustomer("Julie");
    let customer4 = cusfac.getCustomer("Laura");

    console.log(customer1.getName());
    console.log(customer2.getName());
    console.log(customer3.getName());
    console.log(customer4.getName());
})()