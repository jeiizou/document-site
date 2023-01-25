//服务定位器模式 示意
//创建实体服务
class Service1 {
    execute() {
        console.log("Executing Service1");
    }
    getName() {
        return "Service1";
    }
}
class Service2 {
    execute() {
        console.log("Executing Service2");
    }
    getName() {
        return "Service2";
    }
}
//为 JNDI 查询创建 InitialContext。
class InitialContext {
    lookup(jndiName) {
        if (jndiName.indexOf("Service1")!=-1) {
            console.log("Looking up and creating a new Service1 object");
            return new Service1();
        } else if (jndiName.indexOf("Service2")!=-1) {
            console.log("Looking up and creating a new Service2 object");
            return new Service2();
        }
        return null;
    }
}
//创建缓存Cache
class Cache {
    constructor() {
        this.services = [];
    }
    getService(servicesName) {
        for (let i = 0; i < this.services.length; i++) {
            const el = this.services[i];
            if (el.getName().indexOf(servicesName) != -1) {
                console.log("Returning cached  " + servicesName + " object");
                return el;
            }
        }
        return null;
    }
    addService(newServices) {
        let exists = false;
        for (let i = 0; i < this.services.length; i++) {
            const el = this.services[i];
            if (el.getName().indexOf(newServices.getName())) {
                exists = true;
            }
        }
        if (!exists) {
            this.services.push(newServices);
        }
    }
}
//创建服务定位器
class ServiceLocator {
    constructor() {
        this.cache = new Cache();
    }
    getService(jndiName) {
        let service = this.cache.getService(jndiName);

        if (service != null) {
            return service;
        }

        let context = new InitialContext();
        let service1 = context.lookup(jndiName);
        this.cache.addService(service1);
        return service1;
    }
}

(function () {
    let serviceLocator=new ServiceLocator();

    let service = serviceLocator.getService("Service1");
    service.execute();
    service = serviceLocator.getService("Service2");
    service.execute();
    service = serviceLocator.getService("Service1");
    service.execute();
    service = serviceLocator.getService("Service2");
    service.execute();

})()