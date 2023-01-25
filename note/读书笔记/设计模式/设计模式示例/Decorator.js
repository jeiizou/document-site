//装饰器模式

//实体类
class Plane{
    constructor(){

    }
    fire(){
        console.log('发射子弹');
    }
}
//装饰类
class PlaneDecorator{
    constructor(plane){
        this.plane=plane;
    }

    fire(){
        this.plane.fire();
        console.log("发射导弹");
    }
}

(function main(){
    let plane=new Plane();
    let plane2=new PlaneDecorator(plane);

    plane2.fire();
})()