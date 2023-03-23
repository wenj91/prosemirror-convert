'use strict'
import * as mysql from 'mysql'
import * as dotenv from 'dotenv'
dotenv.config()

import { Extensions } from './extensions.js'
import Collaboration from '@tiptap/extension-collaboration'
import StarterKit from '@tiptap/starter-kit'
import { createMarkdownEditor } from 'tiptap-markdown';

import { Editor } from '@tiptap/core'
import * as Y from 'yjs'

import { JSDOM } from "jsdom"

const MarkdownEditor = createMarkdownEditor(Editor);

const dom = new JSDOM(`<!DOCTYPE html>`);
global.document = dom.window.document;
global.window = dom.window
global.navigator = dom.window.navigator


var db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB
})


function query(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

const markdown = `# 标题

这是一个段落。Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed fermentum hendrerit ex, sit amet venenatis massa imperdiet nec. Nulla blandit est ut metus rutrum, vel dictum metus aliquet. Proin vel dui nec leo bibendum tristique a at arcu. 

## 子标题

另一个段落。Nunc gravida ultrices ex, vitae convallis sapien. Donec at bibendum neque. Nulla vitae lacinia mauris. 

### 子子标题

这是一个列表：

- 项目1
- 项目2
- 项目3

这是一个有序列表：

1. 第一项
2. 第二项
3. 第三项

这是一个代码块：

\`\`\`python
print("Hello, World!")
\`\`\`

这是一个链接：[Google](https://www.google.com/)

这是一张图片：![图片](https://via.placeholder.com/150)

> 这是一个引用。

**这是加粗的文字。**

*这是斜体的文字。*

`

function markdown2prosemirror(md, title) {
  if (title) {
    title = title.replace(/\n/g, ''); // 移除字符串中的换行符
  }
  
  const ydoc2 = new Y.Doc();
  const col2 = Collaboration.configure({ document: ydoc2 })
  const extensions2 = Extensions.concat(StarterKit.configure({
    // The Collaboration extension comes with its own history handling
    history: false,
    document: false,
  }), col2)
  const markdownEditor = new MarkdownEditor({
    extensions: extensions2,
    content: md
  })
  const mjson = markdownEditor.getJSON()

  mjson.content.splice(1, 0, {
    type: 'tableOfContents'
  });

  const ydoc = new Y.Doc();
  const col = Collaboration.configure({ document: ydoc })
  const extensions = Extensions.concat(StarterKit.configure({
    // The Collaboration extension comes with its own history handling
    history: false,
    document: false,
  }), col)
  const editor = new Editor({
    extensions: extensions,
    content: mjson
  })

  const state = Y.encodeStateAsUpdate(ydoc);
  const stateBuf = Buffer.from(state)

  return {json: mjson, buffer: stateBuf}
}


async function docProcess() {

  const pageSize = 100; // 每页显示的记录数
  let currentPage = 1; // 当前页码


  // 查询符合条件的记录总数
  const sqlCount = 'SELECT count(1) total FROM document where json is null';
  let obj = await query(sqlCount);
  console.log(obj[0].total)

  const total = obj[0].total

  const totalPages = Math.ceil(total / pageSize); // 总页数

  // 循环查询每一页的数据
  for (currentPage = 1; currentPage <= totalPages; currentPage++) {
    const offset = (currentPage - 1) * pageSize; // 记录偏移量
    const sql = `SELECT * FROM document where json is null LIMIT ${pageSize} OFFSET ${offset}`;

    let results = await query(sql)
    // 处理查询结果
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      // 处理每一行数据
      let id = row.id
      const title = row.title
      let md = row.markdown
      if (!md || md == '') {
        md = '# ' + title
      }
      let field = 'json'

      // id = 'IyZwMJJrp4GL'
      // md = markdown
      // field = 'content'

      console.log("row:", id, title)
      const {json, buffer} = markdown2prosemirror(md, title)

      // 执行一些需要在事务中进行的操作，例如插入、更新、删除数据等
      let affected = await query('update document set ' + field + '=?, state=? where id=?', [JSON.stringify({default: json}), buffer, id])

      console.log(affected)
    }
  }
}

docProcess()