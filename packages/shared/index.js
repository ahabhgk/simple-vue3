export const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  })
}

export const isObject = (value) =>
  typeof value === 'object' && value !== null

export const hasOwn = (val, key) =>
  val.hasOwnProperty(key)
  