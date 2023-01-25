//RLE 数据压缩算法
function IsRepetitionStart(src, length) {
  if (length <= 2) {
    return false;
  }
  let index = 0;
  if (src[index + 1] == src[index] && src[index + 2] == src[index]) {
    return true;
  }
  return false;
}

//限制返回长度不超过127
function GetRepetitionCount(start, length) {
  if (length <= 1) {
    return length;
  }
  let index = 0;
  let value = start[index];
  index++;
  let src = start;
  let i = 1;
  while (index < start.length + length && i < 127) {
    if (src[index] != value) {
      break;
    }
    i++;
    index++;
  }
  return i;
}

function GetNonRepetitionCount(start, length) {
  if (length <= 1) return length;

  let index = 0;
  let value = start[index];
  let src = start;
  let i = 0;
  while (index < start.length + length && i < 127) {
    if (IsRepetitionStart(src.slice(index), length - i)) {
      break;
    }
    i++;
    index++;
  }
  return i;
}

/**
 *
 * @param {Array} inbuf 输入待编码字符串
 * @param {Number} inSize 字符串长度
 * @param {Array} outbuf 输出编码后字符串
 * @param {Number} onuBufSize 缓冲区长度
 */
function Rle_Encode(inbuf, inSize, outbuf, onuBufSize) {
  let src = inbuf;
  let encSize = 0;
  let srcLeft = inSize;
  let index = 0;
  while (srcLeft > 0) {
    let count = 0;
    //是否连续三个字节数据相同
    if (IsRepetitionStart(src.slice(index), srcLeft)) {
      if (encSize + 2 > onuBufSize) {
        console.log("输出缓冲区空间不足");
        return -1;
      }
      count = GetRepetitionCount(src.slice(index), srcLeft);
      outbuf[encSize++] = count | 0x80;
      outbuf[encSize++] = src[index];
      index += count;
      srcLeft -= count;
    } else {
      count = GetNonRepetitionCount(src.slice(index), srcLeft);
      if (encSize + count + 1 > onuBufSize) {
        console.log("输出缓冲区空间不足");
        return -1;
      }
      outbuf[encSize++] = count;
      //逐个复制这些数据
      for (let i = 0; i < count; i++) {
        outbuf[encSize++] = src[index++];
      }
      srcLeft -= count;
    }
  }
  return encSize;
}

function Rle_Decode(inbuf, inSize, outbuf, onuBufSize) {
  let src = inbuf;
  let decSize = 0;
  let count = 0;
  let index = 0;
  while (index < src.length + inSize) {
    let sign = src[index++];
    let count = sign & 0x3f;
    if (decSize + count > onuBufSize) {
      console.log("输出缓冲区空间不足");
      return -1;
    }
    //连续重复数据标志
    if (sign & (0x80 == 0x80)) {
      for (let i = 0; i < count; i++) {
        outbuf[decSize++] = src[index];
      }
      index++;
    } else {
      for (let i = 0; i < count; i++) {
        outbuf[decSize++] = src[index++];
      }
    }
  }
  return decSize;
}

function main() {
  let srcData = [
    "A",
    "A",
    "A",
    "B",
    "B",
    "B",
    "B",
    "B",
    "C",
    "A",
    "B",
    "C",
    "D",
    "D",
    "D"
  ];
  let procBuf = [];
  let srcBuf = [];
  let proLen = Rle_Encode(srcData, 15, procBuf, 64);
  let srcLen = Rle_Decode(procBuf, proLen, srcBuf, 64);

  console.log(proLen, procBuf);
  console.log(srcLen, srcBuf);
}

main();
