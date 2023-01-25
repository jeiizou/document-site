// 自封装字段

class IntRange {
    private low: number
    private high: number

    public include(arg: number) {
        return arg >= this.low && arg <= this.high;
    }

    public grow(factor: number) {
        this.high = this.high * factor;
    }

    constructor(low: number, high: number) {
        this.initialize(low, high);
    }


    public getLow() {
        return this.low;
    }

    public getHigh() {
        return this.high;
    }

    public setLow(arg: number) {
        this.low = arg;
    }

    public setHigh(arg: number) {
        this.high = arg;
    }

    private initialize(low: number, high: number) {
        this.low = low;
        this.high = high;
    }
}

class CappedRange extends IntRange {
    constructor(low: number, high: number, cap: number) {
        super(low, high);
        this.cap = cap;
    }

    private cap: number;

    public getCap() {
        return this.cap;
    }

    public getHigh() {
        return Math.min(super.getHigh(), this.getCap());
    }
}