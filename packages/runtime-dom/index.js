import { createRenderer } from '../runtime-core/renderer'

const nodeOps = {
  querySelector: (sel) => document.querySelector(sel),
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

export const createApp = (rootComponent) => (rootSel) => createRenderer(nodeOps)
  .render(h(rootComponent), nodeOps.querySelector(rootSel))
