//组合模式示意

class Employee {
    constructor(name, dept, sal) {
        this.name = name;
        this.dept = dept;
        this.sal = sal;
        this.EmployeeList = [];
    }
    add(employee) {
        this.EmployeeList.push(employee);
    }
    remove(employee) {
        let index = this.EmployeeList.findIndex(item => {
            item.name === employee.name
        });
        this.EmployeeList.splice(index, 1);
    }
    printAll() {
        console.log(`Employee:[name:"${this.name}",dept:"${this.dept}",sal:"${this.sal}"]`);

        this.EmployeeList.forEach(function(item){
            item.printAll();
        })
    }
}

(function main(){
    let CEO=new Employee('John',"CEO",30000);
    let headSales=new Employee("Robert",'Head Sales',20000);
    let clerk1=new Employee('Bob','clerk',10000);
    let clerk2=new Employee('Jack','clerk',10000);
    CEO.add(headSales);
    headSales.add(clerk1);
    headSales.add(clerk2);

    //打印全公司
    CEO.printAll();
})();