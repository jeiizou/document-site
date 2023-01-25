// LeastSquare.cpp : Defines the entry point for the console application.
//最小二乘法曲线拟合
let GuassEquation = require("./GuassEquation").GuassEquation;

let CDoubleArray;

function assert(value) {
  if (!value) throw messgae;
}

function ARR_INDEX(row, col, dim) {
  return row * dim + col;
}

function getSum(total, num) {
  return total + num;
}

/**
 *
 * @param {CDoubleArray} X X轴坐标
 * @param {CDoubleArray} Y Y轴坐标
 * @param {long} M 结果
 * @param {long} N 采样数目
 * @param {CDoubleArray} A 结果参数
 */
function CalculateCurveParameter(X, Y, M, N, A) {
  let i, j, l;
  let Z, D1, D2, C, P, G, Q;
  let B = new Array(N),
    T = new Array(N),
    S = new Array(N);
  if (M > N) M = N;
  for (i = 0; i < M; i++) A[i] = 0;
  Z = 0;
  B[0] = 1;
  D1 = N;
  P = 0;
  C = 0;
  for (i = 0; i < N; i++) {
    P = P + X[i] - Z;
    C = C + Y[i];
  }
  C = C / D1;
  P = P / D1;
  A[0] = C * B[0];
  if (M > 1) {
    T[1] = 1;
    T[0] = -P;
    D2 = 0;
    C = 0;
    G = 0;
    for (i = 0; i < N; i++) {
      Q = X[i] - Z - P;
      D2 = D2 + Q * Q;
      C = Y[i] * Q + C;
      G = (X[i] - Z) * Q * Q + G;
    }
    C = C / D2;
    P = G / D2;
    Q = D2 / D1;
    D1 = D2;
    A[1] = C * T[1];
    A[0] = C * T[0] + A[0];
  }
  for (j = 2; j < M; j++) {
    S[j] = T[j - 1];
    S[j - 1] = -P * T[j - 1] + T[j - 2];
    if (j >= 3) {
      for (k = j - 2; k >= 1; k--) S[k] = -P * T[k] + T[k - 1] - Q * B[k];
    }
    S[0] = -P * T[0] - Q * B[0];
    D2 = 0;
    C = 0;
    G = 0;
    for (i = 0; i < N; i++) {
      Q = S[j];
      for (k = j - 1; k >= 0; k--) Q = Q * (X[i] - Z) + S[k];
      D2 = D2 + Q * Q;
      C = Y[i] * Q + C;
      G = (X[i] - Z) * Q * Q + G;
    }
    C = C / D2;
    P = G / D2;
    Q = D2 / D1;
    D1 = D2;
    A[j] = C * S[j];
    T[j] = S[j];
    for (k = j - 1; k >= 0; k--) {
      A[k] = C * S[k] + A[k];
      B[k] = T[k];
      T[k] = S[k];
    }
  }
  return true;
}

function LeastSquare(x_value, y_value, M, a_value) {
  assert(x_value.length == y_value.length);
  assert(a_value.length == M);

  let matrix = new Array(M * M);
  let b = new Array(M);

  let x_m = new Array(x_value.length).fill(1);
  let y_i = new Array(y_value.length).fill(0);

  for (let i = 0; i < M; i++) {
    matrix[ARR_INDEX(0, i, M)] = x_m.reduce(getSum);
    for (let j = 0; j < y_value.length; j++) {
      y_i[j] = x_m[j] * y_value[j];
    }
    b[i] = y_i.reduce(getSum);
    for (let k = 0; k < x_m.length; k++) {
      x_m[k] *= x_value[k];
    }
  }
  for (let row = 1; row < M; row++) {
    for (let i = 0; i < M - 1; i++) {
      matrix[ARR_INDEX(row, i, M)] = matrix[ARR_INDEX(row - 1, i + 1, M)];
    }
    matrix[ARR_INDEX(row, M - 1, M)] = x_m.reduce(getSum);
    for (let k = 0; k < x_m.length; k++) {
      x_m[k] *= x_value[k];
    }
  }

  let equation = new GuassEquation(M, matrix, b);

  return equation.Resolve(a_value);
}

const N = 12;
let x_value = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
let y_value = [
  8.41,
  9.94,
  11.58,
  13.02,
  14.33,
  15.92,
  17.54,
  19.22,
  20.49,
  22.01,
  23.53,
  24.47
];

function main() {
  let X = [],
    Y = [];
  let A = new Array(2);

  X = x_value;
  Y = y_value;

  CalculateCurveParameter(X, Y, 2, N, A);

  let B = new Array(2);
  LeastSquare(X, Y, 2, B);
  console.log(A);
  return 0;
}

main();
