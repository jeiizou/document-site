//字符串的编辑距离: 朴素的递归算法

function EditDistance(srcArr, destArr) {
  if (srcArr.length == 0 || destArr.length == 0)
    return Math.abs(srcArr.length - destArr.length);
  if (srcArr[0] == destArr[0]) {
    return EditDistance(srcArr.slice(1), destArr.slice(1));
  }

  let edIns = EditDistance(srcArr, destArr.slice(1)) + 1; //插入字符
  let edDel = EditDistance(srcArr.slice(1), destArr) + 1; //删除字符
  let edRep = EditDistance(srcArr.slice(1), destArr.slice(1)) + 1; //替换字符

  return Math.min(Math.min(edIns, edDel), edRep);
}

let srcStr = "snowy123";
let destStr = "sunny987";

let res = EditDistance(srcStr, destStr);

console.log(res);