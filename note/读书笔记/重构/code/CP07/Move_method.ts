/**
 * 搬移函数
 */

class Account {

    private type;
    private daysOverdrawn;


    overdraftCharge() {
        if (this.type.isPremiun()) {
            let result = 10;
            if (this.daysOverdrawn > 7) {
                result += (this.daysOverdrawn - 7) * 0.85;
                return result;
            }
        } else {
            return this.daysOverdrawn * 1.75;
        }
    }

    bankChanrge() {
        let result = 4.5;
        if (this.daysOverdrawn > 0) result += this.overdraftCharge();
        return result;
    }
}


//======================> 重构


class AccountType {

    overdraftCharge(daysOverdrawn) {
        if (this.isPremiun()) {
            let result = 10;
            if (daysOverdrawn > 7) {
                result += (daysOverdrawn - 7) * 0.85;
                return result;
            }
        } else {
            return daysOverdrawn * 1.75;
        }
    }

    isPremiun() {
        return false
    }
}

class Account_v1 {

    private type;
    private daysOverdrawn;

    bankChanrge() {
        let result = 4.5;
        if (this.daysOverdrawn > 0) result += this.type.overdraftCHarge(this.daysOverdrawn);
        return result;
    }
}