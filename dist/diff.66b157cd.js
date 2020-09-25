// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../packages/shared/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasChanged = exports.hasOwn = exports.isText = exports.isArray = exports.isString = exports.isObject = exports.isFunction = exports.def = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var def = function def(obj, key, value) {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value: value
  });
};

exports.def = def;

var isFunction = function isFunction(value) {
  return typeof value === 'function';
};

exports.isFunction = isFunction;

var isObject = function isObject(value) {
  return _typeof(value) === 'object' && value !== null;
};

exports.isObject = isObject;

var isString = function isString(value) {
  return typeof value === 'string';
};

exports.isString = isString;
var isArray = Array.isArray;
exports.isArray = isArray;

var isText = function isText(v) {
  return typeof v === 'string' || typeof v === 'number';
};

exports.isText = isText;

var hasOwn = function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key);
}; // compare whether a value has changed, accounting for NaN.


exports.hasOwn = hasOwn;

var hasChanged = function hasChanged(value, oldValue) {
  return value !== oldValue && (value === value || oldValue === oldValue);
};

exports.hasChanged = hasChanged;
},{}],"../packages/reactivity/src/operations.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TriggerOpTypes = exports.TrackOpTypes = void 0;
var TrackOpTypes = {
  GET: 'get',
  HAS: 'has',
  ITERATE: 'iterate'
};
exports.TrackOpTypes = TrackOpTypes;
var TriggerOpTypes = {
  SET: 'set',
  ADD: 'add',
  DELETE: 'delete',
  CLEAR: 'clear'
};
exports.TriggerOpTypes = TriggerOpTypes;
},{}],"../packages/reactivity/src/effect.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isEffect = isEffect;
exports.effect = effect;
exports.stop = stop;
exports.track = track;
exports.trigger = trigger;
exports.ITERATE_KEY = void 0;

var _operations = require("./operations.js");

var _index = require("../../shared/index.js");

var targetMap = new WeakMap();
var activeEffect;
var effectStack = [];
var ITERATE_KEY = Symbol('iterate');
exports.ITERATE_KEY = ITERATE_KEY;

function isEffect(fn) {
  return fn && fn._isEffect === true;
}

function effect(fn) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (isEffect(fn)) {
    fn = fn.raw;
  }

  var effect = createReactiveEffect(fn, options);

  if (!options.lazy) {
    effect();
  }

  return effect;
}

function stop(effect) {
  if (effect.active) {
    cleanup(effect);
    if (effect.options.onStop) effect.options.onStop();
    effect.active = false;
  }
}

function createReactiveEffect(fn, options) {
  var effect = function reactiveEffect() {
    if (!effect.active) return effect.options.scheduler ? undefined : fn();

    if (!effectStack.includes(effect)) {
      cleanup(effect);

      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };

  effect._isEffect = true;
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  return effect;
}

function cleanup(effect) {
  var deps = effect.deps;
  deps.forEach(function (dep) {
    return dep.delete(effect);
  }); // deps 中的 dep 清 effect

  deps.length = 0; // 清空 effect 的 deps
}

function track(target, type, key) {
  if (activeEffect == null) return;
  var depsMap = targetMap.get(target);

  if (!depsMap) {
    targetMap.set(target, depsMap = new Map());
  }

  var dep = depsMap.get(key);

  if (!dep) {
    depsMap.set(key, dep = new Set());
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);

    if (activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target: target,
        type: type,
        key: key
      });
    }
  }
}

function trigger(target, type, key) {
  var depsMap = targetMap.get(target);
  if (!depsMap) return; // 需要新建一个 set，如果直接 const effect = depsMap.get(key)
  // effect 函数执行时 track 的依赖就也会在这一轮 trigger 执行，导致无限循环

  var effects = new Set();

  var add = function add(effectsToAdd) {
    if (effectsToAdd) {
      effectsToAdd.forEach(function (effect) {
        // 不要添加自己当前的 effect，否则之后 run（mutate）的时候
        // 遇到 effect(() => foo.value++) 会导致无限循环
        if (effect !== activeEffect) effects.add(effect);
      });
    }
  };

  if (type === _operations.TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    depsMap.forEach(add);
  } else {
    // SET | ADD | DELETE
    if (key !== undefined) {
      add(depsMap.get(key));
    }

    var shouldTriggerIteration = type === _operations.TriggerOpTypes.ADD || type === _operations.TriggerOpTypes.DELETE || type === _operations.TriggerOpTypes.SET && target instanceof Map; // iteration key on ADD | DELETE | Map.SET

    if (shouldTriggerIteration) {
      add(depsMap.get((0, _index.isArray)(target) ? 'length' : ITERATE_KEY));
    }
  }

  var run = function run(effect) {
    if (effect.options.onTrigger) {
      effect.options.onTrigger({
        effect: effect,
        target: target,
        key: key
      });
    }

    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  };

  effects.forEach(run);
}
},{"./operations.js":"../packages/reactivity/src/operations.js","../../shared/index.js":"../packages/shared/index.js"}],"../packages/reactivity/src/baseHandlers.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readonlyHandlers = exports.mutableHandlers = void 0;

