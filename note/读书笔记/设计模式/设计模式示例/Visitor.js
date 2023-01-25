//访问者模式

//接口
class ComputerPart {
    accept(computerPartVisitor) {};
}
//实体类
class KeyBoard extends ComputerPart {
    constructor() {
        super();
        this.name = 'Keyboard';
    }
    accept(computerPartVisitor) {
        computerPartVisitor.visit(this.name);
    }
}
class Monitor extends ComputerPart {
    constructor() {
        super();
        this.name = 'Monitor';
    }
    accept(computerPartVisitor) {
        computerPartVisitor.visit(this.name);
    }
}
class Mouse extends ComputerPart {
    constructor() {
        super();
        this.name = 'Mouse';
    }
    accept(computerPartVisitor) {
        computerPartVisitor.visit(this.name);
    }
}

class Computer extends ComputerPart {
    constructor() {
        super();
        this.parts = [
            new Mouse(),
            new KeyBoard(),
            new KeyBoard()
        ]
    }

    accept(computerPartVisitor) {
        for (let i = 0; i < this.parts.length; i++) {
            const el = this.parts[i];
            el.accept(computerPartVisitor);
        }
    }
}

//访问者
class ComputerPartVisitor {

    visit(name) {
        switch (name) {
            case 'Keyboard':
                console.log("Displaying Keyboard.");
                break;
            case 'Mouse':
                console.log("Displaying Mouse.");
                break;
            case 'Monitor':
                console.log("Displaying Monitor.");
                break;
            default:
                break;
        }
    }
}

(function(){
    let computer = new Computer();
    computer.accept(new ComputerPartVisitor());
})();