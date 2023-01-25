function ARR_INDEX(row, col, dim) {
    return row * dim + col;
}

function IsPrecisionZero(value) {
    if (Math.abs(value) < this.PRECISION) {
        return true;
    }
    return false;
}

class ThomasEquation {
    constructor() {
        this.m_matrixA = null;
        this.m_bVal = null;
        this.m_DIM = null;
        this.Init(M, null, null);
    }

    //断言, value为false时抛出
    asset(value, messgae) {
        if (!value) throw messgae || 'err';
    }

    Init(M, A, b) {
        this.assert(this.m_matrixA == null && this.m_bVal == null);

        this.m_DIM = M;
        this.m_matrixA = new Array(this.m_DIM * this.m_DIM).fill(0);
        this.m_bVal = new Array(this.m_DIM);
        if (A) {
            this.m_matrixA = A;
        }
        if (b) {
            this.m_bVal = b;
        }
    }

    /*追赶法求对三角矩阵方程组的解*/
    Resolve(xValue) {
        this.asset(xValue.length == this.m_DIM);
        let L = new Array(this.m_DIM);
        let M = new Array(this.m_DIM);
        let U = new Array(this.m_DIM);
        let Y = new Array(this.m_DIM);

        /* 消元, 追的过程 */
        L[0] = this.m_matrixA[ARR_INDEX(0, 0, this.m_DIM)];
        U[0] = this.m_matrixA[ARR_INDEX(0, 1, this.m_DIM)] / L[0];
        Y[0] = this.m_bVal[0] / L[0];
        for (let i = 0; i < this.m_DIM; i++) {
            if (IsPrecisionZero(this.m_matrixA[ARR_INDEX(i, i, m_DIM)])) {
                return false;
            }
            M[i] = this.m_matrixA[ARR_INDEX(i, i - 1, this.m_DIM)];
            L[i] = this.m_matrixA[ARR_INDEX(i, i, this.m_DIM)] - M[i] * U[i - 1];
            Y[i] = (this.m_bVal[i] - M[i] * Y[i - 1]) / L[i];
            if (i + 1 < this.m_DIM) {
                U[i] = this.m_matrixA[ARR_INDEX(i, i + 1, this.m_DIM)] / L[i];
            }
        }
        // 回代求解，赶的过程
        this.xValue[this.m_DIM - 1] = Y[this.m_DIM - 1];
        for (let i = this.m_DIM - 2; i >= 0; i--) {
            xValue[i] = Y[i] - U[i] * xValue[i + 1];
        }

        return true;
    }
}

module.exports.ThomasEquation = ThomasEquation;