var _reactive = require("./reactive.js");

var _operations = require("./operations.js");

var _effect = require("./effect.js");

var _index = require("../../shared/index.js");

function createGetter() {
  var isReadonly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  return function get(target, key, receiver) {
    if (key === _reactive.ReactiveFlags.IS_REACTIVE) return !isReadonly;
    if (key === _reactive.ReactiveFlags.IS_READONLY) return isReadonly;

    if (key === _reactive.ReactiveFlags.RAW && receiver === (isReadonly ? _reactive.readonlyMap : _reactive.reactiveMap).get(target)) {
      return target;
    }

    var res = Reflect.get(target, key, receiver);
    if (!isReadonly) (0, _effect.track)(target, _operations.TrackOpTypes.GET, key);

    if ((0, _index.isObject)(res)) {
      return isReadonly ? (0, _reactive.readonly)(res) : (0, _reactive.reactive)(res);
    }

    return res;
  };
}

var get = createGetter();
var readonlyGet = createGetter(true);

function createSetter() {
  return function set(target, key, value, receiver) {
    var oldValue = target[key];
    var res = Reflect.set(target, key, value, receiver);

    if (target === receiver[_reactive.ReactiveFlags.RAW] && (0, _index.hasChanged)(value, oldValue)) {
      (0, _effect.trigger)(target, _operations.TriggerOpTypes.SET, key);
    }

    return res;
  };
}

var set = createSetter(); // delete proxy.key

function deleteProperty(target, key) {
  var result = Reflect.deleteProperty(target, key);
  if (result && (0, _index.hasOwn)(target, key)) (0, _effect.trigger)(target, _operations.TriggerOpTypes.DELETE, key);
  return result;
} // 'key' in proxy


function has(target, key) {
  (0, _effect.track)(target, _operations.TrackOpTypes.HAS, key);
  return Reflect.has(target, key);
} // Object.getOwnPropertyNames(proxy)、Object.getOwnPropertySymbols(proxy)、
// Object.keys(proxy)、for...in
// 例如：effect(() => console.log(Object.keys(proxy))) 需要在 proxy 新增或删除元素时触发


function ownKeys(target) {
  (0, _effect.track)(target, _operations.TrackOpTypes.ITERATE, _effect.ITERATE_KEY);
  return Reflect.ownKeys(target);
}

var mutableHandlers = {
  get: get,
  set: set,
  deleteProperty: deleteProperty,
  has: has,
  ownKeys: ownKeys
};
exports.mutableHandlers = mutableHandlers;
var readonlyHandlers = {
  get: readonlyGet,
  set: function set(target, key) {
    console.warn("Set operation on key \"".concat(String(key), "\" failed: target is readonly."), target);
    return true;
  },
  deleteProperty: function deleteProperty(target, key) {
    console.warn("Delete operation on key \"".concat(String(key), "\" failed: target is readonly."), target);
    return true;
  }
};
exports.readonlyHandlers = readonlyHandlers;
},{"./reactive.js":"../packages/reactivity/src/reactive.js","./operations.js":"../packages/reactivity/src/operations.js","./effect.js":"../packages/reactivity/src/effect.js","../../shared/index.js":"../packages/shared/index.js"}],"../packages/reactivity/src/collectionHandler.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readonlyCollectionHandlers = exports.mutableCollectionHandlers = void 0;

var _reactive = require("./reactive.js");

var _index = require("../../shared/index.js");

var _effect = require("./effect.js");

