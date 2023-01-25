//业务代表模式 示意
//实体服务类
class EJBService{
    doProcessing(){
        console.log("Processing task by invoking EJB Service");
    }
}

class JMSService{
    doProcessing(){
        console.log("Processing task by invoking JMS Service");
    }
}
//业务查询服务
class BusinessLookUp{
    getBusinessService(serviceType){
        if(serviceType.indexOf("EJB")!=-1){
            return new EJBService();
        }else{
            return new JMSService();
        }
    }
}
//业务代表
class BusinessDelegate{
    constructor(){
        this.lookupService=new BusinessLookUp();
        this.businessService;
        this.serviceType;
    }
    setServiceType(serviceType){
        this.serviceType=serviceType;
    }
    doTask(){
        this.businessService=this.lookupService.getBusinessService(this.serviceType);
        this.businessService.doProcessing();
    }
}
//客户端
class Client{
    constructor(businessService){
        this.businessService=businessService;
    }
    doTask(){
        this.businessService.doTask();
    }
}

(function main(){
    let businessDelegate= new BusinessDelegate();
    businessDelegate.setServiceType("EJB");

    let client= new Client(businessDelegate);
    client.doTask();
    businessDelegate.setServiceType("JMS");
    client.doTask();
})()
