function reverseStr(str) {
  const aCode = 'a'.charCodeAt(0); // 97
  const ACode = 'A'.charCodeAt(0); // 65
  const size = 26;

  let resStr = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    let curCode = char.charCodeAt(0);

    if (curCode >= aCode && curCode <= aCode + size) {
      resStr[i] = char.toLocaleUpperCase();
    } else if (curCode >= ACode && curCode <= ACode + size) {
      resStr[i] = char.toLocaleLowerCase();
    } else {
      resStr = char;
    }
  }

  return resStr.join('');
}

console.log(reverseStr('asdasdADSdasdzasAsazxaAdasdsa'));