var _operations = require("./operations.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// const getProto = (v) => Reflect.getPrototypeOf(v)
// Set, WeakSet, Map, WeakMap
var _get = function get(target, key, isReadonly) {
  var rawTarget = (0, _reactive.toRaw)(target);
  var rawKey = (0, _reactive.toRaw)(key);
  !isReadonly && (0, _effect.track)(rawTarget, _operations.TrackOpTypes.GET, rawKey);
  var res = rawTarget.get(rawKey);

  if ((0, _index.isObject)(res)) {
    return isReadonly ? (0, _reactive.readonly)(res) : (0, _reactive.reactive)(res);
  }

  return res;
}; // Set, WeakSet, Map, WeakMap


var size = function size(target, isReadonly) {
  var rawTarget = (0, _reactive.toRaw)(target);
  !isReadonly && (0, _effect.track)(rawTarget, _operations.TrackOpTypes.ITERATE, _effect.ITERATE_KEY);
  return Reflect.get(rawTarget, 'size', rawTarget);
}; // Set, WeakSet, Map, WeakMap


var _has = function has(target, key, isReadonly) {
  var rawTarget = (0, _reactive.toRaw)(target);
  var rawKey = (0, _reactive.toRaw)(key);
  !isReadonly && (0, _effect.track)(rawTarget, _operations.TrackOpTypes.HAS, rawKey);
  return rawTarget.has(rawKey);
}; // Set, WeakSet


var _add = function add(target, value, isReadonly) {
  if (isReadonly) throw new Error("operation ADD failed: target is readonly.");
  var rawValue = (0, _reactive.toRaw)(value);
  var rawTarget = (0, _reactive.toRaw)(target);
  var hadKey = rawTarget.has(rawValue);
  var res = rawTarget.add(rawValue);

  if (!hadKey) {
    // 要先执行 add 后再 trigger，保证 effect 中的函数能执行出正确的结果
    (0, _effect.trigger)(target, _operations.TriggerOpTypes.ADD, value);
  }

  return res;
}; // Map, WeakMap


var _set = function set(target, key, value, isReadonly) {
  if (isReadonly) throw new Error("operation SET failed: target is readonly.");
  var rawTarget = (0, _reactive.toRaw)(target);
  var rawKey = (0, _reactive.toRaw)(key);
  var rawValue = (0, _reactive.toRaw)(value);
  var hadKey = rawTarget.has(rawKey);
  var res = rawTarget.set(rawKey, rawValue);

  if (hadKey) {
    (0, _effect.trigger)(rawTarget, _operations.TriggerOpTypes.ADD, rawKey);
  } else {
    (0, _effect.trigger)(rawTarget, _operations.TriggerOpTypes.SET, rawKey);
  }

  return res;
}; // Set, WeakSet, Map, WeakMap


var deleteEntry = function deleteEntry(target, key, isReadonly) {
  if (isReadonly) throw new Error("operation DELETE failed: target is readonly.");
  var rawTarget = (0, _reactive.toRaw)(target);
  var rawKey = (0, _reactive.toRaw)(key);
  var hadKey = rawTarget.has(rawKey);
  var res = rawTarget.delete(rawKey);

  if (hadKey) {
    (0, _effect.trigger)(rawTarget, _operations.TriggerOpTypes.DELETE, rawKey);
  }

  return res;
}; // Set, WeakSet, Map, WeakMap


var _clear = function clear(target, isReadonly) {
  if (isReadonly) throw new Error("operation CLEAR failed: target is readonly.");
  var rawTarget = (0, _reactive.toRaw)(target);
  var hadKey = rawTarget.size !== 0;
  var res = rawTarget.clear();

  if (hadKey) {
    (0, _effect.trigger)(rawTarget, _operations.TriggerOpTypes.CLEAR, undefined);
  }

  return res;
}; // Set, WeakSet, Map, WeakMap


var _forEach = function forEach(target, callback, thisArg, isReadonly) {
  var rawTarget = (0, _reactive.toRaw)(target);
  !isReadonly && (0, _effect.track)(rawTarget, _operations.TrackOpTypes.ITERATE, _effect.ITERATE_KEY);

  var wrap = function wrap(value) {
    if ((0, _index.isObject)(value)) return isReadonly ? (0, _reactive.readonly)(value) : (0, _reactive.reactive)(value);
    return value;
  };

  return rawTarget.forEach(function (value, key) {
    return callback.call(thisArg, wrap(value), wrap(key), target);
  });
};

var createIterableMethod = function createIterableMethod(method, isReadonly) {
  return function (target) {
    var rawTarget = (0, _reactive.toRaw)(target);

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var rawIterator = rawTarget[method].apply(rawTarget, args);

    var wrap = function wrap(value) {
      if ((0, _index.isObject)(value)) return isReadonly ? (0, _reactive.readonly)(value) : (0, _reactive.reactive)(value);
      return value;
    };

    !isReadonly && (0, _effect.track)(rawTarget, _operations.TrackOpTypes.ITERATE, _effect.ITERATE_KEY);
    return _defineProperty({
      // iterator protocol
      next: function next() {
        var _rawIterator$next = rawIterator.next(),
            value = _rawIterator$next.value,
            done = _rawIterator$next.done;

        return done ? {
          value: value,
          done: done
        } : {
          value: method === 'entries' ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done: done
        };
      }
    }, Symbol.iterator, function () {
      return this; // 返回拦截的 Iterator：rawIterator -> proxyIterator(this)
    });
  };
};

var createInstrumentation = function createInstrumentation(isReadonly) {
  return _defineProperty({
    get: function get(key) {
      return _get(this, key, isReadonly); // 通过 Reflect 调用时 this 是 receiver（proxy 实例）
    },

    get size() {
      return size(this, isReadonly);
    },

    has: function has(key) {
      return _has(this, key, isReadonly);
    },
    add: function add(value) {
      return _add(this, value, isReadonly);
    },
    set: function set(key, value) {
      return _set(this, key, value, isReadonly);
    },
    delete: function _delete(key) {
      return deleteEntry(this, key, isReadonly);
    },
    clear: function clear() {
      return _clear(this, isReadonly);
    },
    forEach: function forEach(callback, thisArg) {
      return _forEach(this, callback, thisArg, isReadonly);
    },
    keys: function keys() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return createIterableMethod('keys', isReadonly).apply(void 0, [this].concat(args));
    },
    values: function values() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return createIterableMethod('values', isReadonly).apply(void 0, [this].concat(args));
    },
    entries: function entries() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return createIterableMethod('values', isReadonly).apply(void 0, [this].concat(args));
    }
  }, Symbol.iterator, function () {
    for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    return createIterableMethod(Symbol.iterator, isReadonly).apply(void 0, [this].concat(args));
  });
};

