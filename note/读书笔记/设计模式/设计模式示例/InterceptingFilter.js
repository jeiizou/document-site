//拦截过滤器模式 示意
//实体过滤器
class AuthenticationFilter{
    execute(request){
        console.log("Authenticating request: " + request);
    }
}
class DebugFile{
    execute(request){
        console.log("request log: "+request);
    }
}
//Target
class Tartget{
    execute(request){
        console.log("Executing request: " + request);
    }
}
//过滤器链
class FilterChain{
    constructor(){
        this.filters=[];
        this.target;
    }

    addFilter(filter){
        this.filters.push(filter);
    }
    execute(request){
        for (let i = 0; i < this.filters.length; i++) {
            const el = this.filters[i];
            el.execute(request);
        }
        this.target.execute(request);
    }
    setTarget(target){
        this.target=target;
    }
}
//过滤器管理器
class FilterManager {
    constructor(target){
        this.filterChain=new FilterChain();
        this.filterChain.setTarget(target);
    }
    setFilter(filter){
        this.filterChain.addFilter(filter);
    }
    filterRequest(request){
        this.filterChain.execute(request);
    }
}
//客户端
class Client{
    constructor(){
        this.filterManager;
    }
    setFilterManager(filterManager){
        this.filterManager=filterManager;
    }
    sentRequest(request){
        this.filterManager.filterRequest(request);
    }
}

(function main(){
    let filterManager=new FilterManager(new Tartget());
    filterManager.setFilter(new AuthenticationFilter());
    filterManager.setFilter(new DebugFile());

    let client=new Client();
    client.setFilterManager(filterManager);
    client.sentRequest("HOME");
})()

