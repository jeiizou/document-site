// 模板模式 示意

class Game {
    initialize() {}
    startPlay() {}
    endPlay() {}
    //模板
    play() {
        //初始化游戏
        this.initialize();
        //开始游戏
        this.startPlay();
        //结束游戏
        this.endPlay();
    }
}

class Cricket extends Game {
    constructor() {
        super();
    }
    endPlay() {
        console.log("Cricket Game Finished!");
    }
    initialize() {
        console.log("Cricket Game Initialized! Start playing.");
    }
    startPlay() {
        console.log("Cricket Game Started. Enjoy the game!");
    }
}

class Football extends Game {
    constructor() {
        super();
    }
    endPlay() {
       console.log("Football Game Finished!");
    }
    initialize() {
       console.log("Football Game Initialized! Start playing.");
    }
    startPlay() {
       console.log("Football Game Started. Enjoy the game!");
    }
}

(function(){
    let game=new Cricket();
    game.play();

    game= new Football();
    game.play();
})()