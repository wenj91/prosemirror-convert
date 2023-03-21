'use strict'
import * as mysql from 'mysql'
import * as pmmd from 'prosemirror-markdown'
import * as dotenv from 'dotenv'
dotenv.config()

import * as marked from 'marked'


import * as basicSchema from 'prosemirror-schema-basic'
import { findWrapping } from 'prosemirror-transform'
import { schema as complexSchema } from './complexSchema.js'
import { Extensions } from './extensions.js'
import Collaboration from '@tiptap/extension-collaboration'
import StarterKit from '@tiptap/starter-kit'

// Option 1: Browser + server-side
import { generateJSON } from '@tiptap/html'
import { Editor } from '@tiptap/core'
import { generateHTML } from '@tiptap/html'

const schema = /** @type {any} */ (basicSchema.schema)

import { TiptapTransformer } from '@hocuspocus/transformer';

import { prosemirrorToYDoc, prosemirrorJSONToYDoc, yDocToProsemirrorJSON } from 'y-prosemirror'
import * as Y from 'yjs'

import { parse } from 'node-html-parser'

import { JSDOM } from "jsdom"

const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.document = dom.window.document;
global.window = dom.window
global.navigator = dom.window.navigator


var db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB
})


function htmlToJSON(node) {
  if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
    const obj = {
      type: node.tagName.toLowerCase(),
      attrs: {},
      content: [],
    }
    for (const attr of node.attributes) {
      obj.attrs[attr.name] = attr.value
    }
    for (const childNode of node.childNodes) {
      obj.content.push(htmlToJSON(childNode))
    }
    return obj
  } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
    return {
      type: 'text',
      text: node.textContent,
    }
  } else {
    return null
  }
}

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

let empty = {
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": ""
    }
  ]
}

const emptyDoc = (title) => {
  return {
    type: 'doc',
    content: [
      {
        "type": "title",
        "content": [
          {
            "type": "text",
            "text": title
          }
        ]
      },
      empty,
    ]
  }
}

export const extractImage = (html) => {
  let matches = [];

  // eslint-disable-next-line no-useless-escape
  while ((matches = html.match(/\<p.*?\>\<img(.|\s)*?\>\<\/p\>/g))) {
    const target = matches[0].match(/<img.*?>/)[0];
    html = html.replace(matches[0], target);
  }

  return html;
};

const json = { "type": "doc", "content": [{ "type": "title", "attrs": { "cover": "" }, "content": [{ "type": "text", "text": "伤寒卒病论集" }] }, { "type": "paragraph", "attrs": { "indent": 0, "textAlign": "left" }, "content": [{ "type": "text", "text": "论曰：余每览越人入虢之诊，望齐侯之色，未尝不慨然叹其才秀也。怪当今居世之士，曾不留神医药，精究方术，上以疗君亲之疾，下以救贫贱之厄，中以保身长全，以养其生，但竞逐荣势，企踵权豪，孜孜汲汲，惟名利是务，崇饰其末，忽弃其本，华其外，而悴其内，皮之不存，毛将安附焉。卒然遭邪风之气，婴非常之疾，患及祸至，而方震栗，降志屈节，钦望巫祝，告穷归天，束手受败，赍百年之寿命，持至贵之重器，委付凡医，恣其所措，咄嗟呜呼！厥身已毙，神明消灭，变为异物，幽潜重泉，徒为啼泣，痛夫！举世昏迷，莫能觉悟，不惜其命，若是轻生，彼何荣势之云哉！而进不能爱人知人，退不能爱身知己，遇灾值祸，身居厄地，蒙蒙昧昧，蠢若游魂。哀乎！趋世之士，驰竞浮华，不固根本，忘躯徇物，危若冰谷，至于是也。余宗族素多，向余二百，建安纪年以来，犹未十年，其死亡者，三分有二，伤寒十居其七。感往昔之沦丧，伤横夭之莫救，乃勤求古训，博采众方，撰用《素问》、《九卷》、《八十一难》、《阴阳大論》、《胎臚药录》，并平脉辨证，为《伤寒杂病论》合十六卷，虽未能尽愈诸病，庶可以见病知源，若能寻余所集，思过半矣。夫天布五行，以运万类，人禀五常，以有五藏，经络府俞，阴阳会通，玄冥幽微，变化难极，自非才高识妙，岂能探其理致哉！上古有神农、黄帝、歧伯、伯高、雷公、少俞、少师、仲文，中世有长桑、扁鹊，汉有公乘阳庆及仓公，下此以往，未之闻也。观今之医，不念思求经旨，以演其所知，各承家技，终始顺旧，省疾问病，务在口给。相对斯须，便处汤药，按寸不及尺，握手不及足，人迎趺阳，三部不参，动数发息，不满五十，短期未知决诊，九候曾无仿佛，明堂闕庭，尽不见察，所谓窥管而已。夫欲视死别生，实为难矣。孔子云：生而知之者上，学则亚之，多闻博识，知之次也。余宿尚方术，请事斯语。", "marks": [{ "type": "textStyle", "attrs": { "backgroundColor": null, "color": null, "fontFamily": null, "fontSize": "19px" } }] }] }, { "type": "paragraph", "attrs": { "indent": 0, "textAlign": "left" } }] };


