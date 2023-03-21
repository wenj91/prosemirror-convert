import { Blockquote } from "@tiptap/extension-blockquote"
import { Bold } from "@tiptap/extension-bold"
import { BulletList } from "@tiptap/extension-bullet-list"
import { Code } from "@tiptap/extension-code"
import { CodeBlock } from "@tiptap/extension-code-block"
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { Color } from "@tiptap/extension-color"
import { Document } from "@tiptap/extension-document"
import { Dropcursor } from "@tiptap/extension-dropcursor"
import { Gapcursor } from "@tiptap/extension-gapcursor"
import { HardBreak } from "@tiptap/extension-hard-break"
import { Heading } from "@tiptap/extension-heading"
import { Highlight } from "@tiptap/extension-highlight"
import { History } from "@tiptap/extension-history"
import { Image } from "@tiptap/extension-image"
import { Italic } from "@tiptap/extension-italic"
import { Link } from "@tiptap/extension-link"
import { ListItem } from "@tiptap/extension-list-item"
import { Mention } from "@tiptap/extension-mention"
import { OrderedList } from "@tiptap/extension-ordered-list"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Strike } from "@tiptap/extension-strike"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
import { Text } from "@tiptap/extension-text"
import { TextAlign } from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Underline } from "@tiptap/extension-underline"
import { Extension, mergeAttributes, Node  } from '@tiptap/core'

import {
  redo,
  undo,
  ySyncPlugin,
  yUndoPlugin,
  yUndoPluginKey,
} from 'y-prosemirror';




/**
 * 将节点属性转换为 dataset
 * @param node: Node
 * @returns
 */
export const nodeAttrsToDataset = (node) => {
    const { attrs } = node;
  
    return Object.keys(attrs).reduce((accu, key) => {
      const value = attrs[key];
  
      if (value == null) {
        return accu;
      }
  
      let encodeValue = '';
  
      if (typeof value === 'object') {
        encodeValue = jsonToStr(value);
      } else {
        encodeValue = value;
      }
  
      accu[key] = encodeValue;
  
      return accu;
    }, Object.create(null));
  };
  

export const DocumentWithTitle = Document.extend({
    content: 'title{1} block+',
});

// export interface TitleOptions {
//     HTMLAttributes: Record<string, any>;
//   }

export const Title = Node.create({
    name: 'title',
    content: 'inline*',
    group: 'block',
    defining: true,
    isolating: true,
    selectable: true,
    draggable: false,
    showGapCursor: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'node-title',
            },
        };
    },

    addAttributes() {
        return {
            cover: {
                default: ''
            },
        };
    },

    renderHTML({ HTMLAttributes, node }) {
        const { cover } = node.attrs;
        return ['h1', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, nodeAttrsToDataset(node)), 0];
    },

});


export const Collaboration = Extension.create({
  name: 'collaboration',

  priority: 1000,

  addOptions() {
    return {
      document: null,
      field: 'default',
      fragment: null,
    };
  },

  onCreate() {
    if (this.editor.extensionManager.extensions.find((extension) => extension.name === 'history')) {
      console.warn(
        '[tiptap warn]: "@tiptap/extension-collaboration" comes with its own history support and is not compatible with "@tiptap/extension-history".'
      );
    }
  },

  addProseMirrorPlugins() {
    const fragment = this.options.fragment
      ? this.options.fragment
      : this.options.document.getXmlFragment(this.options.field);

    return [ySyncPlugin(fragment), yUndoPlugin()];
  },
});

export const Extensions = [
    Blockquote,
    Bold,
    BulletList,
    Code,
    CodeBlock,
    // CodeBlockLowlight,
    Color,
    Document,
    Dropcursor,
    Gapcursor,
    HardBreak,
    Heading,
    Highlight,
    History,
    Image,
    Italic,
    Link,
    ListItem,
    Mention,
    OrderedList,
    Paragraph,
    Placeholder,
    Strike,
    Subscript,
    Superscript,
    Table,
    TableCell,
    TableHeader,
    TableRow,
    TaskItem,
    TaskList,
    Text,
    TextAlign,
    TextStyle,
    Underline,
    DocumentWithTitle,
    Title
]

