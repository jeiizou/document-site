// call
Function.prototype.myCall = function (content, ...args) {
  let context = content || window;
  context.fn = this;
  let res = context.fn(...args);
  delete context.fn;
  return res;
};

// apply
Function.prototype.myApply = function (content, args) {
  let context = content || window;
  context.fn = this;
  let res = context.fn(...args);
  delete context.fn;
  return res;
};

// new
function _new(fn, ...arg) {
  if (typeof fn !== 'function') throw `${fn} is not a constructor`;
  // 创建一个原型链为fn.prototype的对象
  const obj = Object.create(fn.prototype);
  // 在这个对象上执行fn, 获取结果
  const ret = fn.apply(obj, arg);
  // 如果返回的结果是个对象, 那么返回这个对象, 否则说明函数执行返回的不是对象, 则直接返回obj
  return ret instanceof Object ? ret : obj;
}

// bind
Function.prototype.myBind = function (context) {
  // 只能接受function作为this
  if (typeof this !== 'function') {
    throw new TypeError('Error');
  }
  var _this = this; // 目标函数
  // 获取传递的所有参数
  var args = [...arguments].slice(1);
  //返回一个函数
  return function F() {
    // 因为返回了一个函数, 我们可以 new F()
    // 应该要new的是原本的函数, 而不是我们的F,
    // 因此这里要返回 new _this
    if (this instanceof F) {
      return new _this(...args, ...arguments);
    }
    return _this.apply(context, args.concat(...arguments));
  };
};
