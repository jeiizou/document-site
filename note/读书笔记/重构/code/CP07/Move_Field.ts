/**
 * 搬移字段
 */

class Account_2 {
    private type: AccountType;
    private interestRate: number;

    public interestForAmount_days(amount, days) {
        return this.interestRate * amount * days / 365;
    }
}



// 重构

class AccountType {
    private interestRate: number;

    setInterestRate(arg) {
        this.interestRate = arg;
    }

    getInterestRate() {
        return this.interestRate;
    }
}

class Account_2_v1 {
    private type: AccountType;

    public interestForAmount_days(amount, days) {
        return this.type.getInterestRate() * amount * days / 365;
    }

    setInterestRate(arg) {
        this.type.setInterestRate(arg);
    }

    getInterestRate() {
        return this.type.getInterestRate();
    }
}