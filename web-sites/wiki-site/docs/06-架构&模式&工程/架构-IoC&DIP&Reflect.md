# 架构-IoC&DIP&Reflect

## IoC

控制反转(Inversion of Control, IoC) 是用来降低代码耦合度的一种编程方法, 其中最常见的方式叫做依赖注入(Dependency Injection, DI), 还有一种方式叫依赖查找(Dependency Lookup). 通过控制反转, 对象在被创建的时候, 由一个调控系统内部的所有对象的**外界实体**将其**所依赖的对象**的引用 传入 给它

## DIP

依赖反转原则(Dependency inversion principle, DIP)是指一种特定的解耦形式, 使得高层次的模块不依赖低层次的模块的实现细节, 依赖关系被点到, 从而使得低层次模块依赖与高层次模块的需求抽象. 

### 案例

比如, 大楼的门禁系统有:

- 指纹锁, 密码锁, 刷脸锁以及磁卡锁

一个门禁系统则包含: `门`, `锁`, `校验系统`

对于传统的写法, 可能是如下的:

```ts
// 锁机构
class Locker {}

// 房门
class Door {}

// 指纹传感器
class FingerPrintSensor {
  readFingerPrint() {}
}
// 键盘
class PasswordKeyboard {
  readInput() {}
}
// 摄像头
class Camera {
  takePicture() {}
}
// 读卡器
class RFIDReader {
  readCard() {}
}

// 指纹门禁
export class FingerPrintGuard {
  // 指纹传感器
  fingerPrintSensor = new FingerPrintSensor();
  // 锁
  locker = new Locker();
  // 门
  docker = new Door();
}

// 密码门禁
export class PasswordGuard {
  keyboard = new PasswordKeyboard();
  locker = new Locker();
  docker = new Door();
}

// 刷脸门禁
export class FacialGurad {
  camera = new Camera();
  locker = new Locker();
  docker = new Door();
}

// 磁卡门禁
export class IDGuard {
  reader = new RFIDReader();
  locker = new Locker();
  docker = new Door();
}
```

利用DIP原则重构代码, 那么我们就必须将 低层类`FingerPrintSensor`, `PasswordKeyboard`, `Camera`, `RFIDReader`抽象为一个抽象类`Guarder`. 

```ts
export abstract class Guarder {
  getKeyInfo() {
    throw "实现验证输入";
  }
}
```

然后用这四个类扩展这个抽象类:

```ts
// 指纹传感器
class FingerPrintSensor extends Guarder {
  readFingerPrint() {}
  getKeyInfo = this.readFingerPrint;
}
// 键盘
class PasswordKeyboard extends Guarder {
  readInput() {}
  getKeyInfo = this.readInput;
}
// 摄像头
class Camera extends Guarder {
  takePicture() {}
  getKeyInfo = this.takePicture;
}
// 读卡器
class RFIDReader extends Guarder {
  readCard() {}
  getKeyInfo = this.readCard;
}
```

此时, 高层的门禁类就是:

```ts
class Guard {
  guarder = new Guarder();
  locker = new Locker();
  docker = new Door();
}
```

这里我们不难发现, 门禁和门禁的验证方式在这里已经被拆分了. 同理, 以IoC原则的依赖注入(DI)来理解, 那么少许改动Guard:

```ts
class Guard {
  locker = new Locker();
  docker = new Door();
  // 这里把门禁特性作为依赖注入
  constructor(guarder:Guarder) {
    this.guarder = guarder;
  }
}
```

IoC和DIP都是为了解耦而产生的设计原则, 区别在于:

- IoC从程序流控制方面切入, 解除依赖与被依赖的关系
- DIP从对类的设计上面切入, 处理调用与被调用对象的依赖关系, 增加了一个中间部分(抽象类)

### IoC的实现模式

#### DI模式实现IoC

除了上面这种直接通过参数进行依赖注入, 也可以使用一些比较流行的方法, 比如装饰器:

```ts
class Guard {
  @Guarder // 属性装饰器
  guarder = {};
  locker = new Locker();
  docker = new Door();
}
```

#### 服务定位模式

这种模式就是把依赖的类撞到一个词典中, 然后利用一个配置文件或者常量来在需要的时候利用*服务加载器*来实现引用, 过程.

