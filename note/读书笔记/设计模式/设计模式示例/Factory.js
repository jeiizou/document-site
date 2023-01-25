//工厂模式示意
"use strict"

//创建基类Shape
class Shape {
    constructor() {
        this.name = 'Shape';
    }
    say() {
        console.log('Father, I am a ', this.name + '.');
    }
}

//创建基于基类的子类
class Rectangle extends Shape {
    constructor(width, height) {
        super();
        this.name = 'Rectangle';
        this.width = width;
        this.height = height;
    }
    say() {
        super.say();
        console.log('Child, I am a ', this.name + '.');
    }
}

class Square extends Shape {
    constructor(length) {
        super();
        this.name = 'Square';
        this.length = length;
    }
    say() {
        super.say();
        console.log('Child, I am a ', this.name + '.');
    }
}

class Circle extends Shape {
    constructor(radius) {
        super();
        this.name = 'Circle';
        this.radius = radius;
    }
    say() {
        super.say();
        console.log('Child, I am a ', this.name + '.');
    }
}

//创建工厂类
class ShapeFactory {
    create(type) {
        switch (type) {
            case 'Rectangle':
                return new Rectangle();
            case 'Square':
                return new Square();
            case 'Circle':
                return new Circle();
            default:
                break;
        }
    }
}

//主程序
(function main(){
    //实例化工厂类
    let shapeFactory=new ShapeFactory();

    let shape1=shapeFactory.create('Rectangle');
    shape1.say();
    let shape2=shapeFactory.create('Square');
    shape2.say();
    let shape3=shapeFactory.create('Circle');
    shape3.say();
})()