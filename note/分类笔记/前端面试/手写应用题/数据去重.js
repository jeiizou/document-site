// 给定一个任意数组，实现一个通用函数，让数组中的数据根据 key 排重：

// const dedup = (data, getKey = () => {} ) => {
//   // todo
// }
// let data1 = [
//   { id: 1, v: 1, id1: 1 },
//   { id: 2, v: 2, id1: 2 },
//   { id: 1, v: 1, id1: 1 },
// ]

// 以 id 和 id1 作为排重 key，执行函数得到结果
// data1 = [
//   { id: 1, v: 1, id1: 1 },
//   { id: 2, v: 2, id1: 2 },
// ];
// console.log(dedup(data, (item) => `${item.id}|${item.id1}`))

const dedup = (data = [], getKey = () => {}) => {
  let keyMap = {};

  return data.filter((item) => {
    let key = getKey(item);
    let hadKey = Object.prototype.hasOwnProperty.call(keyMap, key);
    if (hadKey) {
      return false;
    } else {
      keyMap[key] = true;
      return true;
    }
  });
};

let data1 = [
  { id: 1, v: 1, id1: 1 },
  { id: 2, v: 2, id1: 2 },
  { id: 1, v: 1, id1: 1 },
];

console.log(dedup(data1, (item) => `${item.id}|${item.id1}`));
