# Hello Rust [5] - 集合 & Panic!

# 集合
## Vector

- vector 允许 **连续的存储** **数量可变** 的值
```rust
 let v: Vec<i32> = Vec::new();
```

- Vector是用泛型实现的。

- 一般我们可能会用初始值来实现，rust会自动推断其类型
```rust
let v = vec![1, 2, 3];
```

- 丢弃vetctor，内部元素也会被丢弃
```rust
{
   let v = vec![1, 2, 3, 4];
   // 处理变量 v
} // <- 这里 v 离开作用域并被丢弃
```

- 更新vector
```rust
let mut v = Vec::new();
// 追加元素，自动推断类型，不需要注解
v.push(5);
```

- 读取vector： 索引语法或者get方法
```rust
let v = vec![1, 2, 3, 4, 5];

let third: &i32 = &v[2];

match v.get(2) {
    Some(third) => println!("The third element is {}", third),
    None => println!("There is no third element."),
}
```

- 区别在于：索引语法有越界的风险，而get在越界时会返回一个None

- 遍历vector：
```rust
fn main() {
    let v = vec![100, 32, 57];
    for i in &v {
        *i += 50;
    }
}
```

- 用枚举构造vector:
```rust
fn main() {
    enum SpreadsheetCell {
        Int(i32),
        Float(f64),
        Text(String),
    }

    let row = vec![
        SpreadsheetCell::Int(3),
        SpreadsheetCell::Text(String::from("blue")),
        SpreadsheetCell::Float(10.12),
    ];
}
```

## 字符串
字符串就是字节的集合，外加一些方法。

- Rust的**核心语言**中只有一种字符串类型：`str`，字符串slice，通常以引用的方式出现`&str`。
- `String`类型是由**标准库**提供的，是可增长的，可变的，有所有权的，UTF-8编码的字符串类型。

- 初始化一个字符串
```rust
// 新建字符串
let mut s = String::new();

let data = "initial contents";

let s = data.to_string();

// 该方法也可直接用于字符串字面值：
let s = "initial contents".to_string();

// 直接赋值
let s = String::from("initial contents");
```


- 更新，拼接字符串
```rust
// 例子1
let mut s = String::from("foo");
let s2 = "bar"
// 追加字符串
s.push_str(s2); // foobar
// 这种方式不会获取参数的所有权
println!("s2 is {}", s2);

// 例子2
let mut s = String::from("lo");
// 用于追加单独的字符
s.push('l');


// 例子3
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意 s1 被移动了，不能继续使用

// 例子4
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
// 使用索引并且不会获取任何参数的所有权
let s = format!("{}-{}-{}", s1, s2, s3);
```

- 不支持索引字符串：Rust是不支持索引访问字符串的，因为在Unicode编码下，一个字符串的索引并不总是对应着一个有效的字母（某些符号占两个字节）。
- 一般来说，我们可以使用`slice`来获取字符串的一部分。
```rust
let hello = "Здравствуйте";

let s = &hello[0..4]; // 注意，这里的字符都是两个字节长度的，所以 s = "Зд"
```

- 遍历字符串
```rust
// 遍历字符位，这里会循环6次
for c in "नमस्ते".chars() {
    println!("{}", c); 
}
// न म स  ् त  े

// 返回原始字节
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
// 224 164 --snip-- 165 135

```

## Hash Map
通过一个hash函数来映射一个`<k, v>`对象

- 新建hashmap：
```rust
use std::collections::HashMap;

// 方式1：新建Hashmap对象
let mut scores = HashMap::new();
    
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

// 方式2： 从 vec 迭代器上新建
let teams = vec![String::from("Blue"), String::from("Yellow")];
let initial_scores = vec![10, 50];

let mut scores: HashMap<_, _> =
    teams.into_iter().zip(initial_scores.into_iter()).collect();
```

- 所有权：
   - 对于实现了`Copy trait`的类型，会被拷贝进入hashmap
   - 对于String这种有所有权的值，会被移动。

- 访问 & 遍历：
```rust
// 访问hashmap中的值
let team_name = String::from("Blue");
let score = scores.get(&team_name);

// 遍历
for (key, value) in &scores {
    println!("{}: {}", key, value);
}
```

- 更新：
```rust
scores.insert(String::from("Blue"), 10);
// 覆盖更新
scores.insert(String::from("Blue"), 25);

// 只在键没有对应值时插入
scores.entry(String::from("Blue")).or_insert(50);

// 根据旧值更新
let count = map.entry(String::from("Blue")).or_insert(0);
// 解引用
*count += 1;
```
# 错误处理
## panic!: 不可恢复错误
`panic!`宏有两种行为：

- 展开（unwinding）：Rust会回溯栈并且清理它遇到的每一个函数的数据。
- 终止（abort）：直接退出程序。

可以在我们的`Cargo.toml`中进行配置相应的关键字切换模式：
```toml
[profile.release]
panic = 'abort'
```

在程序中触发：
```rust
fn main() {
    // 手动调用panic
    panic!("crash and burn");
    
    // 程序异常抛出panic
    let v = vec![1, 2, 3];
    v[99];
}
```

## Result：可恢复的错误
```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

可以使用match表达式处理可能会返回的`Result`成员：
```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => panic!("Problem opening the file: {:?}", error),
        
        // 可以进一步正对不同的错误类型进行处理：
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            other_error => {
                panic!("Problem opening the file: {:?}", other_error)
            }
        },
    };
}
```

`Result<T, E>`定义了很多辅助方法来处理各种情况。其中之一叫做`unwrap`，其实现类似于`match`语法：
```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").unwrap();
}
```

另一个类似的`expect`允许我们选择错误信息：
```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").expect("Failed to open hello.txt");
}
```

这两个使用起的方式是一样的： 返回文件句柄或调用 panic! 宏。

传播错误：
```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}

// 另一种简写方式：
fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

- `?`还能直接支持链式方法调用来进一步缩短代码：
```rust
fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();

    File::open("hello.txt")?.read_to_string(&mut s)?;

    Ok(s)
}
```

- 实际上，`？`被定义为从函数中提早返回一个值。类似于`match`的工作方式。
- 需要注意：`？`只能在返回`Result`或者实现了`FromResidual`的类型的函数中使用`？`运算符。
