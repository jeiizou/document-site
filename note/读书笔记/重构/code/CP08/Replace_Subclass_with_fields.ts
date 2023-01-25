/**
 * 以字段取代子类
 */
abstract class Person {
    abstract isMale(): boolean;
    abstract getCode(): string;
}

class Male extends Person {
    isMale() {
        return true;
    }

    getCode() {
        return 'M';
    }
}

class Female extends Person {
    isMale() {
        return false;
    }

    getCode() {
        return 'F'
    }
}

// => 重构

class Person_v1 {
    static createMale() {
        return new Male();
    }

    static createFemale() {
        return new Female();
    }

    private isMale: boolean;
    private code: string;

    constructor(isMale: boolean, code: string) {
        this.isMale = isMale;
        this.code = code;
    }
}

class Male_v1 extends Person_v1 {
    constructor() {
        super(true, 'M')
    }
}

class Female_v1 extends Person_v1 {
    constructor() {
        super(false, 'F')
    }
}

let kent = Person_v1.createMale();