//妖怪与和尚过河问题

const LOCAL = true;
const REMOTE = false;
const monster_count = 3;
const monk_count = 3;

//数据结构-过河动作
function tagActionEffection(act, boat_to, monster, move_monk) {
    this.act = act;//移动方式
    this.boat_to = boat_to;//船的移动方向
    this.monster = monster;//此次移动的妖怪数量
    this.move_monk = move_monk;//此次移动的和尚数量
}

//数据结构-当前状态
/*
let state={
    local_monster:3,
    local_monk:3,
    remote_monster:0,
    remote_monk:0,
    boat:LOCAL
}
*/
//数据结构-当前状态-包含动作
function ItemState(state, action) {
    this.state = state;//当前的状态
    this.action = action;//已经进行的动作
}


//包含所有的过河动作
let actEffect = [
    { name: "ONE_MONSTER_GO", boat_to: REMOTE, monster: -1, monk: 0 },
    { name: "TWO_MONSTER_GO", boat_to: REMOTE, monster: -2, monk: 0 },
    { name: "ONE_MONK_GO", boat_to: REMOTE, monster: 0, monk: -1 },
    { name: "TWO_MONK_GO", boat_to: REMOTE, monster: 0, monk: -2 },
    { name: "ONE_MONSTER_ONE_MONK_GO", boat_to: REMOTE, monster: -1, monk: -1 },
    { name: "ONE_MONSTER_BACK", boat_to: LOCAL, monster: 1, monk: 0 },
    { name: "TWO_MONSTER_BACK", boat_to: LOCAL, monster: 2, monk: 0 },
    { name: "ONE_MONK_BACK", boat_to: LOCAL, monster: 0, monk: 1 },
    { name: "TWO_MONK_BACK", boat_to: LOCAL, monster: 0, monk: 2 },
    { name: "ONE_MONSTER_ONE_MONK_BACK", boat_to: LOCAL, monster: 1, monk: 1 }
]




//判断动作合法性
function CanTakeAction(curstate, action) {
    if (curstate.boat == action.boat_to) {
        return false;
    }
    if ((curstate.local_monster + action.monster) < 0
        || (curstate.local_monster + action.monster) > monster_count) {
        return false;
    }
    if ((curstate.local_monk + action.monk) < 0
        || (curstate.local_monk + action.monk) > monk_count) {
        return false;
    }

    return true;
}

//判断是否是最终状态
function IsFinalState(current) {
    let curstate = current.state;
    
    if (
        curstate.local_monk == 0
        && curstate.local_monster == 0
        && curstate.boat == false
    ) {
        return true;
    } else {
        return false;
    }
}

//判断是否重复
function IsProcessdState(states, nextState) {
    for (let i = 0; i < states.length; i++) {
        const state = states[i].state;
        if (
            state.local_monster == nextState.local_monster
            && state.local_monk == nextState.local_monk
            && state.remote_monster == nextState.remote_monster
            && state.remote_monk == nextState.remote_monk
            && state.boat == nextState.boat
        ) {
            return true;
        }
    }

    return false;
}

//判断是否合法的状态
function IsValidState(state) {
    if ((state.local_monk > 0) && (state.local_monster > state.local_monk)) {
        return false;
    }
    if ((state.remote_monk > 0) && (state.remote_monster > state.remote_monk)) {
        return false;
    }

    return true;
}

//打印输出最终状态
let index = 0;
function PrintResult(states) {
    console.log(`第${index+1}种方法: `)
    for (let i = 0; i < states.length; i++) {
        const state = states[i];
        console.log(`第${i}步: ${JSON.stringify(state.action)}, 得到: ${JSON.stringify(state.state)}`);
    }
    index++;
}

//算法核心
//函数每次从状态队列尾部去除当前要处理的状态, 
//首先判断是否是最终的过河状态, 如果是则输出一组过河方案, 如果不是,
//则尝试用动作列表中的动作与当前状态结合, 看看能够生成合法的新状态.
function SearchState(states) {
    let current = states[states.length - 1];
    if (IsFinalState(current)) {
        PrintResult(states);
        return;
    }
    //分别用10中动作与当前状态组合
    for (let i = 0; i < actEffect.length; i++) {
        SearchSatesOnNewAction(states, current, actEffect[i]);
    }
}

function SearchSatesOnNewAction(states, current, action) {
    let nextState = MakeActionNewSate(states, current, action);
    if (nextState && IsValidState(nextState.state) && !IsProcessdState(states, nextState.state)) {
        states.push(nextState);
        SearchState(states);
        states.pop();
    }
}

//执行动作

function MakeActionNewSate(states, current, action) {
    if (CanTakeAction(current.state, action)) {
        let newstate = clone(current.state);
        newstate.local_monster += action.monster;
        newstate.local_monk += action.monk;
        newstate.remote_monster -= action.monster;
        newstate.remote_monk -= action.monk;
        newstate.boat = action.boat_to;
        let newNode = new ItemState(newstate, action);
        return newNode;
    }

    return false;
}

//附加函数: 对象的克隆
function clone(obj) {
    var result = {};
    for (key in obj) {
        result[key] = obj[key];
    }
    return result;
}


//主程序
(function main() {
    let states = [];
    let state = {
        local_monster: 3,
        local_monk: 3,
        remote_monster: 0,
        remote_monk: 0,
        boat: LOCAL
    }
    let cstate = new ItemState(state, null);
    states.push(cstate);

    SearchState(states);
})()