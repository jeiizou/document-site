//观察者模式 示意

/**
 * 观察者模式使用三个类 Subject、Observer 和 Client。Subject 对象带有绑定观察者到 Client 对象和从 Client 对象解绑观察者的方法。我们创建 Subject 类、Observer 抽象类和扩展了抽象类 Observer 的实体类。
 * ObserverPatternDemo，我们的演示类使用 Subject 和实体类对象来演示观察者模式。
 */

class Subject {
    constructor() {
        this.OberversArray = [];
        this.state;
    }
    getSate() {
        return this.state;
    }
    setState(state) {
        this.state = state;
        this.notifyAllObservers();
    }
    attach(oberver) {
        this.OberversArray.push(oberver);
    }
    notifyAllObservers() {
        for (let index = 0; index < this.OberversArray.length; index++) {
            const element = this.OberversArray[index];
            if (element.update) {
                element.update()
            } else {
                console.log('element is not a oberver');
            }
        }
    }
}

class Observer {
    constructor() {

    }
    update() {}
}

//实体观察类
class BinaryOberver extends Observer{
    constructor(subject){
        super();
        this.subject=subject;
        if(this.subject.attach){
            this.subject.attach(this);
        }else{
            console.log('is not subject');
        }
    }
    update(){
        console.log("Binary String: "+this.subject.getSate());
    }
}

(function main(){
    let subject=new Subject();

    let binary=new BinaryOberver(subject);

    subject.setState(15);
    subject.setState(10);
})()