//代理模式 示意
//实体类
class Image{
    constructor(filename){
        this.filename=filename;
    }
    display(){
        console.log('show this image for real');
    }
    showName(){
        console.log(this.filename);
    }
}
//代理类
class ProxyImage{
    constructor(filename){
        this.Image=new Image(filename);
    }
    display(){
        this.Image.display();
    }
    showName(){
        this.Image.showName();
    }
}
(function(){
    let proxyImage=new ProxyImage('disk://image.img');
    proxyImage.display();
    proxyImage.showName();
})()