function createInstrumentationGetter(isReadonly) {
  var instrumentations = createInstrumentation(isReadonly);
  return function (target, key, receiver) {
    if (key === _reactive.ReactiveFlags.IS_REACTIVE) return !isReadonly;
    if (key === _reactive.ReactiveFlags.IS_READONLY) return isReadonly;
    if (key === _reactive.ReactiveFlags.RAW) return target;
    return Reflect.get((0, _index.hasOwn)(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
  };
}

var mutableCollectionHandlers = {
  get: createInstrumentationGetter(false)
};
exports.mutableCollectionHandlers = mutableCollectionHandlers;
var readonlyCollectionHandlers = {
  get: createInstrumentationGetter(true)
};
exports.readonlyCollectionHandlers = readonlyCollectionHandlers;
},{"./reactive.js":"../packages/reactivity/src/reactive.js","../../shared/index.js":"../packages/shared/index.js","./effect.js":"../packages/reactivity/src/effect.js","./operations.js":"../packages/reactivity/src/operations.js"}],"../packages/reactivity/src/reactive.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reactive = reactive;
exports.readonly = readonly;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.toRaw = toRaw;
exports.readonlyMap = exports.reactiveMap = exports.ReactiveFlags = void 0;

var _index = require("../../shared/index.js");

var _baseHandlers = require("./baseHandlers.js");

var _collectionHandler = require("./collectionHandler.js");

var ReactiveFlags = {
  IS_REACTIVE: '__v_isReactive',
  IS_READONLY: '__v_isReadonly',
  RAW: '__v_raw'
};
exports.ReactiveFlags = ReactiveFlags;
var TargetType = {
  COMMON: 'COMMON',
  COLLECTION: 'COLLECTION',
  INVALID: 'INVALID'
};
var reactiveMap = new WeakMap();
exports.reactiveMap = reactiveMap;
var readonlyMap = new WeakMap();
exports.readonlyMap = readonlyMap;

var getTargetType = function getTargetType(target) {
  var getTypeString = function getTypeString(target) {
    return Object.prototype.toString.call(target).slice(8, -1);
  };

  var typeString = getTypeString(target);

  switch (typeString) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON;

    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION;

    default:
      return TargetType.INVALID;
  }
};

