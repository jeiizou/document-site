/**
 * 提炼类
 */

class Person {
    public getName() {
        return this.name;
    }

    public getTelephoneNumber() {
        return ("(" + this.officeAreaCode + ")" + this.officeNumber);
    }

    public getOfficeAreaCode() {
        return this.officeAreaCode;
    }

    public setOfficeAreaCode(arg: string) {
        this.officeAreaCode = arg;
    }

    public getOfficeNumber() {
        return this.officeNumber;
    }

    public setOfficeNumber(arg: string) {
        this.officeNumber = arg;
    }


    private name: string;
    private officeAreaCode: string;
    private officeNumber: string;
}


// 提炼phone到单独的类

class TelephoneNumber {
    public getAreaCode() {
        return this.areaCode;
    }

    public setAreaCode(arg: string) {
        this.areaCode = arg;
    }

    public getNumber() {
        return this.number;
    }

    public setNumber(arg: string) {
        this.number = arg;
    }

    private areaCode: string;
    private number: string;
}


class Person_v1 {
    public getName() {
        return this.name;
    }

    public getTelephoneNumber() {
        return ("(" + this.officeTelephone.getAreaCode() + ")" + this.officeTelephone.getNumber());
    }

    private name: string;
    private officeTelephone = new TelephoneNumber();
}