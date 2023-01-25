// 以对象取代数据值

class Order {
    constructor(customer: string) {
        this.customer = customer;
    }

    private customer: string;

    public getCustomer() {
        return this.customer;
    }

    public setCustomer(arg: string) {
        this.customer = arg;
    }
}

class Customer {
    constructor(name: string) {
        this.name = name;
    }

    private name: string;

    public getName() {
        return this.name;
    }
}

// 重构
class Order_v1 {
    constructor(customerName) {
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