async function docProcess() {

  const pageSize = 100; // 每页显示的记录数
  let currentPage = 1; // 当前页码


  // 查询符合条件的记录总数
  const sqlCount = 'SELECT count(1) total FROM document';
  let obj = await query(sqlCount);
  console.log(obj[0].total)

  const total = obj[0].total

  const totalPages = Math.ceil(total / pageSize); // 总页数

  // 循环查询每一页的数据
  for (currentPage = 1; currentPage <= totalPages; currentPage++) {
    const offset = (currentPage - 1) * pageSize; // 记录偏移量
    const sql = `SELECT * FROM document LIMIT ${pageSize} OFFSET ${offset}`;

    let results = await query(sql)
    // 处理查询结果
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      // 处理每一行数据

      let title = row.title.replace(/\n/g, ''); // 移除字符串中的换行符

      let jo = emptyDoc(title);

      let oo = {}
      if (row.content != null && row.content != '') {
        let p = pmmd.defaultMarkdownParser.parse(row.content)
        jo = p.toJSON()

        oo = p.toJSON()

        jo.content.unshift({
          "type": "title",
          "content": [
            {
              "type": "text",
              "text": title
            }
          ]
        })

      }

      let obj = {
        default: jo
      }

     

      let jsons = JSON.stringify(obj)
      console.log("row:", row.id, title, jsons)
      // prosemirrorJSONToYDoc( stateJSON)
      const ydoc = new Y.Doc();
      const col = Collaboration.configure({ document: ydoc })
    
      const extensions = Extensions.concat(StarterKit.configure({
        // The Collaboration extension comes with its own history handling
        history: false,
      }), col)
      const html = generateHTML(json, extensions)
    
      // const parser = new DOMParser();
      // const { body } = parser.parseFromString(html, 'text/html');
    
      const editor = new Editor({
        extensions: extensions,
        content: html
      })
      const state = Y.encodeStateAsUpdate(ydoc);
      const stateBuf = Buffer.from(state)

      // const node = yDocToProsemirrorJSON(ydoc)

      console.log(html)

      // 执行一些需要在事务中进行的操作，例如插入、更新、删除数据等
      let affected = await query('update document set content=?, state=? where id=?', [JSON.stringify({defalut: json}), stateBuf, 'IyZwMJJrp4GL'])



      console.log(affected, stateBuf)
    }
  }
}

docProcess()

// 


// async function test() {
//   const ydoc = new Y.Doc();
//   const col = Collaboration.configure({ document: ydoc })

//   const extensions = Extensions.concat(StarterKit.configure({
//     // The Collaboration extension comes with its own history handling
//     history: false,
//   }), col)
//   const html = generateHTML(json, extensions)

//   // const parser = new DOMParser();
//   // const { body } = parser.parseFromString(html, 'text/html');

//   const editor = new Editor({
//     extensions: extensions,
//     content: html
//   })

//   const ydoc2 = prosemirrorJSONToYDoc(editor.schema, json)

//   const node = yDocToProsemirrorJSON(ydoc)
//   const node22 = TiptapTransformer.fromYdoc(ydoc);

//   const node2 = yDocToProsemirrorJSON(ydoc2)

//   const state = Y.encodeStateAsUpdate(ydoc2)
//   const state2 = Y.encodeStateAsUpdate(ydoc)
//   const stateBuf = Buffer.from(state)


//   console.log(node2, stateBuf)
// }

// test()