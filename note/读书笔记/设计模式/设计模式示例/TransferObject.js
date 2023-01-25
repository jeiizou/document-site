//传输对象模式 示意
//创建传输对象
class StudentVO {
    constructor(name, rollNo) {
        this.name = name;
        this.rollNo = rollNo;
    }
    setRollNo(rollNo) {
        this.rollNo = rollNo;
    }
    getRollNo() {
        return this.rollNo;
    }
    setName(name) {
        this.name = name;
    }
    getName() {
        return this.name;
    }
}
//创建业务对象
class StudentBO {
    constructor() {
        this.students = [];
        let student1 = new StudentVO("Robert", 0);
        let student2 = new StudentVO("John", 1);
        this.students.push(student1);
        this.students.push(student2);
    }
    deleteStudent(student) {
        for (let i = 0; i < this.students.length; i++) {
            const el = this.students[i];
            if (el.getName() == student.getName()) {
                this.students.splice(i, 1);
            }
        }
        console.log("Student: Roll No " +
            student.getRollNo() + ", deleted from database");
    }
    getAllStudents(){
        return this.students;
    }
    getStudent(rollNo){
        return this.students[rollNo];
    }
    updateStudent(student){
        this.students[student.getRollNo()].setName(student.getName());
        console.log("Student: Roll No " 
        + student.getRollNo() +", updated in the database");
    }
}

(function(){
    let studentBuinessObj=new StudentBO();

    for (let i = 0; i < studentBuinessObj.getAllStudents().length; i++) {
        const student = studentBuinessObj.getAllStudents()[i];
        console.log("Student: [RollNo : "
        +student.getRollNo()+", Name : "+student.getName()+" ]");
    }

    let student=studentBuinessObj.getAllStudents()[0];
    student.setName("Michael");
    studentBuinessObj.updateStudent(student);

})()