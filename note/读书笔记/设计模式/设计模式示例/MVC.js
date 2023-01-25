//mvc模式 示意

class Student{
    constructor(name,rollNo){
        this.name=name;
        this.rollNo=rollNo;
    }
    setRollNo(rollNo){
        this.rollNo=rollNo;
    }
    getRollNo(){
        return this.rollNo;
    }
    setName(name){
        this.name=name;
    }
    getName(){
        return this.name;
    }
}

class StudentView{
    printStudentDetail(studentName,studentRollNo){
        console.log(`Student:\nName: ${studentName},\nRoll No: ${studentRollNo}`)
    }
}

class StudentController{
    constructor(model,view){
        this.model=model;
        this.view=view;
    }

    setStudentName(name){
        this.model.setName(name);
    }
    getStudentName(){
        return this.model.getName();
    }
    setStudentRollNo(RollNo){
        this.model.setRollNo(RollNo);
    }
    getStudentRollNo(){
        return this.model.getRollNo();
    }
    updateView(){
        this.view.printStudentDetail(this.model.getName(),this.model.getRollNo());
    }
}

(function(){
    let model=new Student('王小明','0001');
    let view=new StudentView();
    let controller=new StudentController(model,view);
    controller.updateView();

    controller.setStudentName('李二狗');
    controller.updateView();
})()