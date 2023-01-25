// 页面上有三个按钮，分别为 A、B、C，点击各个按钮都会发送异步请求且互不影响，每次请求回来的数据都为按钮的名字。
// 请实现当用户依次点击 A、B、C、A、C、B 的时候，最终获取的数据为 ABCACB。

function mockClick(taskName, time) {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        // console.log(taskName);
        resolve(taskName);
      }, time);
    });
}

class TaskQueue {
  retList = [];
  taskList = [];
  id = 0;
  push(taskRunnner) {
    const curList = this.id;
    this.id++;
    let p = taskRunnner();
    p.then((value) => {
      this.taskList.splice(this.taskList.indexOf(p), 1);
      this.retList[curList] = value;

      if (this.taskList.length < 1) {
        this.getEnd();
      }
    });
    this.taskList.push(p);
  }

  getEnd() {
    console.log(this.retList);
  }
}

let taskQueue = new TaskQueue();

function click(name, time) {
  taskQueue.push(mockClick(name, time));
}

click('A', 500);
click('B', 400);
click('C', 300);
click('A', 200);
click('C', 100);
click('B', 400);

// [ 'A', 'B', 'C', 'A', 'C', 'B' ]
