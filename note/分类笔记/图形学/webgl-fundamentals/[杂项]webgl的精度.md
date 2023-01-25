# [杂项]WebGL的精度

在之前, 我们创建片元着色器的时候, 因此我们需要添加来设置:

```glsl
precision mediump float;
```

这里的设置是什么呢.

`lowp`, `mediump`和`heighp`是精度设置. 在这种情况下, 精度实际上意味着有多少位用于存储一个值. js中的数字使用64位, 而webgl中的大部分数字只有32位. 更少的位 = 更快, 更多的位 = 更准确, 更大的范围.

- `lowp`: 至少是9位, 对于浮点数, 范围-2到+2之间, 对于整数, 0~255
- `mediump`: 至少是16为, 对于浮点数, 范围是`-2^14 ~ -2^14`, 对于整数, 范围是0~65535
- `highp`: 32位帧数, 32bit可以容纳`-2^62 ~ +2^62`, 对于整数值, 总`0~4294967295`

需要注意的是, 并非范围内的每个值都可以表示. 最容易理解的大概是`lowp`, 只有9位, 因此只能表示512个唯一的值. 

使用`highp`有两个问题:

1. 某些设备, 比如比较旧的智能手机, 不支持`highp`的片元着色器.
2. 在实际使用上, 使用`lowp`和`medium`一般比`highp`会更快.

# 如何选择

```glsl
// 一些片段着色器
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
＃别的
  precision mediump float;
＃万一
 
...
```

默认是`hightp`, 如果设备不支持, 则使用`medium`.

另外一种选择是, 你可以尝试将片元编写为只需`mediump`的. 

```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
 
// Passed in from the vertex shader.
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
 
uniform vec4 u_color;
uniform float u_shininess;
 
void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);
 
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  float light = dot(normal, surfaceToLightDirection);
 
  gl_FragColor = u_color;
 
  // Lets multiply just the color portion (not the alpha)
  // by the light
  gl_FragColor.rgb *= light;
 
#ifdef GL_FRAGMENT_PRECISION_HIGH
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
 
  float specular = 0.0;
  if (light > 0.0) {
    specular = pow(dot(normal, halfVector), u_shininess);
  }
 
  // Just add in the specular
  gl_FragColor.rgb += specular;
#endif
}
```



