/*
 * 对一个很长的名字数组，做分片更新名字请求：
 * 1. 分片里的更新是并行的，执行 changeName
 * 2. 各个分片间是串行的，执行 sleep
 * 这个函数接受三个参数，名字列表、分片数量，每次分片后的等待时间
 * 比如：
 * slicePostTask(['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh'], 2, 2000)
 * // => ['aa', 'bb']
 * waiting 2s
 * // => ['cc', 'dd']
 * waiting 2s
 * // => ['ee', 'ff']
 * waiting 2s
 * // => ['gg', 'hh']
 */
function changeName(name) {
  console.log('update', name);
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('waiting', time);
      resolve();
    }, time);
  });
}

async function slicePostTask(names = [], nameLength = 1, delayTime = 1000) {
  if (names.length < 1) {
    return;
  }
  let curNames = names.slice(0, nameLength);
  curNames.forEach((name) => {
    changeName(name);
  });
  await sleep(delayTime);
  await slicePostTask(names.slice(nameLength), nameLength, delayTime);
}

slicePostTask(['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh'], 2, 2000);
