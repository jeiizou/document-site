//Karatsuba大数乘法

class Karatsuba {

    caculateRes(mul1, mul2) {
        if ((this.getBigNCount(mul1) == 1) || (this.getBigNCount(mul2) == 1)) {
            return mul1 * mul2;
        }

        let high1, high2, low1, low2;
        let k = Math.floor(Math.max(this.getBigNCount(mul1), this.getBigNCount(mul2)) / 2);

        // console.log(k);

        low1 = mul1.toString().substr(-k) - 0;
        high1 = mul1.toString().substr(0, mul1.toString().length - k) - 0;
        low2 = mul2.toString().substr(-k) - 0;
        high2 = mul2.toString().substr(0, mul2.toString().length - k) - 0;

        // console.log(high1, low1, high2, low2);

        if (isNaN(high1) || isNaN(low1) || isNaN(high2) || isNaN(low2)) {
            console.log("return error");
            return 0;
        }


        let z0 = this.caculateRes(low1, low2);
        let z1 = this.caculateRes((low1 + high1), (low2 + high2));
        let z2 = this.caculateRes(high1, high2);

        let zk = z1 - z2 - z0;

        z2 = z2 * Math.pow(10, 2 * k);
        zk = zk * Math.pow(10, k);

        return (z2 + zk + z0);
    }

    getBigNCount(mul) {
        //mul为大整数
        let numStr = mul.toString();
        return numStr.length;
    }
}

(function main() {
    let kara = new Karatsuba();
    let res = kara.caculateRes(34534521, 328962);
    console.log("正常计算:"+34534521 * 328962);
    console.log("算法计算:"+res);
})();