function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
  if (!(0, _index.isObject)(target)) {
    throw new Error("value cannot be made reactive: ".concat(String(target)));
  } // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object


  if (target[ReactiveFlags.RAW] && !(isReadonly && target[ReactiveFlags.IS_REACTIVE])) {
    return target;
  } // 已经有了对应的 proxy


  var proxyMap = isReadonly ? readonlyMap : reactiveMap;
  var existingProxy = proxyMap.get(target);

  if (existingProxy) {
    return existingProxy;
  } // 获取 typeString 判断是不是 collectionType


  var targetType = getTargetType(target);

  if (targetType === TargetType.INVALID) {
    return target;
  }

  var observed = new Proxy(target, targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers);
  proxyMap.set(target, observed);
  return observed;
}

function reactive(target) {
  return createReactiveObject(target, false, _baseHandlers.mutableHandlers, _collectionHandler.mutableCollectionHandlers);
}

function readonly(target) {
  return createReactiveObject(target, true, _baseHandlers.readonlyHandlers, _collectionHandler.readonlyCollectionHandlers);
}

function isReactive(target) {
  return !!(target && target[ReactiveFlags.IS_REACTIVE]);
}

function isReadonly(target) {
  return !!(target && target[ReactiveFlags.IS_READONLY]);
}

function toRaw(ob) {
  return ob && toRaw(ob[ReactiveFlags.RAW]) || ob;
}
},{"../../shared/index.js":"../packages/shared/index.js","./baseHandlers.js":"../packages/reactivity/src/baseHandlers.js","./collectionHandler.js":"../packages/reactivity/src/collectionHandler.js"}],"../packages/reactivity/src/ref.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.customRef = customRef;
exports.ref = ref;
exports.RefFlags = void 0;

var _reactive = require("./reactive.js");

var _effect = require("./effect.js");

var _operations = require("./operations.js");

function _defineEnumerableProperties(obj, descs) { for (var key in descs) { var desc = descs[key]; desc.configurable = desc.enumerable = true; if ("value" in desc) desc.writable = true; Object.defineProperty(obj, key, desc); } if (Object.getOwnPropertySymbols) { var objectSymbols = Object.getOwnPropertySymbols(descs); for (var i = 0; i < objectSymbols.length; i++) { var sym = objectSymbols[i]; var desc = descs[sym]; desc.configurable = desc.enumerable = true; if ("value" in desc) desc.writable = true; Object.defineProperty(obj, sym, desc); } } return obj; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var RefFlags = {
  IS_REF: '__v_isRef'
};
exports.RefFlags = RefFlags;

function customRef(factory) {
  var _value, _value2, _ref, _mutatorMap;

  var _factory = factory(function () {
    return (0, _effect.track)(ref, _operations.TrackOpTypes.GET, 'value');
  }, function () {
    return (0, _effect.trigger)(ref, _operations.TriggerOpTypes.SET, 'value');
  }),
      get = _factory.get,
      set = _factory.set;

  var ref = (_ref = {}, _defineProperty(_ref, RefFlags.IS_REF, true), _value = "value", _mutatorMap = {}, _mutatorMap[_value] = _mutatorMap[_value] || {}, _mutatorMap[_value].get = function () {
    return get();
  }, _value2 = "value", _mutatorMap[_value2] = _mutatorMap[_value2] || {}, _mutatorMap[_value2].set = function (v) {
    set(v);
  }, _defineEnumerableProperties(_ref, _mutatorMap), _ref);
  return ref;
}

function ref(value) {
  return customRef(function (track, trigger) {
    return {
      get: function get() {
        track();
        return value;
      },
      set: function set(newValue) {
        value = newValue;
        trigger();
      }
    };
  });
}
},{"./reactive.js":"../packages/reactivity/src/reactive.js","./effect.js":"../packages/reactivity/src/effect.js","./operations.js":"../packages/reactivity/src/operations.js"}],"../packages/reactivity/src/computed.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computed = computed;

var _index = require("../../shared/index.js");

var _effect = require("./effect.js");

var _ref = require("./ref.js");

function computed(options) {
  var getter;
  var setter;

  if ((0, _index.isFunction)(options)) {
    getter = options;

    setter = function setter() {};
  } else {
    getter = options.get;
    setter = options.set;
  }

  return createComputedRef(getter, setter);
}

