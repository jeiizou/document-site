const a = [[0, 1], [3, 4], [4, 5], [[6]], [[7]]];

function flat(arr, level = Infinity) {
  function flatOnce(arr) {
    let retArr = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (Array.isArray(item)) {
        retArr = retArr.concat(item);
      } else {
        retArr.push(item);
      }
    }
    return retArr;
  }

  function checkData(arr) {
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (el instanceof Array) {
        return false;
      }
    }
    return true;
  }

  while (level > 0) {
    arr = flatOnce(arr);
    level--;
    if (checkData(arr)) {
      return arr;
    }
  }

  return arr;
}

let res = flat(a);
console.log(res);
