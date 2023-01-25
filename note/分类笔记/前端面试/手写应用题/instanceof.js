// 手写 instanceof
function instance_of(L, R) {
  // 验证如果为基本数据类型, 就直接返回 false
  const baseType = ['string', 'number', 'boolean', 'undefined', 'symbol'];
  if (baseType.includes(typeof L)) {
    return false;
  }

  let RP = R.prototype; // 取 R 的显示原型
  L = L.__proto__; // 取 L 的隐式原型
  while (L) {
    if (L === RP) {
      // 严格相等
      return true;
    }
    L = L.__proto__; // 没找到继续向上一层的原型链查找
  }
  return false;
}
