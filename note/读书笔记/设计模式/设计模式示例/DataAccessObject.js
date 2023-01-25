//数据访问对象模式 示意
//创建数值对象
class Student {
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
//数据访问对象
class StudentDao {
    constructor() {
        this.students = [
            new Student("Robert", 0),
            new Student("John", 1)
        ]
    }
    deleteStudent(student) {
        for (let i = 0; i < this.students.length; i++) {
            const el = this.students[i];
            if (student.getRollNo() == el.getRollNo()) {
                this.students.splice(i, 1);
            }
        }
        console.log("Student: Roll No " + student.getRollNo() +
            ", deleted from database");
    }
    getAllStudents() {
        return this.students;
    }
    getStudent(rollNo) {
        for (let i = 0; i < this.students.length; i++) {
            const el = this.students[i];
            if (el.getRollNo() == rollNo) {
                return el;
            }
        }
    }
}

(function () {
    let studentDao = new StudentDao();
    for (let o = 0; o < studentDao.getAllStudents().length; o++) {
        const el = studentDao.getAllStudents()[o];
        console.log("Student: [RollNo : " +
            el.getRollNo() + ", Name : " + el.getName() + " ]");
    }
})()