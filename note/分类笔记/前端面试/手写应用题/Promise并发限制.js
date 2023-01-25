export class AsyncPool {
  pendingQueue = [];
  curExecQueue = [];
  finalValue = [];
  endHanlder = () => {};
  idx = 0;
  maxLength = 0;
  constructor(maxLength) {
    this.maxLength = maxLength;
  }

  add(taskRunner, preResolve) {
    if (!taskRunner) {
      return Promise.reject();
    }

    this.idx++;

    return new Promise((resolve, reject) => {
      if (this.curExecQueue.length < this.maxLength) {
        // instantiation promise
        let p = taskRunner().then((value) => {
          if (!preResolve) {
            resolve(value);
          } else {
            preResolve(value);
          }

          this.finalValue[this.idx] = value;

          this.curExecQueue.splice(this.curExecQueue.indexOf(p), 1);
          if (this.pendingQueue.length > 0) {
            let nextTask = this.pendingQueue.splice(0, 1)[0];
            this.add(nextTask.fn, nextTask.resolve);
          } else {
            this.endHanlder(this.finalValue);
          }
        });
        this.curExecQueue.push(p);
      } else {
        this.pendingQueue.push({
          fn: taskRunner,
          resolve: resolve,
        });
      }
    });
  }
}