function createComputedRef(getter, setter) {
  var dirty = true;
  var value;
  var computedRef = (0, _ref.customRef)(function (track, trigger) {
    var computeEffect = (0, _effect.effect)(getter, {
      lazy: true,
      scheduler: function scheduler() {
        if (!dirty) {
          dirty = true;
          trigger();
        }
      }
    });
    computedRef.effect = computeEffect; // runtime-core 组件拿 effect 用

    return {
      get: function get() {
        if (dirty) {
          value = computeEffect();
          dirty = false;
        }

        track();
        return value;
      },
      set: function set(newValue) {
        setter(newValue);
      }
    };
  });
  return computedRef;
}
},{"../../shared/index.js":"../packages/shared/index.js","./effect.js":"../packages/reactivity/src/effect.js","./ref.js":"../packages/reactivity/src/ref.js"}],"../packages/reactivity/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "reactive", {
  enumerable: true,
  get: function () {
    return _reactive.reactive;
  }
});
Object.defineProperty(exports, "readonly", {
  enumerable: true,
  get: function () {
    return _reactive.readonly;
  }
});
Object.defineProperty(exports, "isReactive", {
  enumerable: true,
  get: function () {
    return _reactive.isReactive;
  }
});
Object.defineProperty(exports, "isReadonly", {
  enumerable: true,
  get: function () {
    return _reactive.isReadonly;
  }
});
Object.defineProperty(exports, "effect", {
  enumerable: true,
  get: function () {
    return _effect.effect;
  }
});
Object.defineProperty(exports, "isEffect", {
  enumerable: true,
  get: function () {
    return _effect.isEffect;
  }
});
Object.defineProperty(exports, "stop", {
  enumerable: true,
  get: function () {
    return _effect.stop;
  }
});
Object.defineProperty(exports, "ref", {
  enumerable: true,
  get: function () {
    return _ref.ref;
  }
});
Object.defineProperty(exports, "customRef", {
  enumerable: true,
  get: function () {
    return _ref.customRef;
  }
});
Object.defineProperty(exports, "computed", {
  enumerable: true,
  get: function () {
    return _computed.computed;
  }
});

var _reactive = require("./src/reactive.js");

var _effect = require("./src/effect.js");

var _ref = require("./src/ref.js");

var _computed = require("./src/computed.js");
},{"./src/reactive.js":"../packages/reactivity/src/reactive.js","./src/effect.js":"../packages/reactivity/src/effect.js","./src/ref.js":"../packages/reactivity/src/ref.js","./src/computed.js":"../packages/reactivity/src/computed.js"}],"../packages/runtime-core/vnode.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.h = h;
exports.isSameVNodeType = void 0;

function h(type, props) {
  var _props, _props$key;

  props = (_props = props) !== null && _props !== void 0 ? _props : {};
  var key = (_props$key = props.key) !== null && _props$key !== void 0 ? _props$key : null;
  delete props.key;

  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  if (children.length === 1) {
    props.children = children[0];
  } else if (children.length > 1) {
    props.children = children;
  }

  return {
    type: type,
    // function, setup, string, Text (internal)
    props: props,
    // only for user (props.children)
    key: key,
    node: null,
    // hostNode
    instance: null,
    // setupComponent: component instance, functionalComponent: hooks
    parent: null,
    children: null // VNode[], for internal vnode structure

  };
}

var isSameVNodeType = function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
};

exports.isSameVNodeType = isSameVNodeType;
},{}],"../packages/runtime-core/component.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recordInstanceBoundEffect = exports.setCurrentInstance = exports.getCurrentInstance = exports.isTextType = exports.Text = void 0;
var Text = Symbol('Text');
exports.Text = Text;

var isTextType = function isTextType(v) {
  return v === Text;
};

exports.isTextType = isTextType;
var currentInstance;

var getCurrentInstance = function getCurrentInstance() {
  return currentInstance;
};

exports.getCurrentInstance = getCurrentInstance;

var setCurrentInstance = function setCurrentInstance(instance) {
  return currentInstance = instance;
};

exports.setCurrentInstance = setCurrentInstance;

var recordInstanceBoundEffect = function recordInstanceBoundEffect(effect) {
  if (currentInstance) currentInstance.effects.push(effect);
};

exports.recordInstanceBoundEffect = recordInstanceBoundEffect;
},{}],"../packages/runtime-core/renderer.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRenderer = createRenderer;

var _shared = require("../shared");

var _component = require("./component");

var _vnode = require("./vnode");

