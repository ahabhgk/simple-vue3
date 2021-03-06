export const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  })
}

export const isFunction = (value) => typeof value === 'function'

export const isObject = (value) =>
  typeof value === 'object' && value !== null

export const isString = (value) => typeof value === 'string'

export const isNumber = (value) => typeof value === 'number'

export const isText = (value) => isString(value) || isNumber(value)

export const isArray = Array.isArray

export const isPromise = (v) => isObject(v) && isFunction(v.then) && isFunction(v.catch)

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key)

// compare whether a value has changed, accounting for NaN.
export const hasChanged = (value, oldValue) =>
  value !== oldValue && (value === value || oldValue === oldValue)
