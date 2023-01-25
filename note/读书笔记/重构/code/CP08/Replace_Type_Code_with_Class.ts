/**
 * 以类取代类型码
 */

class Person {
    public static O = 0;
    public static A = 1;
    public static B = 2;
    public static AB = 3;

    private bloodGroup;

    constructor(bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public setBloodGroup(arg: number) {
        this.bloodGroup = this.bloodGroup;
    }

    public getBloodGroup() {
        return this.bloodGroup;
    }
}



// => 重构
class BloodGroup {
    public static O = new BloodGroup(0);
    public static A = new BloodGroup(1);
    public static B = new BloodGroup(2);
    public static AB = new BloodGroup(3);

    private code: number;
    constructor(code: number) {
        this.code = code;
    }

    public getCode() {
        return this.code;
    }

    public static code(arg: number) {
        return new BloodGroup(arg);
    }
}

class Person_v1 {
    public static O = BloodGroup.O.getCode();
    public static A = BloodGroup.A.getCode();
    public static B = BloodGroup.B.getCode();
    public static AB = BloodGroup.AB.getCode();

    private bloodGroup;

    constructor(bloodGroup) {
        this.bloodGroup = BloodGroup.code(bloodGroup);
    }

    public setBloodGroup(arg: number) {
        this.bloodGroup = BloodGroup.code(arg)
    }

    public getBloodGroup() {
        return this.bloodGroup.getCode();
    }
}