/**
 * 分解临时变量
 */

function getDistanceTravelled(time) {
    let result;
    let acc = this.primaryForce / this.mass;

    let primartTime = Math.min(time, this.delay);
    result = 0.5 * acc * primartTime * primartTime;
    let secondaryTime = time - this.delay;
    if (secondaryTime > 0) {
        let primartVal = acc * this.delay;
        acc = (this.primaryForce + this.secondaryTime) / this.mass;
        result += primartVal * secondaryTime + 0.5 * acc * secondaryTime * secondaryTime;
    }

    return result;
}

function getDistanceTravelled_v1(time) {
    let result;
    let primaryAcc = this.primaryForce / this.mass;

    let primartTime = Math.min(time, this.delay);
    result = 0.5 * primaryAcc * primartTime * primartTime;
    let secondaryTime = time - this.delay;
    if (secondaryTime > 0) {
        let primartVal = primaryAcc * this.delay;
        let sceondaryAcc = (this.primaryForce + this.secondaryTime) / this.mass;
        result += primartVal * secondaryTime + 0.5 * sceondaryAcc * secondaryTime * secondaryTime;
    }

    return result;
}