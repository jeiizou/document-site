//字符串的编辑距离: 引入状态和备忘录概念

//准备数据
let src = "sunny";
let dest = "borry";

//定义二维表
let slength = src.length + 1;
let dlength = dest.length + 1; //防止访问溢出

let memo = new Array(slength);
for (let i = 0; i < memo.length; i++) {
  memo[i] = new Array(dlength);
  for (let j = 0; j < memo[i].length; j++) {
    memo[i][j] = {
      refCount: 0,
      distance: null
    };
  }
}

function EditDistance(src, dest, i, j) {
  // console.log(memo[i][j]);
  //查表, 直接返回
  if (memo[i][j].refCount != 0) {
    memo[i][j].refCount++;
    return memo[i][j].distance;
  }

  let distance = 0;

  if (src.substr(i).length == 0) {
    distance = dest.substr(j).length;
  } else if (dest.substr(j).length == 0) {
    distance = src.substr(i).length;
  } else {
    if (src[i] == dest[j]) {
      distance = EditDistance(src, dest, i + 1, j + 1);
    } else {
      let edIns = EditDistance(src, dest, i, j + 1) + 1; //插入字符
      let edDel = EditDistance(src, dest, i + 1, j) + 1; //删除字符
      let edRep = EditDistance(src, dest, i + 1, j + 1) + 1; //替换字符
      distance = Math.min(Math.min(edIns, edDel), edRep);
    }
  }

  memo[i][j].distance = distance;
  memo[i][j].refCount = 1;

  return distance;
}

let res = EditDistance(src, dest, 0, 0);

console.log(res);
