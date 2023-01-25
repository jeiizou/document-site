//Google方程等式问题

//WWWDOT - GOOGLE = DOTCOM

function tagCharItem(c, value, leading) {
  this.c = c;
  this.value = value;
  this.leading = leading;
}

function tagCharValue(used, value) {
  this.used = used;
  this.value = value;
}

let charItem = [
  new tagCharItem("W", -1, true),
  new tagCharItem("D", -1, true),
  new tagCharItem("O", -1, false),
  new tagCharItem("T", -1, false),
  new tagCharItem("G", -1, true),
  new tagCharItem("L", -1, false),
  new tagCharItem("E", -1, false),
  new tagCharItem("C", -1, false),
  new tagCharItem("M", -1, false)
];

let charValue = [
  new tagCharItem(false, 0),
  new tagCharItem(false, 1),
  new tagCharItem(false, 2),
  new tagCharItem(false, 3),
  new tagCharItem(false, 4),
  new tagCharItem(false, 5),
  new tagCharItem(false, 6),
  new tagCharItem(false, 7),
  new tagCharItem(false, 8),
  new tagCharItem(false, 9)
];

let max_char_count = charItem.length;
let max_num_count=charValue.length;

function SearchingResult(ci, cv, index, callback) {
  if (index >= max_char_count) {
    callback(ci);
    return;
  }

  for (let i = 0; i < max_num_count; i++) {
    if (isValueValid(ci[index], cv[i])) {
      cv[i].used = true;
      ci[index].value = cv[i].value;
      SearchingResult(ci, cv, index + 1, callback);
      cv[i].used = false;
    }
  }
}

function isValueValid(ci, cv) {
  if ((cv.value == 0 && ci.leading) || cv.used) {
    return false;
  } else {
    return true;
  }
}

function makeIntegerValue(ci, str) {
  let t_str = str.toString().split("");
  let p_number = [];
  for (let i = 0; i < t_str.length; i++) {
    for (let j = 0; j < ci.length; j++) {
      if (t_str[i] == ci[j].c) {
        p_number.push(ci[j].value);
      }
    }
  }
  return parseInt(p_number.join(""));
}

function onCharListReady(ci) {
  let minuend = "WWWDOT";
  let subtrahead = "GOOGLE";
  let diff = "DOTCOM";

  let m = makeIntegerValue(ci, minuend);
  let s = makeIntegerValue(ci, subtrahead);
  let d = makeIntegerValue(ci, diff);

  if (m - s == d) {
    console.log(`${m} - ${s} = ${d}`);
  }
}

SearchingResult(charItem, charValue, 0, onCharListReady);
