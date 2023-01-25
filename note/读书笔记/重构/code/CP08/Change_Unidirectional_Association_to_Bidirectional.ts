/**
 * 将单向关联改为双向关联
 */


class Order {
    private customer: Customer;

    public getCustomer() {
        return this.customer;
    }

    public setCustomer(arg: Customer) {
        this.customer = arg;
    }
}

class Customer {

}


// => 重构

// 1. 添加对应关系
class Customer_v1 {
    // 根据两者的关系决定这里的写法: 一对一或者一对多
    private order: Order_v1[];

    setOrder(arg) {
        this.order.push(arg);
    }

    removeOrder(arg) { }
}

// 2. 更新反向指针
class Order_v1 {
    private customer: Customer_v1;

    public setCustomer(arg: Customer_v1) {
        if (this.customer != null) {
            this.customer.removeOrder(this);
        }
        this.customer = arg;
        if (this.customer != null) {
            this.customer.setOrder(this);
        }
    }
}

// 不同的类关系需要不同的修改动作
