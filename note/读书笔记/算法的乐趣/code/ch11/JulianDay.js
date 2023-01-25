//格里历和儒略日

const MONTHES_YEAR = 12;
let daysOfMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

//计算儒略日公式--来自维基百科
function CalculateJulianDay(year, month, day, hour, minute, second) {
  let a = (14 - month) / 12;
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  let jdn = day + (153 * m + 2) / 5 + 365 * y + y / 4;
  if (IsGregorianDays(year, month, day)) {
    jdn = jdn - y / 100 + y / 400 - 32045.5;
  } else {
    jdn -= 32083.5;
  }

  return jdn + hour / 24.0 + minute / 1440.0 + second / 86400.0;
}

//Zeller--蔡勒公式
function ZellerWeek(year, month, day) {
  let m = month;
  let d = day;
  if (month <= 2) {
    //对小于3的月份进行修正
    year--;
    m = month + 12;
  }
  let y = parseInt(year % 100);
  let c = parseInt(year / 100);

  let w = parseInt(
    (y + y / 4 + c / 4 - 2 * c + (13 * (m + 1)) / 5 + d - 1) % 7
  );
  if (w < 0) {
    w += 7;
  }
  return w;
}

//判断是否为闰年;
function IsLeapYear(year) {
  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}

function InsertRowSpace(firstWeek) {
  let count = firstWeek;
  let src = "";
  for (let i = 0; i < count; i++) {
    src += "\t";
  }
  return src;
}

//获取对应月的天数
function GetDaysOfMonth(year, month) {
  if (month < 1 || month > MONTHES_YEAR) return 0;
  let days = daysOfMonth[month - 1];
  if (month == 2 && IsLeapYear(year)) {
    days++;
  }
  return days;
}

function PrintMonthCalendar(year, month) {
  let days = GetDaysOfMonth(year, month); //确定这个月的天数
  let firstDayWeek = ZellerWeek(year, month, 1);
  let src = InsertRowSpace(firstDayWeek);//插入前置空格
  let week = firstDayWeek;
  let i = 1;
  while (i <= days) {
    src += `${i}\t`;
    if (week == 6) {
      src += "\n";
    }
    i++;
    week = (week + 1) % 7;
  }
  console.log(`周日\t周一\t周二\t周三\t周四\t周五\t周六\t`);
  console.log(src);
}

function main() {
  PrintMonthCalendar(2018, 11);
}

main();
