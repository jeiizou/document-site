# mathjax语法备忘


> markdown 代码速查

### 基础符号

| 显示 | 命令     | 显示 | 命令      |
| ---- | -------- | ---- | --------- |
| x    | \times   | ⋅    | \cdot     |
| ∗    | \ast(\*) | ÷    | \div      |
| ±    | \pm      | ∓    | \mp       |
| ≤    | \leq     | ≥    | \geq      |
| ≈    | \approx  | ≡    | \equiv    |
| ⨀    | \bigodot | ⨂    | \bigtimes |

### 希腊字母

| 显示 | 命令     | 显示 | 命令   |
| ---- | -------- | ---- | ------ |
| α    | \alpha   | β    | \beta  |
| γ    | \gamma   | δ    | \delta |
| ε    | \epsilon | ζ    | \zeta  |
| η    | \eta     | θ    | \theta |
| ι    | \iota    | κ    | \kappa |
| λ    | \lambda  | μ    | \mu    |
| ν    | \nu      | ξ    | \xi    |
| π    | \pi      | ρ    | \rho   |
| σ    | \sigma   | τ    | \tau   |
| υ    | \upsilon | φ    | \phi   |
| χ    | \chi     | ψ    | \psi   |
| ω    | \omega   |

-   对应大写: 首字母大写
-   对应斜体: 添加前缀`\var...`

### 字母修饰

| 显示           | 命令       | 显示           | 命令       |
| -------------- | ---------- | -------------- | ---------- |
| $ a^2 $        | a^2        | $ a_2 $        | a_2        |
| $ \vec a $     | \vec a     | $ \mathtt{A} $ | \mathtt{A} |
| $ \mathbb{A} $ | \mathbb{A} | $ 10^{10} $    | 10^{10}    |

### 括号

除了`(),[]`外, 特别说明:

-   `\langle,\rangle`呈现为$ \langle  \rangle $
-   使用`\left`或`\right`使符号大小与邻近的公式相适应; 该语句适用于所有括号类型
    -   `(\frac{x}{y})`呈现为$ (\frac{x}{y}) $
    -   `\left(\frac{x}{y}\right)`呈现为 $ \left(\frac{x}{y}\right) $

### 求和, 极限, 积分

-   求和: `\sum_{i=1}^n{a_i}` => $ \sum_{i=1}^n{a_i} $
-   极限: `\lim_{x\to 0}` => $ \lim_{x\to 0} $
-   积分: `\int_0^\infty{fxdx}` => $ \int_0^\infty{fxdx} $

### 分式与根式

-   分式: `\frac{公式1}{公式2}` => $ \frac{公式1}{公式2} $
-   根式: `\sqrt[x]{y}` => $ \sqrt[x]{y} $

### 特殊符号

| 显示 | 命令        | 显示 | 命令     |
| ---- | ----------- | ---- | -------- |
| ∞    | \infty      | ∪    | \cup     |
| ∩    | \cap        | ⊂    | \subset  |
| ⊆    | \subseteq   | ⊃    | \supset  |
| ∈    | \in         | ∉    | \notin   |
| ∅    | \varnothing | ∀    | \forall  |
| ∃    | \exists     | ¬    | \lnot    |
| ∇    | \nabla      | ∂    | \partial |

### 空格

-   `a\ b` => $ a\ b $
-   `a\quad b` => $ a\quad b $

### 矩阵

```
$$\begin{matrix}
1&0&0\\\
0&1&0\\\
0&0&1\\\
\end{matrix}$$
```

矩阵边框用下面的上面`matrix`即可:

- `pmatrix`: 小括号边框
- `bmatrix`: 中括号边框
- `Bmatrix`: 大括号边框
- `vmatrix`: 单竖线边框
- `Vmatrix`: 双竖线边框

省略元素:

- 横省略号: `\cdots`
- 竖省略号: `\vdots`
- 斜省略号: `\ddots`

```
\begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\\
\end{bmatrix}
```

### 阵列

- 需要array环境：起始、结束处以{array}声明
- 对齐方式：在{array}后以{}逐行统一声明
    - 左对齐：`l`；居中：`c`；右对齐：`r`
    - 竖直线：在声明对齐方式时，插入|建立竖直线
- 插入水平线：`\hline`

```
\begin{array}{c|lll}
{↓}&{a}&{b}&{c}\\\
\hline
{R_1}&{c}&{b}&{a}\\\
{R_2}&{b}&{c}&{c}\\\
\end{array}
```

### 方程组

```
\begin{cases}
a_1x+b_1y+c_1z=d_1\\\
a_2x+b_2y+c_2z=d_2\\\
a_3x+b_3y+c_3z=d_3\\\
\end{cases}
```

### 其他

- 公式标号: `\tag{12.1}` => $\tag{12.1}$
- 等号对齐: `&=&` 在使用这个符号的时候, 单独标号可以居中.

```
\begin{split}
a\*a\*a &= b \\\
c\*c &= d \\\
e &= f
\end{split}\tag{1.3}
```