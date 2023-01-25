/*字符串的编辑距离: 
引入状态和备忘录概念的基础上
给出状态转换关系和状态边界条件的动态规划算法
*/

function EditDistance(src, dest) {
  let i = 0;
  let j = 0;
  let d = [];
  for (let i = 0; i <= src.length; i++) {
    d[i] = [];
    for (let j = 0; j <= dest.length; j++) {
      if (i == 0) {
        d[i][j] = j;
      } else if (j == 0) {
        d[i][j] = i;
      } else {
        if (src[i - 1] == dest[j - 1]) {
          d[i][j] = d[i - 1][j - 1]; //不需要编辑操作
        } else {
          let edIns = d[i][j - 1] + 1; //source 插入字符
          let edDel = d[i - 1][j] + 1; //source 删除字符
          let edRep = d[i - 1][j - 1] + 1; //source 替换字符

          d[i][j] = Math.min(Math.min(edIns, edDel), edRep);
        }
      }
    }
  }
  //   console.log(d);
  return d[src.length][dest.length];
}

let res = EditDistance("snowy", "sunny");
console.log(res);
