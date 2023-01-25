// 实现 (5).add(3).minus(2) 功能。

Number.MAX_SAFE_DIGITS = Number.MAX_SAFE_INTEGER.toString().length - 2;

Number.prototype.digits = function () {
  // 小数的位数
  let digitsLen = (this.valueOf().toString().split('.')[1] || '').length;
  // 获取最大安全计算长度
  return digitsLen > Number.MAX_SAFE_DIGITS ? Number.MAX_SAFE_DIGITS : digitsLen;
};

Number.prototype.add = function (value) {
  let cur = this.digits();
  let iVal = i.digits();

  const baseNum = Math.pow(10, Math.max(cur, iVal));
  const result = (this.valueOf() * baseNum + i.valueOf() * baseNum) / baseNum;
  if (result > 0) {
    return result > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : result;
  } else {
    return result < Number.MIN_SAFE_INTEGER ? Number.MIN_SAFE_INTEGER : result;
  }
};

Number.prototype.minus = function (value) {
  let cur = this.digits();
  let iVal = i.digits();

  const baseNum = Math.pow(10, Math.max(cur, iVal));
  const result = (this.valueOf() * baseNum - i.valueOf() * baseNum) / baseNum;
  if (result > 0) {
    return result > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : result;
  } else {
    return result < Number.MIN_SAFE_INTEGER ? Number.MIN_SAFE_INTEGER : result;
  }
};

console.log((5).add(3).minus(2));