var _reactivity = require("../reactivity");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function createRenderer(options) {
  var patch = function patch(n1, n2, container, isSVG) {
    if (n1 && !(0, _vnode.isSameVNodeType)(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

    var type = n2.type;

    if ((0, _shared.isObject)(type)) {
      processComponent(n1, n2, container, isSVG);
    } else if ((0, _shared.isString)(type)) {
      processElement(n1, n2, container, isSVG);
    } else if ((0, _component.isTextType)(type)) {
      processText(n1, n2, container);
    } else {
      type.process();
    }
  };

  var processComponent = function processComponent(n1, n2, container, isSVG) {
    if (n1 == null) {
      var instance = n2.instance = {
        props: (0, _reactivity.reactive)(n2.props),
        // initProps
        update: null,
        effects: []
      };
      (0, _component.setCurrentInstance)(instance);
      var render = n2.type.setup(instance.props);
      (0, _component.setCurrentInstance)(null);
      var prevRenderResult = null;
      instance.update = (0, _reactivity.effect)(function () {
        var renderResult = render();
        n2.children = [renderResult];
        renderResult.parent = n2;
        patch(prevRenderResult, renderResult, container, isSVG);
        prevRenderResult = renderResult;
      });
    } else {
      var _instance = n2.instance = n1.instance; // updateProps, 根据 vnode.props 修改 instance.props


      Object.keys(n2.props).forEach(function (key) {
        var newValue = n2.props[key];
        var oldValue = _instance.props[key];

        if (newValue !== oldValue) {
          _instance.props[key] = newValue;
        }
      });
    }
  };

  var processText = function processText(n1, n2, container) {
    if (n1 == null) {
      var node = n2.node = document.createTextNode(n2.props.nodeValue);
      container.appendChild(node);
    } else {
      var _node = n2.node = n1.node;

      _node.nodeValue = n2.props.nodeValue;
    }
  };

  var processElement = function processElement(n1, n2, container, isSVG) {
    if (n1 == null) {
      var node = n2.node = isSVG ? document.createElementNS('http://www.w3.org/2000/svg', n2.type) : document.createElement(n2.type);
      patchChildren(null, n2, node, isSVG);
      patchProps(null, n2.props, node, isSVG);
      container.appendChild(node);
    } else {
      var _node2 = n2.node = n1.node;

      patchChildren(n1, n2, _node2, isSVG);
      patchProps(n1.props, n2.props, _node2, isSVG);
    }
  };

  var patchChildren = function patchChildren(n1, n2, container) {
    var isSVG = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var oldChildren = n1 ? n1.children : [];
    var newChildren = n2.props.children;
    newChildren = (0, _shared.isArray)(newChildren) ? newChildren : [newChildren];
    n2.children = [];

    for (var i = 0; i < newChildren.length; i++) {
      if (newChildren[i] == null) continue;
      var newChild = newChildren[i];
      newChild = (0, _shared.isText)(newChild) ? (0, _vnode.h)(_component.Text, {
        nodeValue: newChild
      }) : newChild;
      n2.children[i] = newChild;
      newChild.parent = n2;
      var oldChild = null;

      for (var j = 0; j < oldChildren.length; j++) {
        if (oldChildren[j] == null) continue;

        if ((0, _vnode.isSameVNodeType)(oldChildren[j], newChild)) {
          oldChild = oldChildren[j];
          oldChildren[j] = null;
          break;
        }
      }

      patch(oldChild, newChild, container, isSVG);
      if (newChild.node) container.appendChild(newChild.node);
    }

    var _iterator = _createForOfIteratorHelper(oldChildren),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _oldChild = _step.value;
        if (_oldChild != null) unmount(_oldChild);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  };

  var patchProps = function patchProps(oldProps, newProps, node, isSVG) {
    var _oldProps, _newProps;

    oldProps = (_oldProps = oldProps) !== null && _oldProps !== void 0 ? _oldProps : {};
    newProps = (_newProps = newProps) !== null && _newProps !== void 0 ? _newProps : {}; // remove old props

    Object.keys(oldProps).forEach(function (propName) {
      if (propName !== 'children' && propName !== 'key' && !(propName in newProps)) {
        setProperty(node, propName, null, oldProps[propName], isSVG);
      }
    }); // update old props

    Object.keys(newProps).forEach(function (propName) {
      if (propName !== 'children' && propName !== 'key' && oldProps[propName] !== newProps[propName]) {
        setProperty(node, propName, newProps[propName], oldProps[propName], isSVG);
      }
    });
  };

  var setProperty = function setProperty(node, propName, newValue, oldValue, isSVG) {
    if (propName[0] === 'o' && propName[1] === 'n') {
      var eventType = propName.toLowerCase().slice(2);
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
        node[propName] = newValue == null ? '' : newValue;
      } else if (newValue == null || newValue === false) {
        node.removeAttribute(propName);
      } else {
        node.setAttribute(propName, newValue);
      }
    }
  };

  function eventProxy(e) {
    // this: node
    this.listeners[e.type](e);
  }

  var unmount = function unmount(vnode) {
    var doRemove = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var type = vnode.type;

    if ((0, _shared.isObject)(type)) {
      var instance = vnode.instance;
      instance.effects.forEach(_reactivity.stop);
      (0, _reactivity.stop)(instance.update);
      vnode.children.forEach(function (c) {
        return unmount(c, doRemove);
      });
    } else if ((0, _shared.isString)(type)) {
      vnode.children.forEach(function (c) {
        return unmount(c, false);
      });
      var child = vnode.node;
      var parent = child.parentNode;
      if (parent && doRemove) parent.removeChild(child);
    } else if ((0, _component.isTextType)(type)) {
      var _child = vnode.node;
      var _parent = _child.parentNode;
      if (_parent && doRemove) _parent.removeChild(_child);
    } else {
      type.unmount();
    }
  };

  return {
    render: function render(vnode, container) {
      if (vnode == null) {
        if (container.vnode) {
          unmount(container.vnode);
        }
      } else {
        var _container$vnode;

        patch((_container$vnode = container.vnode) !== null && _container$vnode !== void 0 ? _container$vnode : null, vnode, container);
      }

      container.vnode = vnode;
    }
  };
}
},{"../shared":"../packages/shared/index.js","./component":"../packages/runtime-core/component.js","./vnode":"../packages/runtime-core/vnode.js","../reactivity":"../packages/reactivity/index.js"}],"../packages/runtime-core/api-watch.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.watchEffect = void 0;

