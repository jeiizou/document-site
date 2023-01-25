// 提供一个异步 add 方法如下，需要实现一个 await sum(...args) 函数：
function asyncAdd(a, b, callback) {
  setTimeout(function () {
    callback(null, a + b);
  }, 1000);
}

function sum(...args) {
  return new Promise((resolve) => {
    if (args.length < 2) {
      resolve(args[0] || 0);
      return;
    }

    if (args.length === 2) {
      asyncAdd(args[0], args[1], (error, value) => {
        resolve(value);
      });
      return;
    }

    let mid = Number.parseInt(args.length / 2);
    let resSum = 0;
    sum(...args.slice(0, mid))
      .then((value) => {
        resSum += value;
        return sum(...args.slice(mid));
      })
      .then((value2) => {
        resSum += value2;
        resolve(resSum);
        return;
      });
  });

  asyncAdd();
}

sum(1, 2, 3, 4, 5).then((value) => {
  console.log(value);
});
