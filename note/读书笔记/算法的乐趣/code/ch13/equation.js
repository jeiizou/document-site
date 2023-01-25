let PRECISION = 0.000000001;

function binFunc(x) {
  return 2.0 * x * x + 3.2 * x - 1.8;
}

function DichotomyEquation(a, b, f) {
  let mid = a + b / 2;
  while (b - a > PRECISION) {
    if (f(a) * f(mid) < 0.0) {
      b = mid;
    } else {
      a = mid;
    }
    mid = (a + b) / 2.0;
  }
  return mid;
}

function CalcDerivative(f, x) {
  return (f(x + 0.000005) - f(x - 0.000005)) / 0.00001;
}

function NewtonRaphson(f, x0) {
  let x1 = x0 - f(x0) / CalcDerivative(f, x0);
  while (Math.abs(x1 - x0) > PRECISION) {
    x0 = x1;
    x1 = x0 - f(x0) / CalcDerivative(f, x0);
  }

  return x1;
}

function main() {
  let s = binFunc(-0.8);
  let t = binFunc(8);
  let k = binFunc(0.44096736423671234);
  let m = binFunc(-2.040967365);

  let x = DichotomyEquation(-0.8, 12.0, binFunc);
  let y = NewtonRaphson(binFunc, 8.0);
  let z = NewtonRaphson(binFunc, -8.0);
  console.log(x,y,z);
  return 0;
}

main();
