//中介者模式示意

class User{
    constructor(name){
        this.name=name;
    }
    say(message){
        ChatRoom.sent(this.name,message);
    }
}

class ChatRoom{
    constructor(){

    }
    static sent(user,message){
        console.log(`${user} says: ${message}. (${new Date()})`);
    }
}

(function(){
    let user1= new User('John');
    let user2= new User('Mike');
    user1.say('hello i\'m John');
    user2.say("hello i'm Mike");
})()