```ts
// 服务定位器（类）
class ServiceLocator {
  static sInstance = {};
  static load(arg) {
    ServiceLocator.sInstance = arg;
  }
  services = {};
  // 注册各种服务
  loadService(key, service) {
    this.services[key] = service;
  }
  // 获取具体的服务类型
  static getService(key) {
    console.log(key, ServiceLocator.sInstance.services[key]);
    return ServiceLocator.sInstance.services[key];
  }
}

// 门禁，可以根据配置加载
class Guard {
  guarder = ServiceLocator.getService("Camera");
  locker = new Locker();
  docker = new Door();
}

// 注册服务
(function () {
  let locator = new ServiceLocator();
  // 配置多种服务
  locator.loadService("FingerPrintSensor", new FingerPrintSensor());
  locator.loadService("PasswordKeyboard", new PasswordKeyboard());
  locator.loadService("Camera", new Camera());
  locator.loadService("RFIDReader", new RFIDReader());
  ServiceLocator.load(locator);
})();
```

#### IoC Container

IoC容器, 指的是一种设计框架, 比如`NestJS`或者`inversify`. 其中一个典型的用法, 就是用`@injectable`装饰器修饰一个`Service`, 然后在控制类中声明其先前的`Service`实例需要在类构造时注入, 然后用`Nest IoC`容器注册这个服务.

1. 依赖注入

```ts
// cat.service.ts
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

// 需要注入的类
@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  findAll(): Cat[] {
    return this.cats;
  }
}
```

2. 被注入的类:

```ts
// cats.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
```

3. 容器注册

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```

## 反射

反射(reflection), 是指计算机程序在运行时可以访问, 检测和修改它本身状态或行为的一种能力. 简单的说, 就是程序在运行的时候可以观察并修改自己的行为.

这里是一个案例:

```ts
import "reflect-metadata";

const GUARDER = Symbol("Guarder");

type Constructor<T = any> = new (...args: any[]) => T;

const __KindOfGuarder: Function[] = [];
const Injectable = (): ClassDecorator => (target) => {};

const KindOfGuarder = (name): ClassDecorator => {
  return (target) => {
    __KindOfGuarder.push(target);
    Reflect.defineMetadata(GUARDER, name, target);
  };
};

class Guarder {
  getKeyInfo() {
    throw "实现验证输入";
  }
}

@KindOfGuarder("finger")
class FingerPrintSensor extends Guarder {
  readFingerPrint() {
    console.log("读取指纹");
  }
  getKeyInfo = this.readFingerPrint;
}

@KindOfGuarder("password")
class PasswordKeyboard extends Guarder {
  readInput() {
    console.log("读取密码");
  }
  getKeyInfo = this.readInput;
}

@Injectable()
class Guard {
  constructor(public readonly guarder: Guarder) {}
  verifyMethod() {
    this.guarder.getKeyInfo();
  }
}

const Factory = <T>(target: Constructor<T>, name): any => {
  const providers = Reflect.getMetadata("design:paramtypes", target);

  const index = __KindOfGuarder.findIndex(
    (guarder) => Reflect.getMetadata(GUARDER, guarder) === name
  );

  if (index >= 0) {
    let instance = new (<Constructor>__KindOfGuarder[index])();
    if (
      providers &&
      providers.length === 1 &&
      instance instanceof providers[0]
    ) {
      return new target(instance);
    }
  } else {
    throw "没有找到可以构造的类型";
  }
};

Factory(Guard, "finger").verifyMethod();
Factory(Guard, "password").verifyMethod();
```

先利用装饰器将扩展类一一注册, 然后使用工厂模式将调用方面和被调用组合起来, 执行相关的方法. 

### RelectMetadata

简单来说, 你可以通过装饰器来给类添加一些自定义的信息, 然后通过反射将这些信息提取出来. 或者通过反射来添加这些信息. 

```ts
@Reflect.metadata('name', 'A')
class A {
  @Reflect.metadata('hello', 'world')
  public hello(): string {
    return 'hello world'
  }
}

