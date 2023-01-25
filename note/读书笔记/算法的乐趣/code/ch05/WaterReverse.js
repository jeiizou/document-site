//三个水桶等分8升水的问题
//0:8升  1:5升  2:3升

//初始状态并记录当前水桶状态
let bucketArr = [
    { c: 8, now: 8 },
    { c: 5, now: 0 },
    { c: 3, now: 0 },
];
let BUCKETS_COUNT = 3;


//倒水动作数据
function tagACTION(from, to, water) {
    this.from = from;
    this.to = to;
    this.water = water;
}

//包含动作的倒水状态
function BuckState(curaction, curstate) {
    this.curaction = curaction;//当前的倒水动作{-1,1,8};
    this.curstate = curstate;//当前水桶状态{8,0,0}
}

//======================================

//判断是否是合法的倒水动作
function CanTakeDumpAction(from, to, current) {
    if (from >= BUCKETS_COUNT || from < 0) {
        console.log("error from")
        return false;
    }
    if (to >= BUCKETS_COUNT || to < 0) {
        console.log("error to")
        return false;
    }
    //不是同一个桶, 且from桶中有水, to桶中不满
    if (from != to) {
        if (!IsBucketEmpty(from, current) && !IsBucketFull(to, current)) {
            return true;
        }
    }
    return false;
}

//水桶为空
function IsBucketEmpty(num, current) {
    if (current.curstate[num] > 0) {
        return false;
    } else {
        return true;
    }
}

//水桶为满
function IsBucketFull(num, current) {
    if (bucketArr[num].c == current.curstate[num]) {
        return true;
    } else {
        return false;
    }
}

//判断状态重复
function IsProcessedState(states, newStateO) {
    let newState = newStateO.curstate;
    for (let i = 0; i < states.length; i++) {
        const curState = states[i].curstate;
        if (curState[0] == newState[0]
            && curState[1] == newState[1]
            && curState[2] == newState[2]) {
            return true;
        }
    }
    return false;
}

//判断是否符合最终状态[4,4,0]
function IsFinalState(stateO) {
    let state = stateO.curstate;
    if (state[0] == 4
        && state[1] == 4
        && state[2] == 0) {
        return true;
    } else {
        return false;
    }
}

let way_index=1;
//打印输出过程
function PrintResult(states) {
    console.log(`第${way_index}种方法:==============`);
    for (let i = 0; i < states.length; i++) {
        const el = states[i].curstate;
        console.log("第" + (i + 1) + "步:" + [...el]);
    }
    console.log(`==================================`);
    way_index++;
}

//状态搜索算法的核心
//首先检查当前状态列表的最后一个状态是否是结果需要的最终状态
//否则通过两重循环遍历6中可能的倒水动作
//将这些动作分别于当前状态结合形成新的状态, 然后继续搜索新的状态
function SearchState(states) {
    //每次搜索都从当前状态开始
    let current = states[states.length - 1];
    // console.log(current);
    if (IsFinalState(current)) {
        PrintResult(states);
        return;
    }
    for (let j = 0; j < BUCKETS_COUNT; j++) {
        for (let i = 0; i < BUCKETS_COUNT; i++) {
            SearchStateOnAction(states, current, i, j)
        }
    }
}

function SearchStateOnAction(states, current, from, to) {
    if (CanTakeDumpAction(from, to, current)) {
        let res = DumpWater(from, to, current);
        if (res && !IsProcessedState(states, res)) {
            states.push(res);
            SearchState(states);
            states.pop();
        }
    }
}

//完成实际的倒水动作
function DumpWater(from, to, current) {
    let curState = current.curstate;
    let to_water = bucketArr[to].c - curState[to];//to水桶中可倒的水
    let from_water = curState[from];//from水桶中有的水
    let water = -1;
    if (from_water < to_water) {
        water = from_water;
    } else {
        water = to_water;
    }

    if (water == -1) {
        console.log("get water error");
        return false;
    } else {
        let state = curState.concat();
        state[from] -= water;
        state[to] += water;
        
        let newAction = new tagACTION(from, to, water);
        let newState = new BuckState(newAction, state);

        return newState;
    }
}

//程序开始
(function main() {
    //状态列表
    let BuckStates = [];

    let state = [
        bucketArr[0].now,
        bucketArr[1].now,
        bucketArr[2].now
    ];
    let initAction = new tagACTION(-1, 0, 8);
    let initState = new BuckState(initAction, state);
    BuckStates.push(initState);
    // console.log(BuckStates);
    SearchState(BuckStates);
})();