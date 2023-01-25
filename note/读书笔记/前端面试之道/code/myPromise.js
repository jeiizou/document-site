// 手动实现一个Promise

//三种状态

const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

//promise 接受一个函数参数, 该函数会立即执行
function MyPromise(fn) {
    let _this = this;
    _this.currentState = PENDING;
    _this.value = undefined;
    //用于保存then中的回调, 只有当promise状态为pending时才会缓存, 并且每个实例至多缓存一个
    _this.resolvedCallbacks = [];
    _this.rejectedCallbacks = [];

    _this.resolve = function(value) {
        if (value instanceof MyPromise) {
            //如果value是个Promise, 递归执行
            return value.then(_this.resolve, _this.reject);
        }
        setTimeout(() => {
            //异步执行, 保证执行顺序
            if (_this.currentState === PENDING) {
                _this.currentState = RESOLVED;
                _this.value = value;
                _this.resolvedCallbacks.forEach(cb => cb());
            }
        });
    };

    _this.reject = function(reason) {
        setTimeout(() => {
            //异步执行, 保证执行顺序
            if (_this.currentState === PENDING) {
                _this.currentState = REJECTED;
                _this.value = reason;
                _this.rejectedCallbacks.forEach(cb => cb());
            }
        });
    };
    //用于解决: new Promise(()=> throw Error(error))
    try {
        fn(_this.resolve, _this.reject);
    } catch (e) {
        _this.reject(e);
    }
}

MyPromise.prototype.then = function(onResolved, onRejeted) {
    var self = this;
    //规范2.2.7, then必须返回一个新的promise
    var promise2;
    //规范2.2 onResolved 和 onRejected 都为可选参数
    //如果类型不是函数需要忽略, 同时也实现了透传
    //Promise.resolve(4).then().then((value)=>console.log(value))
    onResolved = typeof onResolved === 'function' ? onResolved : v => v;
    onRejeted =
        typeof onRejeted === 'function'
            ? onRejeted
            : r => {
                  throw r;
              };

    if (self.currentState === RESOLVED) {
        return (promise2 = new MyPromise(function(resolve, reject) {
            //规范2.2.4 保证onFulfilled, onRejected 异步执行
            //所以使用setTimeout包裹
            setTimeout(function() {
                try {
                    var x = onResolved(self.value);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (reason) {
                    reject(reason);
                }
            });
        }));
    }

    if (self.currentState === REJECTED) {
        return (promise2 = new MyPromise(function(resolve, reject) {
            setTimeout(function() {
                //异步执行onRejected
                try {
                    var x = onRejeted(self.value);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (reason) {
                    reject(reason);
                }
            });
        }));
    }

    if (self.currentState === PENDING) {
        return (promise2 = new MyPromise(function(resolve, reject) {
            self.resolutionProcedure.push(function() {
                //考虑到报错, 使用trycatch包裹
                try {
                    var x = onResolved(self.value);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (r) {
                    reject(r);
                }
            });

            self.rejectedCallbacks.push(function() {
                try {
                    var x = onRejeted(self.value);
                    resolutionProcedure(promise2, x, resolve, reject);
                } catch (r) {
                    reject(r);
                }
            });
        }));
    }
};

//规范2.3
function resolutionProcedure(promise2, x, resolve, reject) {
    //规范2.3.1, x不能和promise2相同, 避免循环引用
    if (promise2 === x) {
        return reject(new TypeError('Error'));
    }

    //规范2.3.2
    //如果x为Promise , 状态为pending需要继续等待否则执行
    if (x instanceof MyPromise) {
        if (x.currentState === PENDING) {
            x.then(function(value) {
                //再次调用该函数式为了确认x resolve 的参数是什么类型, 如果是基本类型就再次resolve
                //把值传给下一个then
                resolutionProcedure(promise2, value, resolve, reject);
            }, reject);
        } else {
            x.then(resolve, reject);
        }
        return;
    }

    //规范2.3.3.3.3
    //reject 或者 resolve 其中一个执行过, 忽略其他
    let called = false;
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        //规范2.3.3.2, 如果不能去除then, 就reject
        try {
            //规范 2.3.3.1
            let then = x.then;
            //如果then是函数, 调用x.then
            if (typeof then === 'function') {
                //规范2.3.3.3
                then.call(
                    x,
                    y => {
                        if (called) return;
                        // 规范 2.3.3.3.1
                        resolutionProcedure(promise2, y, resolve, reject);
                    },
                    e => {
                        if (called) return;
                        called = true;
                        reject(e);
                    }
                );
            } else {
                //规范2.3.3.4
                resolve(x);
            }
        } catch (e) {
            if (called) return;
            called = true;
            reject(e);
        }
    } else {
        //规范2.3.4, x为基本类型
        resolve(x);
    }
}