var _reactivity = require("../reactivity");

var _component = require("./component");

var watchEffect = function watchEffect(cb) {
  var e = (0, _reactivity.effect)(cb);
  (0, _component.recordInstanceBoundEffect)(e);
  return function () {
    return (0, _reactivity.stop)(e);
  };
};

exports.watchEffect = watchEffect;
},{"../reactivity":"../packages/reactivity/index.js","./component":"../packages/runtime-core/component.js"}],"../packages/runtime-core/api-computed.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computed = void 0;

var _reactivity = require("../reactivity");

var _component = require("./component");

var computed = function computed(options) {
  var ret = (0, _reactivity.computed)(options);
  (0, _component.recordInstanceBoundEffect)(ret.effect);
  return ret;
};

exports.computed = computed;
},{"../reactivity":"../packages/reactivity/index.js","./component":"../packages/runtime-core/component.js"}],"../packages/runtime-core/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "h", {
  enumerable: true,
  get: function () {
    return _vnode.h;
  }
});
Object.defineProperty(exports, "createRenderer", {
  enumerable: true,
  get: function () {
    return _renderer.createRenderer;
  }
});
Object.defineProperty(exports, "watchEffect", {
  enumerable: true,
  get: function () {
    return _apiWatch.watchEffect;
  }
});
Object.defineProperty(exports, "computed", {
  enumerable: true,
  get: function () {
    return _apiComputed.computed;
  }
});

var _vnode = require("./vnode");

var _renderer = require("./renderer");

var _apiWatch = require("./api-watch");

var _apiComputed = require("./api-computed");
},{"./vnode":"../packages/runtime-core/vnode.js","./renderer":"../packages/runtime-core/renderer.js","./api-watch":"../packages/runtime-core/api-watch.js","./api-computed":"../packages/runtime-core/api-computed.js"}],"diff/index.jsx":[function(require,module,exports) {
"use strict";

var _reactivity = require("../../packages/reactivity");

var _runtimeCore = require("../../packages/runtime-core");

/** @jsx h */
var Displayer = {
  setup: function setup(props) {
    return function () {
      return (0, _runtimeCore.h)("div", null, props.children);
    };
  }
};
var App = {
  setup: function setup(props) {
    var count = (0, _reactivity.ref)(0);

    var inc = function inc() {
      return count.value++;
    };

    (0, _runtimeCore.watchEffect)(function () {
      return console.log(count.value);
    });
    return function () {
      return (0, _runtimeCore.h)("div", null, count.value % 2 ? (0, _runtimeCore.h)(Displayer, null, count.value) : null, (0, _runtimeCore.h)("button", {
        onClick: inc
      }, " + "));
    };
  }
};
(0, _runtimeCore.createRenderer)().render((0, _runtimeCore.h)(App, null), document.querySelector('#root'));
},{"../../packages/reactivity":"../packages/reactivity/index.js","../../packages/runtime-core":"../packages/runtime-core/index.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "58743" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","diff/index.jsx"], null)
//# sourceMappingURL=/diff.66b157cd.js.map