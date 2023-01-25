/**
 * 将值对象改为引用对象
 */

class Customer {
    constructor(name: string) {
        this.name = name;
    }

    private name: string;

    public getName() {
        return this.name;
    }
}

class Order {
    constructor(customerName: string) {
        this.customer = new Customer(customerName);
    }

    private customer: Customer;
    public getCustomerName() {
        return this.customer.getName();
    }

    public setCustomer(arg: string) {
        this.customer = new Customer(arg);
    }
}


// 重构
class Customer_v1 {
    public static create(name: string) {
        if (!this.instance) {
            this.instance = new Customer_v1(name);
        }
        return this.instance;
    }

    private static instance: Customer_v1;

    private constructor(name: string) {
        this.name = name;
    }

    private name: string;

    public getName() {
        return this.name;
    }
}

class Order_v1 {
    constructor(customerName: string) {
        this.customer = Customer_v1.create(customerName);
    }

    private customer: Customer_v1;
    public getCustomerName() {
        return this.customer.getName();
    }

    public setCustomer(arg: string) {
        this.customer = Customer_v1.create(arg);
    }
}