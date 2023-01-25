//解释器模式示意

class TerminalExpression {
    constructor(data) {
        this.data = data
    }

    interpret(context) {
        if (context.contains(this.data)) {
            return true;
        }
        return false;
    }
}

class OrExpression {
    constructor(expr1, expr2) {
        this.expr1 = expr1;
        this.expr2 = expr2;
    }

    interpret(context) {
        return this.expr1.interpret(context) || this.expr2.interpret(context);
    }
}

class Exporession {
    constructor(context) {
        this.context = context;
    }

    contains(data) {
        let flag = this.context.indexOf(data);
        if (flag) {
            return true;
        }
        return false
    }
}

(function () {
    let context = new Exporession('I am groot');
    let te=new TerminalExpression('groot');
    let res1=te.interpret(context);
    console.log(res1);

    let te2=new TerminalExpression('John');
    let orEx=new OrExpression(te,te2);
    let res2=orEx.interpret(context);
    console.log(res2);
})()