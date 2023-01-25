// 实现一个fetch请求, 带timeout的逻辑

function mockFetch(path, fetchConfig) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: 'success',
        status: 200,
      });
    }, 1000);
  });
}

function myFetch(path, fetchConfig, timeout) {
  const onTimeout = () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject({
          data: null,
          status: '500',
          message: 'request timeout',
        });
      }, timeout);
    });

  return Promise.race([mockFetch(path, fetchConfig), onTimeout()]);
}

myFetch('abc.com', {}, 1200)
  .then((value) => {
    console.log(value);
  })
  .catch((err) => {
    console.log(err);
  });
