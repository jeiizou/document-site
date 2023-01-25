//单例模式示意
class Singleton {
    constructor(name) {
        this.name = name;
        this.instance = null;
    }
    // 构造一个广为人知的接口，供用户对该类进行实例化
    static getInstance(name) {
        if(!this.instance) {
            this.instance = new Singleton(name);
        }
        return this.instance;
    }
}

(function main(){
    let singleon=Singleton.getInstance('I\'m single');
    console.log(singleon.name);

    let singleton2=Singleton.getInstance('I\'m single2');
    console.log(singleton2.name);

    console.log(singleon===singleton2);
})()