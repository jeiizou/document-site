/**
 * 封装集合
 */

class Course {
    public constructor(name: string, isAdvanced: boolean) { };

    public isAdvanced() { };
}


class Person {
    private course: Set<Course>;

    public getCourse() {
        return this.course;
    }
}

// 重构
class Person_v1 {
    private course: Set<Course>;

    public getCourse() {
        return this.course;
    }

    public addCourse(arg: Course) {
        this.course.add(arg);
    }

    public removeCourse(arg: Course) {
        this.course.delete(arg);
    }
}
