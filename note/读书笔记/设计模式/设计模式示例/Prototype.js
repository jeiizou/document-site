//原型模式示意
//JS天生支持原型模式, 这里指的就是Prototype链

function CreateJsPerson(name, age) {
    this.name = name; // p1.name=name
    this.age = age;
}

CreateJsPerson.prototype.writeJs = function () {
    console.log(this.name + ' write js');
};

var p1 = new CreateJsPerson('iceman' , 25);
var p2 = new CreateJsPerson('mengzhe' , 27);
    
console.log(p1.writeJs === p2.writeJs); // true

