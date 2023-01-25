// 异步请求通过 Promise.all 处理，怎么让其中失败的所有请求重试。

// Promise.all([A, B, C, D])
// 4 个请求完成后发现 AD 请求失败了，如果让 AD 请求重试
let tasks = [];
let failedTask = [];
const task = (taskName) => {
  const p = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        console.log(`${taskName} success`);
        resolve();
      } else {
        reject();
      }
    }, 1000 * Math.random());
  }).catch((error) => {
    failedTask.push(taskName);
    console.log(`${taskName} failed`);
  });

  return p;
};

const addTask = (name) => {
  tasks.push(task(name));
};

addTask('t1');
addTask('t2');
addTask('t3');
addTask('t4');
addTask('t5');

const TaskAllRun = (arr) => {
  Promise.all(arr).then((res) => {
    if (failedTask.length > 0) {
      console.log('FailedTask: ', failedTask);
      const tasks = [];
      for (let i = 0; i < failedTask.length; i++) {
        const taskName = failedTask[i];
        tasks.push(task(taskName));
      }
      failedTask = [];
      TaskAllRun(tasks);
    }
  });
  Promise.all(arr);
};

TaskAllRun(tasks);
