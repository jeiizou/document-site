//建造者模式示意

// 创建子类单元
class Kitchen {
    constructor() {
        this.name = "kitchen";
    }
    build() {
        console.log("Build the " + this.name);
    }
}

class Bedroom {
    constructor() {
        this.name = "bedroom";
    }
    build() {
        console.log("Build the " + this.name);
    }
}

class Livingroom {
    constructor() {
        this.name = "livingroom";
    }
    build() {
        console.log("Build the " + this.name);
    }
}

//创建建造者
class Builder {
    constructor() {
        this.name = "builder"
    }

    build() {
        let build1 = new Kitchen();
        let build2 = new Bedroom();
        let build3 = new Livingroom();

        build1.build();
        build2.build();
        build3.build();
    }
}


(function main() {
    let builder = new Builder();
    builder.build();
})()