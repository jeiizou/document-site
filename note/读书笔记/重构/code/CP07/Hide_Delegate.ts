/**
 * 隐藏委托关系
 */

class Person {
    _department: Department;

    public getDepartment(): Department {
        return this._department;
    }

    public setDepartment(arg: Department) {
        this._department = arg;
    }
}


class Department {
    private _chargeCode: string;
    private _manager: Person;

    constructor(manager: Person) {
        this._manager = manager;
    }

    public getManager(): Person {
        return this._manager;
    }
}


// 重构
class Person_v1 {
    _department: Department;

    public getDepartment(): Department {
        return this._department;
    }

    public setDepartment(arg: Department) {
        this._department = arg;
    }

    public getGetManager() {
        return this._department.getManager();
    }
}

