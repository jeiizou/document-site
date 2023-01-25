function reduce(arr, cb, initialValue) {
  let num = initialValue === undefined ? arr[0] : initialValue;
  let i = initialValue === undefined ? 1 : 0;

  for (i; i < arr.length; i++) {
    num = cb(num, arr[i], i);
  }

  return num;
}

function fn(result, currentValue, index) {
  return result + currentValue;
}

var arr = [2, 3, 4, 5];
var b = reduce(arr, fn, 10);
var c = reduce(arr, fn);
console.log(b, c); // 24 14