Reflect.getMetadata('name', A) // 'A'
Reflect.getMetadata('hello', new A()) // 'world'
// 这里为什么要用 new A()，用 A 不行么？后文会讲到
```

#### 概念

- `Metadata Key {any}`, 后文简称`k`,元数据的Key, 对于一个对象来说, 它可以有很多元数据, 每一个元数据对应有一个`Key`. 一个简单的例子, 你可以在一个对象上设置一个叫`name`的key来设置他的名字, 用一个`created time`的key来表示他创建的时间. 本质内部是一个`Map`对象
- `Metadata Value {any}`, 后文简称`v`. 元数据的类型, 任意类型
- `Target {Object}`, 后文简称`o`, 表示要在**这个对象**上面添加元数据
- `Poperty {String|Symbol}`. 后文简称`p`. 用于设置在那个属性上面添加元数据. 不仅仅是可以在对象上面添加元数据, 还可以在对象的属性上面添加元数据. 


#### 原型链查找

元数据的查找也是通过原型链进行的.

比如上面的例子, 实例化了一个`new A()`, 但依旧可以找到他原型链上的元数据

```ts
class A {
  @Reflect.metadata('name', 'hello')
  hello() {}
}

const t1 = new A()
const t2 = new A()
Reflect.defineMetadata('otherName', 'world', t2, 'hello')
Reflect.getMetadata('name', t1, 'hello') // 'hello'
Reflect.getMetadata('name', t2, 'hello') // 'hello'
Reflect.getMetadata('otherName', t2, 'hello') // 'world'

Reflect.getOwnMetadata('name', t2, 'hello') // undefined
Reflect.getOwnMetadata('otherName', t2, 'hello') // 'world'
```

#### 用途

所有的用途都是一个目的, 给对象添加额外的信息, 但是不影响对象的结构.

- Angular中对特殊字段进行修饰(Input), 从而提升代码的可读性
- 可以让装饰器拥有真正装饰对象而不改变对象的能力

#### API

```ts
namespace Reflect {
  // 用于装饰器
  metadata(k, v): (target, property?) => void
  
  // 在对象上面定义元数据
  defineMetadata(k, v, o, p?): void
  
  // 是否存在元数据
  hasMetadata(k, o, p?): boolean
  hasOwnMetadata(k, o, p?): boolean
  
  // 获取元数据
  getMetadata(k, o, p?): any
  getOwnMetadata(k, o, p?): any
  
  // 获取所有元数据的 Key
  getMetadataKeys(o, p?): any[]
  getOwnMetadataKeys(o, p?): any[]
  
  // 删除元数据
  deleteMetadata(k, o, p?): boolean
}
```

## VScode 中的依赖注入

vscode的项目中, 对象基本都是通过依赖注入模式构造的, 比如编辑器实例CodeApplication的constructor如下, 所有被装饰的参数都是依赖注入项.

```ts
export class CodeApplication extends Disposable {
    constructor(
        private readonly mainIpcServer: Server,
        private readonly userEnv: IProcessEnvironment,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILogService private readonly logService: ILogService,
        @IEnvironmentService private readonly environmentService: IEnvironmentService,
        @ILifecycleMainService private readonly lifecycleMainService: ILifecycleMainService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IStateService private readonly stateService: IStateService
    ) {
        // ...
    }
}
```

`CodeMain`会在引用初始化的时候实例化该类:

```ts
await instantiationService.invokeFunction(async accessor => {
    // ...

    // 进行实例化，可以看到除了要被构造的类 CodeApplication 之外
    // 剩下参数的数目和 constructor 中未被装饰的参数的数目一致
    return instantiationService.createInstance(CodeApplication, mainIpcServer, instanceEnvironment).startup();
});
```

vscode中使用依赖注入模式的三个要素:

- 一个将要被实例化的类, 构造函数中使用装饰器声明需要注入的参数
- 装饰器: 注入的参数的类型标识
- InstaniationService: 提供方法实例化类, 并且也是依赖注入项所存放的位置


### 实现

#### 装饰器

```ts
export const IInstantiationService = createDecorator<IInstantiationService>('instantiationService');
```

> ts中允许同名的类型声明和变量声明

创建装饰器的方法如下:

```ts
export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {

    // 装饰器会被缓存
    if (_util.serviceIds.has(serviceId)) {
        return _util.serviceIds.get(serviceId)!;
    }

    // 装饰器
    const id = <any>function (target: Function, key: string, index: number): any {
        if (arguments.length !== 3) {
            throw new Error('@IServiceName-decorator can only be used to decorate a parameter');
        }
        storeServiceDependency(id, target, index, false);
    };

    id.toString = () => serviceId;

    _util.serviceIds.set(serviceId, id);
    return id;
}

