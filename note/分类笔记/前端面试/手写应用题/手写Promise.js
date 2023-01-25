const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

/**
 *
 * @param {*} promise2 准备被返回的promise对象
 * @param {*} x then函数中的第一个参数执行的结果
 * @param {*} resolve 返回的promise的resolve方法
 * @param {*} reject 返回的promise的reject方法
 */
const resolvePromise = (promise2, x, resolve, reject) => {
  // 自己等待自己完成是错误的实现, 用一个类型错误, 结束掉promise
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
  }

  // 只能调用一次
  let called;
  if ((typeof x === 'object' && x != null) || typeof x === 'function') {
    // 限制了x只能是一个function或者对象
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            // 递归解析的过程
            resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            // 只要失败了, 就是啊比
            if (called) return;
            called = true;
            reject(r);
          },
        );
      } else {
        // 如果 x.then 是一个普通值, 就直接返回resolve作为结果
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    // 如果x是个普通值, 就直接返回resolve作为结果
    resolve(x);
  }
};

// 收集依赖 => 触发通知 => 取出依赖执行
class MyPromise {
  static resolve(data) {
    return new MyPromise((resolve, reject) => {
      resolve(data);
    });
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  constructor(executor) {
    // 当前的工作状态
    this.status = PENDING;
    // 存放成功结果的值
    this.value = undefined;
    // 存放失败结果的值
    this.reason = undefined;
    // 存放成功的回调
    this.onResolvedCallbacks = [];
    // 存放失败的回调
    this.onRejectedCallbacks = [];

    let resolve = (value) => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        // 依次将对应的函数执行
        this.onResolvedCallbacks.forEach((fn) => fn());
      }
    };

    let reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        // 依次将对应的函数执行
        this.onRejectedCallbacks.forEach((fn) => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    // 解决onFulfilled, onRejected 没有传值的问题
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (v) => v;
    // 因为错误的值要让后面访问到, 所以这里也要抛出一个错误, 否则会在之后的then的resolve中被捕获
    onRejected = typeof onRejected === 'function' ? onRejected : (v) => v;

    // 每次调用then都要返回一个新的promise
    let promise2 = new MyPromise((resolve, reject) => {
      // 这部分代码是直接执行的, 用setTimeout实现异步
      // promise 已完成的情况
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            // 获取onFulfilled得到的值
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.status === PENDING) {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }
    });
    return promise2;
  }
}

MyPromise.resolve()
  .then(() => {
    console.log(1);
    return Promise.resolve(3);
  })
  .then((res) => {
    console.log(res);
  });

MyPromise.resolve()
  .then(() => {
    console.log(2);
  })
  .then(() => {
    console.log(4);
  })
  .then(() => {
    console.log(5);
  })
  .then(() => {
    console.log(6);
  })
  .then(() => {
    console.log(7);
  });
