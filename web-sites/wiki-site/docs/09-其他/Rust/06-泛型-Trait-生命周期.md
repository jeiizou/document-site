# Hello Rust [6] - 泛型 & Trait & 生命周期

# 泛型
```rust
// 定义一个泛型函数，这里会报一个编译错误
fn largest<T>(list: &[T]) -> T {
    let mut largest = list[0];

    for &item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);
    println!("The largest char is {}", result);
}
```

## 结构体 & 枚举 & 方法
```rust
// 结构体中的泛型
struct Point<T> {
    x: T,
    y: T,
}

// 枚举中的泛型
enum Option<T> {
    Some(T),
    None,
}

// 方法中的泛型
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}

// 多个泛型
struct Point<T, U> {
    x: T,
    y: U,
}
```
## 泛型的性能

- Rust会在编译时进行泛型代码的单态化（monomorphization）：通过填充编译时具体使用的类型，将通用代码转换为特定代码的过程。

# Trait: 定义共同行为
> trait是高速Rust编译器某个特定类型拥有可能与其他类型共享的功能，trait类似于其他语言中的 接口（interface），但是又有一些区别

## 定义 trait
一个类型的行为由器可供调用的方法构成。如果要对不同类型调用相同的方法，这些类型就可以共享相同的行为了。`trait`方法就是一种将方法签名组合的方法，用于定义一个实现某些目的所必须得行为的集合。

```rust
// 声明一个 trait
// 在impl后面我们提供了实现trait的名称。
pub trait Summary {
    // trait 中可以有多个方法，一行一个方法签名且都以分号结尾
    fn summarize(&self) -> String;
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

// 在impl块中，是用trait定义中的方法签名，不过后面不需要跟分号
impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}


// 使用
use aggregator::{Summary, Tweet};

fn main() {
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        retweet: false,
    };
    // 像调用常规方法一样调用
    println!("1 new tweet: {}", tweet.summarize());
}
```

- 唯一的区别在于， Summary需要和类型一起引入作用域来使用额外的方法。
- 实现trait时，只有当至少一个trait或者实现trait的类型位于crate的本地作用域时，才能为该类型实现trait。
   -  可以为`aggregator`crate的自定义类型`Twwet`实现标准库中的`Display`trait， 因为`Tweet`类型位于`aggreator`crate本地的作用域中。 
- 不能为外部类型实现外部`trait`。
   - 不能在`aggregator`crate 中为`Vec<T>`实现`Display`trait。因为`Display`和`Vec<T>`定义与标准库中。他们并不位于`aggregator`crate的本地作用域中。

这就是： **相干性（coherence）**的程序属性的一部分，或者更具体的说是：**孤儿规则（orphan rule）**, 其得名不存在父类型。这条规则确保其他人编写的代码不会破坏你代码。

## 默认实现
可以为某种`trait`中的某些或全部方法提供默认的行为，而不是在每个类型的每个实现中定义自己的行为。
```rust
pub trait Summary {
    fn summarize(&self) -> String {
        // 提供一个方法的默认实现
        String::from("(Read more...)")
    }
    
    // 这个方法不实现
    fn summarize_author(&self) -> String;
}


impl Summary for Tweet {
    // 实现部分方法
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}
```

- 默认实现允许调用相同的`trait`中的其他方法，哪怕这些方法没有默认实现。所以`trait`可以提供很多有用的功能但是只需要实现指定的一小部分内容。
> 注意无法从相同的重载实现中默认方法。


## Trait 应用

- **Trait 作为参数**
```rust
// 对于 item 参数，指定了 impl 关键字和 trait 名称，而不是具体的类型
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

- item参数支持任何实现了指定`trait`的类型。

- **Trait Bound**
```rust
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}
```

- `impl trait`很方便，适用于短小的例子。`trait bound`则适用于更加复杂的场景。 
```rust
// impl trait
pub fn notify(item1: &impl Summary, item2: &impl Summary) {}

// trait bound
pub fn notify<T: Summary>(item1: &T, item2: &T) {}

// 指定多个 impl
pub fn notify(item: &(impl Summary + Display)) {}

// bound 多个 trait
pub fn notify<T: Summary + Display>(item: &T) {}
```

- 通过`where`简化`trait bound`：
```rust
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 {}

// where
fn some_function<T, U>(t: &T, u: &U) -> i32
    where T: Display + Clone,
          U: Clone + Debug
{}
```

- 返回`trait`的类型：
```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        retweet: false,
    }
}
```

- 使用trait bound有条件的实现方法：
```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

# 生命周期 确保引用有效
Rust 中每一个引用都有其 生命周期（lifetime），也就是引用保持有效的作用域。<br />大部分时候，生命周期是隐含并且可以推断的。

- 生命周期的主要目标就是避免**悬垂引用**，后者会导致程序引用了非预期引用的数据。
```rust
fn main() {
    {
        let r;

        {
            let x = 5;
            r = &x;
        }

        println!("r: {}", r);
    }
}

```

- 借用检查器（borrow checker）
```rust
fn main() {
    {
        let r;                // ---------+-- 'a
                              //          |
        {                     //          |
            let x = 5;        // -+-- 'b  |
            r = &x;           //  |       |
        }                     // -+       |
                              //          |
        println!("r: {}", r); //          |
    }                         // ---------+
}
Ï
```

## 泛型生命周期
```rust
// 不知道返回的引用是x的引用还是y的引用，所以这里会报错，告诉我们需要一个泛型生命周期参数
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

- 生命周期注解语法：
```rust
&i32        // 引用
&'a i32     // 带有显式生命周期的引用
&'a mut i32 // 带有显式生命周期的可变引用
```

- 函数签名中的生命周期注解：
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```
 这里生命周期注解的含义是：

1.  函数会获取两个参数，他们都是与生命周期`'a`存在一样长的字符串slice
2. 函数返回的引用的生命周期与传入该函数的引用的生命周期的较小者一致

通过函数签名中的生命周期参数，我们没有改变任何生命周期，只是之处任何不满足这个约束条件的值都会被借用检查器拒绝。