function storeServiceDependency(id: Function, target: Function, index: number, optional: boolean): void {
    // 在被装饰的类上记录一个依赖项
    if ((target as any)[_util.DI_TARGET] === target) {
        (target as any)[_util.DI_DEPENDENCIES].push({ id, index, optional });
    } else {
        (target as any)[_util.DI_DEPENDENCIES] = [{ id, index, optional }];
        (target as any)[_util.DI_TARGET] = target;
    }
}
```

装饰器函数`id`, 在装饰器被应用的时候, 它会调用`storeServiceDependency`方法在被装饰的类(比如`CodeApplication`)上记录依赖项, 包括装饰器本身`id`,参数的下标`index`, 以及是否可选`optional`. 

当类声明的时候, 装饰器就会被应用. 

### InstantiationService

InstantiantionService 用于提供依赖注入项，也就是起到依赖注入框架中的注入器（Injector）的功能，它以 identifier 为 key 在自身的 _services 属性中保存了各个依赖项的实例。

它有三个方法:

1. `createInstance`: 方法接受一个类以及构造该类的费依赖注入参数, 然后创建该类的示例
2. `invokeFunction`: 该方法接受一个回调函数, 该回调函数通过`acessor`参数可以访问该 `InstantiationService`中的所有依赖注入项
3. `createChild`: 该方法接受一个依赖项集合, 并创建一个新的InstantiationService, 说明vscode 的依赖注入机制也是有层次的.

_createInstance是实例化的核心方法:

```ts
private _createInstance<T>(ctor: any, args: any[] = [], _trace: Trace): T {
  // arguments defined by service decorators
  let serviceDependencies = _util.getServiceDependencies(ctor).sort((a, b) => a.index - b.index);
  let serviceArgs: any[] = [];
  for (const dependency of serviceDependencies) {
      let service = this._getOrCreateServiceInstance(dependency.id, _trace);
      if (!service && this._strict && !dependency.optional) {
          throw new Error(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`);
      }
      serviceArgs.push(service);
  }

  let firstServiceArgPos = serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;

  // check for argument mismatches, adjust static args if needed
  if (args.length !== firstServiceArgPos) {
      console.warn(`[createInstance] First service dependency of ${ctor.name} at position ${
          firstServiceArgPos + 1} conflicts with ${args.length} static arguments`);

      let delta = firstServiceArgPos - args.length;
      if (delta > 0) {
          args = args.concat(new Array(delta));
      } else {
          args = args.slice(0, firstServiceArgPos);
      }
  }

  // now create the instance
  return <T>new ctor(...[...args, ...serviceArgs]);
}
```

- 通过`getServiceDependencies`获取被构造类的依赖, 这里的依赖就是通过`storeServiceDependency` 注册的
- 通过`_getOrCreateServiceInstance`方法`indentifer`拿到`_services`中注册的依赖项, 如果拿不到的话就构建一个. 
- 拿到的依赖会被push到`serviceArgs`数组中
- 进行`constructor`参数处理. 

总之, args数组的长度应该满足被构造的类声明的非注入参数的数量, 这样才能确保依赖注入的参数和非依赖注入的参数都能被送到构造函数中正确的顺序上。

最后实例化目标类

### 依赖不存在的情况

调用`_getOrCreateServiceInstance`方法时可能会拿不到依赖注入项而需要现场构建一个. 

- 调用`_getServiceInstanceOrDescriptor`尝试拿到已经注册的实例, 或者是一个`SyncDescriptor`对象, 这是个封装了实例构造参数的一个数据对象, 包含以下属性:
  - `ctor`将要被构造的类
  - `staticArguments`被传入这个类的参数, 和上文中的`args`意义相同
  - `supportsDelayedInstantiation`是否支持延迟实例化

:::
用起来类似:

```ts
services.set(ILifecycleMainService, new SyncDescriptor(LifecycleMainService));
```
表示: 不立即实例化这个类, 而是当需要被注入的时候再进行实例化.
:::


- 拿到`SyncDescriptor`之后, 会通过`_createAndCacheServiceInstance`先实例化这个依赖项, 代码如下:

```ts
private _createAndCacheServiceInstance<T>(id: ServiceIdentifier<T>, desc: SyncDescriptor<T>, _trace: Trace): T {
  type Triple = { id: ServiceIdentifier<any>, desc: SyncDescriptor<any>, _trace: Trace };
  const graph = new Graph<Triple>(data => data.id.toString());

  let cycleCount = 0;
  const stack = [{ id, desc, _trace }];
  while (stack.length) {
      const item = stack.pop()!;
      graph.lookupOrInsertNode(item);

      // a weak but working heuristic for cycle checks
      if (cycleCount++ > 150) {
          throw new CyclicDependencyError(graph);
      }

      // check all dependencies for existence and if they need to be created first
      for (let dependency of _util.getServiceDependencies(item.desc.ctor)) {

          let instanceOrDesc = this._getServiceInstanceOrDescriptor(dependency.id);
          if (!instanceOrDesc && !dependency.optional) {
              console.warn(`[createInstance] ${id} depends on ${dependency.id} which is NOT registered.`);
          }

          if (instanceOrDesc instanceof SyncDescriptor) {
              const d = { id: dependency.id, desc: instanceOrDesc, _trace: item._trace.branch(dependency.id, true) };
              graph.insertEdge(item, d);
              stack.push(d);
          }
      }
  }

  while (true) {
      const roots = graph.roots();

      // if there is no more roots but still
      // nodes in the graph we have a cycle
      if (roots.length === 0) {
          if (!graph.isEmpty()) {
              throw new CyclicDependencyError(graph);
          }
          break;
      }

      for (const { data } of roots) {
          // create instance and overwrite the service collections
          const instance = this._createServiceInstanceWithOwner(data.id, data.desc.ctor, data.desc.staticArguments, data.desc.supportsDelayedInstantiation, data._trace);
          this._setServiceInstance(data.id, instance);
          graph.removeNode(data);
      }
  }

  return <T>this._getServiceInstanceOrDescriptor(id);
}
```

两个while分别做了如下的事情:

1. 第一个while使用DFS, 找到一个类的所有未实例化依赖, 以及依赖的未实例化的依赖, 最终得到一个依赖树
2. 第二个while根据前一步得到的依赖树, 从跟节点开始构造示例

### 全局单例依赖注入

在vscode中, 有的依赖是全局唯一的, 单例的, 即在js线程中该类最多只有一个实例.

vscode有一个简单的机制实现全局单例依赖

比如我们想要创建一个单例的生命周期依赖, 就这样:

```ts
registerSingleton(ILifecycleService, BrowserLifecycleService);
```

该方法的实现也非常简单, 就是在一个数组中保存一条记录:

```ts
const _registry: [ServiceIdentifier<any>, SyncDescriptor<any>][] = [];


export function registerSingleton<T, Services extends BrandedService[]>(id: ServiceIdentifier<T>, ctor: { new(...services: Services): T }, supportsDelayedInstantiation?: boolean): void {
    _registry.push([id, new SyncDescriptor<T>(ctor, [], supportsDelayedInstantiation)]);
}


export function getSingletonServiceDescriptors(): [ServiceIdentifier<any>, SyncDescriptor<any>][] {
    return _registry;
}
```

在需要用来这些依赖注入项的时候, 调用`getSingletonServiceDescriptor`获取这个数组就可以了

所以本质上说, 全局单例依赖注入就是把所有的依赖注入项保存在一个全局变量里

### 可选依赖

有时候, 我们想让一个依赖是可选的, 即允许依赖不存在, 对此vscode提供了optional方法用于标记可选依赖

```ts
export function optional<T>(serviceIdentifier: ServiceIdentifier<T>) {

    return function (target: Function, key: string, index: number) {
        if (arguments.length !== 3) {
            throw new Error('@optional-decorator can only be used to decorate a parameter');
        }
        storeServiceDependency(serviceIdentifier, target, index, true);
    };
}
```

与`createDecorator`方法的主要区别在于调用`storeServiceDependency`的时候第四个参数为`true`. 这样当获取不到`serviceIdentifier`所对应的依赖项是, `InstantiationService`能够允许这样的情况而不是抛出错误

### Conclusion

vscode 自己实现了一套依赖注入机制, 并没有依赖`reflect-metadata`

- 用装饰器来声明依赖关系
- 允许可选依赖
- 支持多层依赖注入
- `InstantiationService`是实现依赖注入的核心


## 参考

- [JavaScript Reflect Metadata 详解](https://www.jianshu.com/p/653bce04db0b)
- [Reflect Metadata](https://itdashu.com/docs/typescriptlesson/2edda/reflectmetada.html)
- [vscode 源码解析 - 依赖注入](https://zhuanlan.zhihu.com/p/96902077)