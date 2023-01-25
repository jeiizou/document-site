//组合实体模式 示意
//依赖对象
class DependentObject1 {
    constructor() {
        this.data;
    }
    setData(data) {
        this.data = data
    }
    getData() {
        return this.data;
    }
}
class DependentObject2 {
    constructor() {
        this.data;
    }
    setData(data) {
        this.data = data
    }
    getData() {
        return this.data;
    }
}
//粗粒度对象
class CoarseGrainedObject {
    constructor(){
        this.do1=new DependentObject1();
        this.do2=new DependentObject2();
    }
    setData(data1, data2){
        this.do1.setData(data1);
        this.do2.setData(data2);
    }
    getData(){
        return [
            this.do1.getData(),
            this.do2.getData()
        ]
    }
}
//组合实体
class CompositeEntity {
    constructor(){
        this.cgo=new CoarseGrainedObject();
    }
    setData(data1,date2){
        this.cgo.setData(data1,date2);
    }
    getData(){
        return this.cgo.getData();
    }
}
//客户端
class Client{
    constructor(){
        this.compositeEntity =new CompositeEntity();
    }
    setData(data1,date2){
        this.compositeEntity.setData(data1,date2);
    }
    printData(){
        for (let i = 0; i < this.compositeEntity.getData().length; i++) {
            const el = this.compositeEntity.getData()[i];
            console.log("Data: "+el);
        }
    }
}

(function(){
    let client=new Client();
    client.setData("Test","Data");
    client.printData();
    client.setData("Second Test","Data1");
    client.printData();
})()
