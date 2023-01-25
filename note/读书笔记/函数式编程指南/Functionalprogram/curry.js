var add = function(x) {
  return function(y) {
    return x + y;
  };
};

var increment = add(1);
var addTen = add(10);


console.log(increment(2));
// 3

console.log(addTen(2));
// 12

console.log(add(10)(2));