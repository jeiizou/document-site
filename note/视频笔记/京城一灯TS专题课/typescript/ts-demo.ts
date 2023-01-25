class User {
  constructor(uname: string, age: number) {}
}

type TCtor = ConstructorParameters<typeof User>;

function init(...info: TCtor) {
  const [uname] = info;
}

init('检索到', 20);

// 第一个属性集成第二个属性
type A = Exclude<'x' | 'a', 'x' | 'y' | 'z'>;
// type A = "a"

interface FirstType {
  id: number;
  firstName: string;
  lastName: string;
}

interface SecondType {
  id: number;
  address: string;
  city: string;
}

// 选择在父级中存在的属性
type ExtractType1 = Extract<keyof FirstType, keyof SecondType>;
// type ExtractType1 = "id"

// 选择在父级中不存在的属性
type ExtractType2 = Exclude<keyof FirstType, keyof SecondType>;
// type ExtractType2 = "firstName" | "lastName"

declare function create<T extends new () => any>(c: T): InstanceType<T>;

class demoA {}
class demoB {}

let a1 = create(demoA);

type TNon = NonNullable<string | number | undefined>;
// type TNon = string | number
