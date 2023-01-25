// 中文数字转阿拉伯数字

//数据结构
function CHN_NAME_VALUE(name, value, secUnit) {
  this.name = name; //中文权位名称
  this.value = value; //10的倍数值
  this.secUnit = secUnit; //是否是节权位
}

// 建立关系表
let chnValuePair = [
  new CHN_NAME_VALUE("十", 10, false),
  new CHN_NAME_VALUE("百", 100, false),
  new CHN_NAME_VALUE("千", 1000, false),
  new CHN_NAME_VALUE("万", 10000, true),
  new CHN_NAME_VALUE("亿", 100000000, true)
];

function Chinese2Number(chnString) {
  let rtn = 0;
  let section = 0;
  let number = 0;
  let secUnit = { value: false };
  let pos = 0;

  while (pos < chnString.length) {
    let num = Chinese2Value(chnString.substr(pos, 1));
    // console.log(num,pos,chnString,chnString.length);
    if (num >= 0) {
      //数字还是单位
      number = num;
      pos++;
      if (pos >= chnString.length) {
        //如果最后一位是数字, 直接结束
        section += number;
        rtn += section;
        break;
      }
    } else {
      let unit = Chinese2Unit(chnString.substr(pos, 1), secUnit);
      if (secUnit.value) {
        //节权位, 说明一个节已经结束
        section = (section + number) * unit;
        rtn += section;
        section = 0;
      } else {
        section += number * unit;
      }

      number = 0;
      pos++;
      if (pos >= chnString.length) {
        rtn += section;
        break;
      }
    }
  }
  return rtn;
}

function Chinese2Value(str) {
  //映射表
  let chn_num_char = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  for (let i = 0; i < chn_num_char.length; i++) {
    const el = chn_num_char[i];
    if (el == str) {
      return i;
    }
  }

  return -1;
}

function Chinese2Unit(str, secUnit) {
  for (let i = 0; i < chnValuePair.length; i++) {
    const el = chnValuePair[i];
    if (str == el.name) {
      if (el.secUnit) {
        secUnit.value = true;
      } else {
        secUnit.value = false;
      }
      return el.value;
    }
  }

  console.error("非法权位:" + str);
  return false;
}

let test = "一百零一万三千三百三十三";

let res = Chinese2Number(test);

console.log(res);
