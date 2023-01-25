//状态模式示意

class StartState{
    doAction(context){
        console.log("Player is in start state");
        context.setState(this);
    }
    toString(){
        return "Start State";
    }
}

class StopSate{
    doAction(context){
        console.log("PLayer is in stop state");
        context.setState(this);
    }
    toString(){
        return "Stop State";
    }
}

class Context{
    constructor(){
        this.state=null;
    }
    setState(state){
        this.state=state;
    }
    getState(){
        return this.state;
    }
}

(function main(){
    let context=new Context();
    let startstate=new StartState();
    startstate.doAction(context);
    console.log(context.getState().toString());

    let stopstate=new StopSate();
    stopstate.doAction(context);
    console.log(context.getState().toString());
})()