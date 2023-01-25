/**
 * 将函数柯里化
 * @param {*} fn 待柯里化的函数
 * @param {*} len 所需的参数个数, 默认为原函数的形参的个数
 * @returns
 */
function curry(fn, len = fn.length, holder = curry) {
  return _curry.call(this, fn, len, holder, [], []);
}

// /**
//  * 中转函数
//  * @param {*} fn 待柯里化的原函数
//  * @param {*} len 所需的参数个数
//  * @param  {...any} args 已接收的参数列表
//  */
// function _curry(fn, len, ...args) {
//     // 当前函数调用的时候传入的参数
//     return function (...params) {
//         let _args = [...args, ...params];
//         if (_args.length >= len) {
//             return fn.apply(this, _args);
//         } else {
//             // 参数还不够, 将已有的参数保存, 返回一个已经接受这些函数的新的函数
//             return _curry.call(this, fn, len, ...args);
//         }
//     };
// }

/**
 * 中转函数
 * @param {*} fn 柯里化的原函数
 * @param {*} length 原函数需要的参数个数
 * @param {*} holder 接受的占位符
 * @param {*} args 已接收的阐述的列表
 * @param {*} holders 已接收的占位符位置列表
 * @returns {Function} 继续柯里化的函数 或者 最终的结果
 */
function _curry(fn, length, holder, args = [], holders = []) {
  return function (..._args) {
    // 将参数复制一份, 避免多次操作同一数据导致参数混乱
    let params = args.slice();
    // 将占位符位置列表复制一份, 新增加的占位符增加至此
    let _holders = holders.slice();
    // 循环入参, 追加参数, 替换占位符
    _args.forEach((arg, i) => {
      // 真实参数, 之前存在占位符, 将占位符替换为真实的参数
      if (arg !== holder && holders.length) {
        let index = holders.shift();
        _holders.splice(_holders.indexOf(index), 1);
        params[index] = arg;
      }
      // 真实参数, 之前不存在占位符, 将参数追加到参数列表
      else if (arg !== holder && !holders.length) {
        params.push(arg);
      }
      // 传入的是占位符, 之前不存在占位符, 记录占位符的位置
      else if (arg === holder && !holders.length) {
        params.push(arg);
        _holders.push(params.length - 1);
      }
      // 传入的是占位符, 之前存在占位符, 删除原占位符的位置
      else if (arg === holder && holders.length) {
        holders.shift();
      }
    });

    // params 中前length条记录不包含占位符, 则执行函数
    if (params.length >= length && params.slice(0, length).every((i) => i !== holder)) {
      return fn.apply(this, params);
    } else {
      return _curry.call(this, fn, length, holder, params, _holders);
    }
  };
}

let fn = function (a, b, c, d, e) {
  console.log([a, b, c, d, e]);
};

let _ = {}; // 定义占位符
let _fn = curry(fn, 5, _); // 将函数柯里化，指定所需的参数个数，指定所需的占位符

_fn(1, 2, 3, 4, 5); // print: 1,2,3,4,5
_fn(_, 2, 3, 4, 5)(1); // print: 1,2,3,4,5
_fn(1, _, 3, 4, 5)(2); // print: 1,2,3,4,5
_fn(1, _, 3)(_, 4, _)(2)(5); // print: 1,2,3,4,5
_fn(1, _, _, 4)(_, 3)(2)(5); // print: 1,2,3,4,5
_fn(_, 2)(_, _, 4)(1)(3)(5); // print: 1,2,3,4,5

// console.log(_fn(_, 2, 3, 4, 5)(1));
