const templateDemo = `<ul>
	<% if (obj.show) { %>
		<% for (var i = 0; i < obj.users.length; i++) { %>
			<li>
				<a href="<%= obj.users[i].url %>">
					<%= obj.users[i].name %>
				</a>
			</li>
		<% } %>
	<% } else { %>
		<p>不展示列表</p>
	<% } %>
</ul>
`;

// 匹配模板的ID
const idReg = /[\s\W]/g;
// 匹配JS的语句或者变量
const tplReg = /<%=?\s*([^%>]+?)\s*%>/g;
const keyReg = /(for|if|else|switch|case|break|{|})/g; // **** 增加正则匹配语句
const cache = {};

const add = (str, result, js) => {
  str = str
    .replace(/[\r\n\t]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\');
  result += js ? (str.match(keyReg) ? `${str}` : `result.push(${str});`) : `result.push('${str}');`;
  return result;
};

const tmpl = (str, data) => {
  let cursor = 0;
  let result = 'let result = [];';
  let tpl = '';
  let match = '';
  // 如果是模板字符串, 会包含费单词部分(<, >, %), 如果是id, 则需要通过getElementById获取
  if (!idReg.test(str)) {
    tpl = document.getElementById(str).innerHTML;
  } else {
    tpl = str;
  }

  // 使用exec函数, 每次匹配成功会动态改变index的值
  while ((match = tplReg.exec(tpl))) {
    // 匹配HTML结构
    result = add(tpl.slice(cursor, match.index), result);
    // **** 匹配JavaScript语句、变量
    result = add(match[1], result, true);
    // 改变HTML结果匹配的开始位置
    cursor = match.index + match[0].length;
  }
  // 匹配剩余的HTML结构
  result = add(tpl.slice(cursor), result);
  result += 'return result.join("");';

  // 转换为可执行的js代码
  const fn = new Function('obj', result);
  if (!cache[str] && !idReg.test(str)) {
    // 只用传入的是id的情况下才缓存模板
    cache[str] = fn;
  }
  return fn.call(this, data);
};

console.log(
  tmpl(templateDemo, {
    show: true,
    users: [
      {
        name: 'L',
        value: '1',
      },
      {
        name: '2',
        value: '1',
      },
    ],
  }),
);
