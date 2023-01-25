//过滤器模式示意

class Person {
    constructor(name, gender, maritalStatus) {
        this.name = name; //姓名
        this.gender = gender; //性别
        this.maritalStatus = maritalStatus; //婚姻状况
    }
    getName() {
        return this.name;
    }
    getGender() {
        return this.gender;
    }
    getMaritalStatus() {
        return this.maritalStatus;
    }
}

function PersonFilter_Name(PersonArray,condition){
    return PersonArray.filter(item=>{
        return (item.getName()==condition);
    });
}

(function main(){
    let PersonArray=[];
    PersonArray.push(new Person('John','man','single'));
    PersonArray.push(new Person('Oakley','man','married'));
    PersonArray.push(new Person('Katharine','woman','single'));
    PersonArray.push(new Person('Callie','woman','married'));

    let filterres=PersonFilter_Name(PersonArray,'John');
    console.log(filterres);
})();

