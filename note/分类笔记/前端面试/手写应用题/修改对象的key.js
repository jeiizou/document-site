// 有一个嵌套层次很深的对象，key 都是 a_b 形式 ，需要改成 ab 的形式，注意不能用递归。

// const a = {
//   a_y: {
//     a_z: {
//       y_x: 6
//     },
//     b_c: 1
//   }
// }
// ==>
// {
//   ay: {
//     az: {
//       yx: 6
//     },
//     bc: 1
//   }
// }

function changeObjectKey(obj = {}) {
  let keys = Object.keys(obj).map((item) => [item, obj]);
  while (keys && keys.length > 0) {
    let [key, obj] = keys.shift();
    let newkey = key.split('_').join('');
    obj[newkey] = obj[key];

    if (typeof obj[key] === 'object' && obj) {
      keys.push(...Object.keys(obj[key]).map((item) => [item, obj[key]]));
    }

    delete obj[key];
  }
}

const a = {
  a_y: {
    a_z: {
      y_x: 6,
    },
    b_c: 1,
  },
};

changeObjectKey(a);
console.log(a);
