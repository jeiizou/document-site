let mw1 = async function (ctx, next) {
  console.log('mw1 before next');
  await next();
  console.log('mw1 agter next');
};
let mw2 = async function (ctx, next) {
  console.log('mw2 before next');
  await next();
  console.log('mw2 agter next');
};

let mw3 = async function (ctx, next) {
  console.log('mw3 no next');
};

const middleware = [];
function use(mw) {
  middleware.push(mw);
}

use(mw1);
use(mw2);
use(mw3);

let fn = function (ctx) {
  function dispatch(i) {
    let currentMW = middleware[i];
    if (!currentMW) {
      return;
    }
    return currentMW(ctx, dispatch.bind(null, i + 1));
  }
  return dispatch(0);
};

fn();
