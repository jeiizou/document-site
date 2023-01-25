/**
 * 以子类取代类型码
 */

class Employee {
    private type: number;

    static ENGINEER = 0;
    static SALEMAN = 1;
    static MANAGER = 2;

    constructor(type: number) {
        this.type = type;
    }

    getType() {
        return this.type;
    }

    static create(type) {
        switch (type) {
            case Employee.ENGINEER:
                return new Engineer(type);
            case Employee.SALEMAN:
                return new Saleman(type);
            case Employee.MANAGER:
                return new Manager(type);
            default:
                throw new TypeError('Incorrect type code value');
        }
    }
}

// => 重构

class Engineer extends Employee {
    getType() {
        return Employee.ENGINEER
    }
}

class Saleman extends Employee {
    getType() {
        return Employee.SALEMAN
    }
}

class Manager extends Employee {
    getType() {
        return Employee.MANAGER;
    }
}