Array.prototype.myMap = function (fn, thisValue) {
  let res = [];
  thisValue = thisValue || [];
  this.reduce(function (_pre, cur, index, arr) {
    return res.push(fn.call(thisValue, cur, index, arr));
  }, []);
  return res;
};
