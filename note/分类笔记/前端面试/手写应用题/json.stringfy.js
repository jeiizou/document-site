// 实现一个json.stringfy
function myStringify(json) {
  const type = Object.prototype.toString.call(json);
  switch (type) {
    case '[object Array]':
      return '[' + json.map((item) => myStringify(item)).join(',') + ']';
    case '[object Object]':
      let str = '{';
      for (const key of Object.keys(json)) {
        str += `"${key}": ${myStringify(json[key])},`;
      }
      str = str.slice(0, -1) + '}';
      return str;
    default:
      if (json !== undefined && json !== null) {
        return '"' + json.toString() + '"';
      } else {
        return '';
      }
  }
}

let str = myStringify({
  a: '1',
  b: [
    {
      v: '11',
    },
  ],
});

console.log(str);
