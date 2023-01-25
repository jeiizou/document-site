

/**
 * 电影类
 */
class Movie {
    public static CHILDRENS = 2;
    public static REGULAR = 0;
    public static NEW_RELEASE = 1;

    private _price: Price;

    constructor(
        private _title: string,
        priceCode: number
    ) {
        this.setPriceCode(priceCode);
    }

    public getPriceCode() {
        return this._price.getPriceCode();
    }

    public setPriceCode(arg: number) {
        switch (arg) {
            case Movie.REGULAR:
                this._price = new RegularPrice();
                break;
            case Movie.CHILDRENS:
                this._price = new ChildrenPrice();
                break;
            case Movie.NEW_RELEASE:
                this._price = new NewRealeasePrice();
                break;
            default:
                throw new TypeError('Incorrect Price Code');
        }
    }

    public getTitle() {
        return this._title;
    }

    public getCharge(daysRented: number) {
        return this._price.getCharge(daysRented);
    }

    public getFranquentRenterPoints(daysRented: number) {
        return this._price.getFranquentRenterPoints(daysRented);
    }
}

/**
 * 租赁类: 表示某个顾客租了一部影片
 */
class Rental {
    constructor(
        private _movie: Movie, //电影
        private _daysRented: number // 租赁天数
    ) { }

    public getDaysRented() {
        return this._daysRented;
    }

    public getMovie() {
        return this._movie;
    }

    public getCharge() {
        return this._movie.getCharge(this._daysRented);
    }

    public getFranquentRenterPoints() {
        return this._movie.getFranquentRenterPoints(this._daysRented);
    }
}

/**
 * 顾客类
 */
class Customer {
    private _rentals: Rental[] = [];

    constructor(private _name: string) { }

    // 添加一条租赁信息
    public addRental(arg: Rental) {
        this._rentals.push(arg);
    }

    public getName() {
        return this._name;
    }

    // 生成详单
    public statement() {
        let result = "Rental Recored for" + this.getName() + "\n";

        for (let i = 0; i < this._rentals.length; i++) {
            const each = this._rentals[i];
            result += "\t" + each.getMovie().getTitle() + "\t" + each.getCharge().toString() + "\n";
        }

        result += "Amount owed is" + this.getTotalCharge().toString() + "\n";
        result += "You earned " + this.getTotalIFrequentRenterPoints() + "frequent renter points";
        return result;
    }

    // 生成Html风格的详单
    public htmlStatement() {
        let result = "<h1>Rentals for <em>" + this.getName() + "</em></h1><p>\n";
        for (let i = 0; i < this._rentals.length; i++) {
            const rental = this._rentals[i];
            result += rental.getMovie().getTitle() + ": " + rental.getCharge().toString() + "<br/>\n";
        }
        result += "<p>You owe <em>" + this.getTotalCharge() + "</em></o>\n";
        result += "on this retal you earned <em>" + this.getTotalIFrequentRenterPoints().toString() + "</em> frequent renter points</p>";
        return result;
    }


    private getTotalCharge() {
        let result = 0;
        this._rentals.forEach((rental) => {
            result += rental.getCharge();
        });
        return result;
    }

    private getTotalIFrequentRenterPoints() {
        let result = 0;
        this._rentals.forEach((rental) => {
            result += rental.getFranquentRenterPoints();
        });
        return result;
    }
}

/**
 * 价格抽象类
 */
abstract class Price {
    abstract getPriceCode();

    abstract getCharge(daysRented: number);

    getFranquentRenterPoints(daysRented: number): number {
        if ((this.getPriceCode() === Movie.NEW_RELEASE && daysRented > 1)) {
            return 2;
        } else {
            return 1;
        }
    }
}

/**
 * 不同的价格有不同的计算费用的方式
 */
class ChildrenPrice extends Price {
    getPriceCode() {
        return Movie.CHILDRENS
    }

    getCharge(daysRented: number) {
        let result = 2;
        if (daysRented > 3) {
            result += (daysRented - 3) * 1.5;
        }
        return result;
    }

    getFranquentRenterPoints(daysRented: number) {
        return 1;
    }
};

class NewRealeasePrice extends Price {
    getPriceCode() {
        return Movie.NEW_RELEASE;
    }

    getCharge(daysRented: number) {
        return daysRented * 3;
    }

    getFranquentRenterPoints(daysRented: number) {
        return daysRented > 1 ? 2 : 1;
    }
}

class RegularPrice extends Price {
    getPriceCode() {
        return Movie.REGULAR
    }

    getCharge(daysRented: number) {
        let result = 2;
        if (daysRented > 2) {
            result += (daysRented - 2) * 1.5;
        }
        return result;
    }

    getFranquentRenterPoints(daysRented: number) {
        return 1;
    }
}