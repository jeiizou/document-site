//Kuhn_Munkress

const UNIT_COUNT = 5;
const INFINITY = 100000000; //相对无穷大

function PARTNER(name, weight) {
  this.name = name; //名字
  this.weight = weight; //[UNIT_COUNT]
}

function KM_MATCH(edge, sub_map, x_on_path, y_on_path, path) {
  this.edge = edge; //Xi与Yj对应的边的权重
  this.sub_map = sub_map; //二分图的相等子图, sub_map[i][j]=1 代表Xi与Yj有边
  this.x_on_path = x_on_path; //标记在一次寻找增广路径的过程中, Xi是否在增广路径上
  this.y_on_path = y_on_path; //标记在一次寻找增广路径的过程中, Yj是否在增广路径上
  this.path = path; //匹配信息, 其中i为Y中的顶点标号,path[i]为X中顶标
}

//在相等子图中寻找Xi为起点的增广路径
function FindAugmentPath(km, xi) {
  for (let yj = 0; yj < UNIT_COUNT; yj++) {
    if (!km.y_on_path[yj] && km.sub_map[xi][yj]) {
      km.y_on_path[yj] = true;
      let xt = km.path[yj];
      km.path[yj] = xi;
      if (xt == -1 || FindAugmentPath(km, xt)) {
        return true;
      }
      km.path[yj] = xt;
      if (xt != -1) {
        km.x_on_path[xt] = true;
      }
    }
  }
  return false;
}

function ResetMatchPatch(km) {
  for (let i = 0; i < UNIT_COUNT; i++) {
    km.path[i] = -1;
  }
}

function ClearOnPathSign(km) {
  for (let i = 0; i < UNIT_COUNT; i++) {
    km.x_on_path[i] = false;
    km.y_on_path[i] = false;
  }
}

function Kuhn_Munkress_Match(km) {
  let A = new Array(UNIT_COUNT),
    B = new Array(UNIT_COUNT);
  for (let i = 0; i < UNIT_COUNT; i++) {
    B[i] = 0;
    A[i] = -INFINITY;
    for (let j = 0; j < UNIT_COUNT; j++) {
      A[i] = Math.max(A[i], km.edge[i][j]);
    }
  }
  while (true) {
    //初始化带权二分图的相等子图
    for (let i = 0; i < UNIT_COUNT; i++) {
      for (let j = 0; j < UNIT_COUNT; j++) {
        km.sub_map[i][j] = A[i] + B[j] == km.edge[i][j];
      }
    }
    //使用匈牙利算法寻找相等子图的完备匹配
    let match = 0;
    ResetMatchPatch(km);
    for (let xi = 0; xi < UNIT_COUNT; xi++) {
      ClearOnPathSign(km);
      if (FindAugmentPath(km, xi)) {
        match++;
      } else {
        km.x_on_path[xi] = true;
        break;
      }
    }
    //如果找到完备匹配就返回结果
    if (match == UNIT_COUNT) {
      return true;
    }
    //调整顶标, 继续算法
    let dx = INFINITY;
    for (let i = 0; i < UNIT_COUNT; i++) {
      if (km.x_on_path[i]) {
        for (let j = 0; j < UNIT_COUNT; j++) {
          if (!km.y_on_path[j]) {
            dx = Math.min(dx, A[i] + B[j] - km.edge[i][j]);
          }
        }
      }
    }
    for (let i = 0; i < UNIT_COUNT; i++) {
      if (km.x_on_path[i]) {
        A[i] -= dx;
      }
      if (km.y_on_path[i]) {
        B[i] += dx;
      }
    }
  }
}

/*
    Y1   Y2   Y3   Y4   Y5
X1  3    5    5    4    1
X2  2    2    0    2    2
X3  2    4    4    1    0
X4  0    1    1    0    0
X5  1    2    1    3    3
*/

//数据
let X = [
  ["X1", [3, 5, 5, 4, 1]],
  ["X2", [2, 2, 0, 2, 2]],
  ["X3", [2, 4, 4, 1, 0]],
  ["X4", [0, 1, 1, 0, 0]],
  ["X5", [1, 2, 1, 3, 3]]
];

function InitGraph(X_origin) {
  let edge = [];
  let sub_map = [];
  let x_on_path = [];
  let y_on_path = [];
  let path = [];
  let X = [];
  for (let i = 0; i < UNIT_COUNT; i++) {
    edge[i] = [];
    sub_map[i] = [];
    x_on_path[i] = 0;
    y_on_path[i] = 0;
    path[i] = -1;
    X.push(new PARTNER(...X_origin[i]));
    for (let j = 0; j < UNIT_COUNT; j++) {
      sub_map[i][j] = 0;
      edge[i][j] = X[i].weight[j];
    }
  }

  return new KM_MATCH(edge, sub_map, x_on_path, y_on_path, path);
}

function PrintResult(km) {
  let cost = 0;
  for (let i = 0; i < UNIT_COUNT; i++) {
    cost += km.edge[km.path[i]][i];
    console.log(`x: ${km.path[i]}<--->y:${i}`);
  }
  console.log(`total cost: ${cost}`);
}

(function main() {
  let km = InitGraph(X);
  if (Kuhn_Munkress_Match(km)) {
    PrintResult(km);
  }
})();