/**
 * 将引用对象改为值对象
 */

class Currency {
    static get(code: string) {
        return new Currency(code);
    }

    private code: string;

    public getCode() {
        return this.code;
    }

    private constructor(code: string) {
        this.code = code;
    }

    public equals(arg) {
        if (!(arg instanceof Currency)) return false;
        return this.code === arg.code;
    }
}

// use
let usd = Currency.get('USD');