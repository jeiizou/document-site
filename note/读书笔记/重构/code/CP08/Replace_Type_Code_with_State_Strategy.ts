/**
 * 以 State/Strategy 取代类型码
 */

class Employee {
    private type: number;
    private monthlySalary = 1000;
    private commission = 100;
    private bonus

    static ENGINEER = 0;
    static SALEMAN = 1;
    static MANAGER = 2;

    constructor(type: number) {
        this.type = type;
    }

    public payAmount() {
        switch (this.type) {
            case Employee.ENGINEER:
                return this.monthlySalary;
            case Employee.SALEMAN:
                return this.monthlySalary + this.commission;
            case Employee.MANAGER:
                return this.monthlySalary + this.bonus;
            default:
                throw new TypeError("Incorrect Employee");
        }
    }
}

// => 重构

class Employee_v1 {

    private type: EmployeeType;
    private monthlySalary = 1000;
    private commission = 100;
    private bonus = 50;

    constructor(type: number) {
        this.setType(type);
    }

    getType() {
        return this.type.getTypeCode();
    }

    setType(type: number) {
        switch (type) {
            case Employee.ENGINEER:
                this.type = new Engineer();
            case Employee.SALEMAN:
                this.type = new Saleman();
            case Employee.MANAGER:
                this.type = new Manager();
            default:
                throw new TypeError("Incorrect Employee");
        }
    }

    public payAmount() {
        switch (this.getType()) {
            case EmployeeType.ENGINEER:
                return this.monthlySalary;
            case EmployeeType.SALEMAN:
                return this.monthlySalary + this.commission;
            case EmployeeType.MANAGER:
                return this.monthlySalary + this.bonus;
            default:
                throw new TypeError("Incorrect Employee");
        }
    }


}

abstract class EmployeeType {
    abstract getTypeCode();

    static newType(code: number) {
        switch (code) {
            case EmployeeType.ENGINEER:
                return new Engineer();
            case EmployeeType.SALEMAN:
                return new Saleman();
            case EmployeeType.MANAGER:
                return new Manager();
            default:
                throw new TypeError("Incorrect Employee");
        }
    }


    static ENGINEER = 0;
    static SALEMAN = 1;
    static MANAGER = 2;
}


class Engineer extends EmployeeType {
    public getTypeCode() {
        return EmployeeType.ENGINEER;
    }
}

class Manager extends EmployeeType {
    public getTypeCode() {
        return EmployeeType.MANAGER;
    }
}

class Saleman extends EmployeeType {
    public getTypeCode() {
        return EmployeeType.SALEMAN
    }
}

