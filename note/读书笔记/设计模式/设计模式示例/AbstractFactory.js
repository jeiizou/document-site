//抽象工厂模式示意
"use strict"
//创建基类

//形状基类
class Shape {
    constructor(area, perimeter) {
        this.name = "shape";
        this.area = area;
        this.perimeter = perimeter;
    }
    getArea() {
        console.log(this.area);
    }
    getLength() {
        console.log(this.perimeter);
    }

}
//颜色基类
class Color {
    constructor(colorvalue) {
        this.name = "color";
        this.colorvalue = colorvalue;
    }
    getColor() {
        console.log(this.colorvalue);
    }
}

//创建子类
class Square extends Shape {
    constructor(borderlength) {
        super(borderlength * borderlength, borderlength * 4);
        this.borderlength = borderlength;
    }
    getBorderLength() {
        console.log(this.borderlength);
    }
}

class Red extends Color {
    constructor() {
        super('red');
    }
}

//创建一般工厂类
class ShapeFactory {
    create(type, ...value) {
        switch (type) {
            case 'square':
                return new Square(...value);
            default:
                break;
        }
    }
}

class ColorFactory {
    create(type, ...value) {
        switch (type) {
            case 'red':
                return new Red(...value);
            default:
                break;
        }
    }
}

//抽象工厂类
class AbstractFactory {
    createFactory(type) {
        switch (type) {
            case 'shape':
                return new ShapeFactory();
            case 'color':
                return new ColorFactory();
            default:
                break;
        }
    }
}

//主程序
(function main(){
    let abstractFactory=new AbstractFactory();
    let shapeFactory=abstractFactory.createFactory('shape');
    let square=shapeFactory.create('square',15);

    square.getArea();
    square.getLength();
    square.getBorderLength();
})()