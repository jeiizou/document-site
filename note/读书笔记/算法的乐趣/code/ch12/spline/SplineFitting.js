let ThomasEquation = require('./ThomasEquation').ThomasEquation;

function ARR_INDEX(row, col, dim) {
    return row * dim + col;
}

function IsPrecisionZero(value) {
    if (Math.abs(value) < this.PRECISION) {
        return true;
    }
    return false;
}

function asset(value, messgae) {
    if (!value) throw messgae || 'err';
}

class SplineFitting {
    constructor() {
        this.m_valN = 0;
        this.m_bCalcCompleted = false;

        this.m_valXi;
        this.m_valYi;
        this.m_valMi;
    }

    CalcSpline(Xi, Yi, n, boundType, b1, b2) {
        assert(boundType == 1 || boundType == 2);

        let matrixA = new Array(n * n);
        let d = new Array(n);

        this.m_valN = n;
        this.m_valXi = Xi.clone();
        this.m_valYi = Yi.clone();
        this.m_valMi = new Array(this.m_valN);

        matrixA[ARR_INDEX(0, 0, this.m_valN)] = 2.0;
        matrixA[ARR_INDEX(this.m_valN - 1, this.m_valN - 1, this.m_valN)] = 2.0;
        if (boundType == 1) {
            /*第一类边界条件*/
            matrixA[ARR_INDEX(0, 1, this.m_valN)] = 1.0; //v0
            matrixA[ARR_INDEX(this.m_valN - 1, this.m_valN - 2, this.m_valN)] = 1.0; //un
            let h0 = Xi[1] - Xi[0];
            d[0] = (6 * ((Yi[1] - Yi[0]) / h0 - b1)) / h0; //d0
            let hn_1 = Xi[this.m_valN - 1] - Xi[this.m_valN - 2];
            d[this.m_valN - 1] = (6 * (b2 - (Yi[this.m_valN - 1] - Yi[this.m_valN - 2]) / hn_1)) / hn_1; //dn
        } else {
            /*第二类边界条件*/
            matrixA[ARR_INDEX(0, 1, this.m_valN)] = 0.0; //v0
            matrixA[ARR_INDEX(this.m_valN - 1, this.m_valN - 2, this.m_valN)] = 0.0; //un
            d[0] = 2 * b1; //d0
            d[this.m_valN - 1] = 2 * b2; //dn
        }

        /*计算ui,vi,di，i = 2,3,...,n-1*/
        for (let i = 1; i < this.m_valN - 1; i++) {
            let hi_1 = Xi[i] - Xi[i - 1];
            let hi = Xi[i + 1] - Xi[i];
            matrixA[ARR_INDEX(i, i - 1, this.m_valN)] = hi_1 / (hi_1 + hi); //ui
            matrixA[ARR_INDEX(i, i, this.m_valN)] = 2.0;
            matrixA[ARR_INDEX(i, i + 1, this.m_valN)] = 1 - matrixA[ARR_INDEX(i, i - 1, this.m_valN)]; //vi = 1 - ui
            d[i] = (6 * ((Yi[i + 1] - Yi[i]) / hi - (Yi[i] - Yi[i - 1]) / hi_1)) / (hi_1 + hi); //di
        }

        let equation = new ThomasEquation(this.m_valN, matrixA, d);
        equation.Resolve(this.m_valMi);
        this.m_bCalcCompleted = true;
    }
}

module.exports.SplineFitting = SplineFitting;
