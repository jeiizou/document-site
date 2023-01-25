/**
 * 以对象取代数组
 */

let row: string[] = new Array(3);
row[0] = "Liverpool";
row[1] = "15"

let Name = row[0];
let Wins = Number.parseInt(row[1]);


// 重构
class Performance_v1 {
    public data: string[] = new Array[3];

    public getName() {
        return this.data[0];
    }

    public setName(name: string) {
        this.data[0] = name;
    }

    public getWins() {
        return this.data[1];
    }

    public setWinws(num: number) {
        this.data[1] = num.toString();
    }
}

class Performance_v2 {
    private name = "";
    private wins = 0

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getWins() {
        return this.wins;
    }

    public setWinws(num: number) {
        this.wins = num;
    }
}