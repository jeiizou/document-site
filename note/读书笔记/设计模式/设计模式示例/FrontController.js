//前端控制器模式 示意
//创建视图
class HomeView {
  show() {
    console.log("Displaying Home Page");
  }
}
class StudentView {
  show() {
    console.log("Displaying Student Page");
  }
}
//调度器
class Dispatcher {
  constructor() {
    this.studentView = new StudentView();
    this.homeView = new HomeView();
  }

  dispatch(request) {
    if (request.indexOf("STUDENT")) {
      this.studentView.show();
    } else {
      this.homeView.show();
    }
  }
}
//前端控制器
class FrontController {
  constructor() {
    this.dispatch = new Dispatcher();
  }
  isAuthenticUser() {
    console.log("User is authenticated successfully.");
    return true;
  }
  trackRequest(request) {
    console.log("Page requested: " + request);
  }
  dispatchRequest(request) {
    //记录每一个请求
    this.trackRequest(request);
    //对用户进行身份验证
    if (this.isAuthenticUser()) {
      this.dispatch.dispatch(request);
    }
  }
}

(function(){
    let frontController=new FrontController();
    frontController.dispatchRequest("HOME");
    frontController.dispatchRequest("STUDENT");
})()
