class GuassEquation {
  constructor(M, A, b) {
    this.m_DIM = null;
    this.m_matrixA = null;
    this.m_bVal = null;
    this.PRECISION = 1e-10;
    this.init(M, A, b);
  }

  //断言, value为false时抛出
  asset(value, messgae) {
    if (!value) throw messgae;
  }

  init(M, A, b) {
    this.asset(this.m_matrixA == null && this.m_bVal == null);
    this.m_DIM = M;
    this.m_matrixA = [];
    this.m_bVal = [];
    if (A) {
      this.m_matrixA = A;
    }
    if (b) {
      this.m_bVal = b;
    }
  }

  IsPrecisionZero(value) {
    if (Math.abs(value) < this.PRECISION) {
      return true;
    }
    return false;
  }

  /**
   * 带列主元的高斯消去法解方程组，最后的解在matrixA的对角线上
   * xValue: 系数矩阵
   */
  Resolve(xValue) {
    this.asset(xValue.length == this.m_DIM, "xValue lenght error");

    // 消元, 得到上三角阵
    for (let i = 0; i < this.m_DIM.length; i++) {
      // 按列选主元
      let pivotRow = this.SelectPivotalElement(i);
      if (pivotRow != i) {
        //如果有必要, 交换行
        this.SwapRow(i, pivotRow);
      }
      if (this.IsPrecisionZero(this.m_matrixA[i * this.m_DIM + i])) {
        return false;
      }
      /*对系数归一化处理，使行第一个系数是1.0*/
      this.SimplePivotalRow(i, i);
      for (let j = i + 1; j < this.m_DIM; j++) {
        this.RowElimination(i, j, i);
      }
    }
    //回代求解
    this.m_matrixA[(this.m_DIM - 1) * this.m_DIM + this.m_DIM - 1] =
      this.m_bVal[this.m_DIM - 1] /
      this.m_matrixA[(this.m_DIM - 1) * this.m_DIM + this.m_DIM - 1];
    for (let i = this.m_DIM - 2; i >= 0; i--) {
      let totalCof = 0;
      for (let j = i + 1; j < this.m_DIM; j++) {
        totalCof +=
          this.m_matrixA[i * this.m_DIM + j] *
          this.m_matrixA[j * this.m_DIM + j];
      }
      this.m_matrixA[i * this.m_DIM + i] =
        (this.m_bVal[i] - this.totalCof) / this.m_matrixA[i * this.m_DIM + i];
    }
    /*将对角线元素的解逐个存入解向量*/
    for (let i = 0; i < this.m_DIM; i++) {
      xValue[i] = this.m_matrixA[i * this.m_DIM + i];
    }

    return true;
  }

  /*M是维度，column取值范围从0到M-1*/
  SelectPivotalElement(column) {
    this.asset(column < this.m_DIM);

    let row = column;
    let maxU = Math.abs(this.m_matrixA[column * this.m_DIM + column]);
    for (let i = column + 1; i < this.m_DIM; i++) {
      if (Math.abs(this.m_matrixA[i * this.m_DIM + column]) > maxU) {
        maxU = Math.abs(this.m_matrixA[i * this.m_DIM + column]);
        row = i;
      }

      return row;
    }
  }

  SwapRow(row1, row2) {
    this.asset(row1 < this.m_DIM && row2 < this.m_DIM);
    let temp;
    for (let i = 0; i < this.m_DIM; i++) {
      temp = this.m_matrixA[row1 * this.m_DIM + i];
      this.m_matrixA[row1 * this.m_DIM + i] = this.m_matrixA[
        row2 * this.m_DIM + i
      ];
      this.m_matrixA[row2 * this.m_DIM + i] = temp;
    }
    temp = this.m_bVal[row1];
    this.m_bVal[row1] = this.m_bVal[row2];
    this.m_bVal[row2] = temp;
  }

  SimplePivotalRow(row, startColumn) {
    this.asset(row < this.m_DIM && startColumn < this.m_DIM);
    let simple = this.m_matrixA[row * this.m_DIM + startColumn];
    for (let i = startColumn; i < this.m_DIM; i++) {
      this.m_matrixA[row * this.m_DIM + i] /= simple;
    }
    this.m_bVal[row] /= simple;
  }

  RowElimination(rowS, rowE, startColumn) {
    this.asset(
      rowS < this.m_DIM && rowE < this.m_DIM && startColumn < this.m_DIM
    );

    let simple = this.m_matrixA[row * this.m_DIM + startColumn];
    for (let i = startColumn; i < this.m_DIM; i++) {
      this.m_matrixA[rowE * this.m_DIM + i] -=
        this.m_matrixA[rowS * this.m_DIM + i] * simple;
    }
    this.m_bVal[rowE] -= this.m_bVal[rowS] * simple;
  }
}

module.exports.GuassEquation = GuassEquation;
