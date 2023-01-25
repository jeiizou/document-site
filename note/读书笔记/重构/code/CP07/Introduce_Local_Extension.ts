/**
 * 引入本地扩展
 *
 * 需要为服务类提供一些额外函数, 但无法修改这个类
 */

// 使用子类
class MfDateSub extends Date {
    constructor(arg: Date) {
        super(arg.getTime());
    }

    nextDay() {
        return new Date(this.getFullYear(), this.getMonth(), this.getDate() - 1);
    }
}

// 使用包装类
class MfDateWrap {
    private _original: Date;
    constructor(date: string) {
        this._original = new Date(date);
    }

    public getYear() {
        return this._original.getFullYear();
    }
}