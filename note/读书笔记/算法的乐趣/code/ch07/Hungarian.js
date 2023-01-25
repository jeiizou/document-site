//最大匹配与匈牙利算法

//数据结构
function tagMaxMatch(edge, on_path, path, max_match) {
    this.edge = edge; //顶点与边的关系表, 用来表示二部图
    this.on_path = on_path; //定点Yj是否已经在当前搜索过程中形成的增广路径上
    this.path = path; //当前找到的增广路径
    this.max_match = max_match; //当前增广路径中边的条数.
}

function tagPartner(name, next, current, pCount, perfect) {
    this.name = name;
    this.next = next;
    this.current = current;
    this.pCount = pCount;
    this.perfect = perfect;
}

//数据准备
let X = [
    ["X1", 0, -1, 1, [2]],
    ["X2", 0, -1, 2, [0, 1]],
    ["X3", 0, -1, 3, [1, 2, 3]],
    ["X4", 0, -1, 2, [1, 2]],
    ["X5", 0, -1, 3, [2, 3, 4]]
];

let Y = [
    ["Y1", 0, -1, 1, [1]],
    ["Y2", 0, -1, 3, [1, 2, 3]],
    ["Y3", 0, -1, 4, [0, 2, 3, 4]],
    ["Y4", 0, -1, 2, [2, 4]],
    ["Y5", 0, -1, 1, [4]]
];

const UNIT_COUNT = 5;

//搜索算法
function FindAugmentPath(match, xi) {
    for (let yj = 0; yj < UNIT_COUNT; yj++) {
        if (match.edge[xi][yj] == 1 && !match.on_path[yj]) {
            match.on_path[yj] = true;
            if (
                match.path[yj] == -1 ||
                FindAugmentPath(match, match.path[yj])
            ) {
                match.path[yj] = xi;
                return true;
            }
        }
    }
    return false;
}

function ClearOnPathSign(match) {
    for (let i = 0; i < UNIT_COUNT; i++) {
        match.on_path[i] = false;
    }
}

//入口函数
function Hungary_Match(match) {
    for (let xi = 0; xi < UNIT_COUNT; xi++) {
        if (FindAugmentPath(match, xi)) {
            match.max_match++;
        }
        ClearOnPathSign(match);
    }
    return match.max_match == UNIT_COUNT;
}

//初始化图和数据
function InitGraph(X_origin, Y_origin) {
    let X = [],
        Y = [];
    let edge = [],
        on_path = [],
        path = [];
    for (let i = 0; i < UNIT_COUNT; i++) {
        X.push(new tagPartner(...X_origin[i]));
        Y.push(new tagPartner(...Y_origin[i]));

        edge.push([]);
        on_path.push(false);
        path.push(-1);
        for (let j = 0; j < UNIT_COUNT; j++) {
            edge[i][j] = 0;
        }
        for (let j = 0; j < X[i].pCount; j++) {
            edge[i][X[i].perfect[j]] = 1;
        }
    }
    let match = new tagMaxMatch(edge, on_path, path, 0);

    return { match, X, Y };
}

function PrintResult(match, X, Y) {
    console.log(match);
    for (let i = 0; i < match.max_match; i++) {
        console.log(`${X[match.path[i]].name}<===>${Y[i].name}`);
    }
}

(function main() {
    let res = InitGraph(X, Y);
    if (Hungary_Match(res.match)) {
        PrintResult(res.match, res.X, res.Y);
    }
})();
