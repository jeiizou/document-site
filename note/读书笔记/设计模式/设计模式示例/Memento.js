// 备忘录模式示意
/**备忘录模式使用三个类 Memento、Originator 和 CareTaker。Memento 包含了要被恢复的对象的状态。Originator 创建并在 Memento 对象中存储状态。Caretaker 对象负责从 Memento 中恢复对象的状态。

MementoPatternDemo，我们的演示类使用 CareTaker 和 Originator 对象来显示对象的状态恢复。*/

class Memento {
    constructor(state) {
        this.state = state;
    }
    getState() {
        return this.state;
    }
}

class Originator {
    constructor() {
        this.state = null;
    }
    setState(state) {
        this.state = state;
    }
    getState(){
        return this.state;
    }
    saveSatetToMemento() {
        return new Memento(this.state);
    }
    getStateFromMemento(memento) {
        this.state = memento.getState();
    }
}

class CareTaker {
    constructor() {
        this.mementoArray = [];
    }
    add(state) {
        this.mementoArray.push(state);
    }
    get(index) {
        return this.mementoArray[index];
    }
}

(function main() {
    let originator = new Originator();
    let caretaker = new CareTaker();

    originator.setState("State #1");
    originator.setState("State #2");
    caretaker.add(originator.saveSatetToMemento());
    originator.setState("State #3");
    caretaker.add(originator.saveSatetToMemento());
    originator.setState("State #4");

    console.log("Current State: " + originator.getState());
    originator.getStateFromMemento(caretaker.get(0));
    console.log("First saved State: " + originator.getState());
    originator.getStateFromMemento(caretaker.get(1));
    console.log("Second saved State: " + originator.getState());
})()