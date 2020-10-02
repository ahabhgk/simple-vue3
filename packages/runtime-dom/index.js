import { createRenderer, h } from '../runtime-core'

const nodeOps = {
  querySelector: (sel) => document.querySelector(sel),

  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor)
  },

  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  createElement: (tag, isSVG) => isSVG
    ? doc.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag),

  createText: text => document.createTextNode(text),

  nextSibling: node => node.nextSibling,

  setProperty: (node, propName, newValue, oldValue, isSVG) => {
    if (propName[0] === 'o' && propName[1] === 'n') {
      const eventType = propName.toLowerCase().slice(2);
  
      if (!node.listeners) node.listeners = {};
      node.listeners[eventType] = newValue;
  
      if (newValue) {
        if (!oldValue) {
          node.addEventListener(eventType, eventProxy);
        }
      } else {
        node.removeEventListener(eventType, eventProxy);
      }
    } else if (newValue !== oldValue) {
      if (propName in node && !isSVG) {
        node[propName] = newValue == null ? '' : newValue
      } else if (newValue == null || newValue === false) {
        node.removeAttribute(propName)
      } else {
        node.setAttribute(propName, newValue)
      }
    }
  },
}

function eventProxy(e) {
  // this: node
  this.listeners[e.type](e)
}

export const createApp = (rootComponent) => ({
  mount: (rootSel) =>
    createRenderer(nodeOps).render(h(rootComponent), nodeOps.querySelector(rootSel))
})
