//阿拉伯数字转中文数字

//数字映射
let chnNumChar = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

//节权
let chnUnitSection = ["", "万", "亿", "万亿"];

//节内数字权位
let chnunitChat = ["", "十", "百", "千"];

function Number2Chinese(num) {
  let unitPost = 0;
  let strIns = "";
  let chnStr = "";
  let needZero = false;

  while (num > 0) {
    let section = parseInt(num % 10000);
    if (needZero) {
      chnStr = chnNumChar[0] + chnStr;
    }
    strIns = Selection2Chinese(section);

    // 是否需要节权位
    strIns += section != 0 ? chnUnitSection[unitPost] : chnUnitSection[0];
    chnStr = strIns + chnStr;
    // 下一节需要补零
    needZero = section < 1000 && section > 0;
    num = parseInt(num / 10000);
    unitPost++;
  }

  return chnStr;
}

//将一个节的数字转换成中文数字
function Selection2Chinese(section) {
  let strIns = "";
  let chnStr = "";
  let unitPost = 0;
  let zero = true;
  while (section > 0) {
    let v = parseInt(section % 10);
    if (v == 0) {
      if (section == 0 || !zero) {
        zero = true;
        chnStr = chnNumChar[v] + chnStr;
      }
    } else {
      zero = false;
      strIns = chnNumChar[v];
      strIns += chnunitChat[unitPost];
      chnStr = strIns + chnStr;
    }
    unitPost++;
    section = parseInt(section / 10);
  }

  return chnStr;
}

(function test() {
  let num = 123456789;
  let res = Number2Chinese(num);
  console.log(res);
})();
