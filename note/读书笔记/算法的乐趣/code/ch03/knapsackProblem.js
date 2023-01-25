//背包问题(0-1背包问题)

//物品
let tagObejct = {
    weight:null, //重量
    price:null, //价值
    status:0, //0:未选中,1:已选中,2:已超重,不可选
}

//背包
let tagKnapsackProblem = {
    objes: [],
    totalC: 150,
}

//贪婪算法主体
function GreedyAlgo(problem, spfunct) {
    let idx;
    let ntc = 0;
    while ((idx = spfunct(problem.objes, problem.totalC - ntc)) != -1) {
        // console.log(idx);
        if ((ntc + problem.objes[idx].weight) <= problem.totalC) {
            problem.objes[idx].status = 1;
            ntc += problem.objes[idx].weight;
        } else {
            problem.objes[idx].status = 2;
        }
    }

    PrintResult(problem.objes);
}

/**
 * 选择策略-价值最高优先
 * @param {*} objes 物品列表 
 * @param {*} c 剩余承重
 */
function Choosefunc1(objes, c) {
    let index = -1;
    let mp = 0;
    for (let i = 0; i < objes.length; i++) {
        if ((objes[i].status == 0) && (objes[i].price > mp)) {
            mp = objes[i].price;
            index = i;
        }
    }

    return index;
}

function PrintResult(objes) {
    console.log(objes);
}

(function main() {
    let wArray = [35, 30, 60, 50, 40, 10, 25];
    let pArray = [10, 40, 30, 50, 35, 40, 30];
    for (let i = 0; i < 7; i++) {
        let tempObj = {
            weight: wArray[i],
            price: pArray[i],
            status: 0
        }
        tagKnapsackProblem.objes.push(tempObj);
    }

    GreedyAlgo(tagKnapsackProblem, Choosefunc1);
})()