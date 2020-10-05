let globalClonedObjects;

export default function imh() {
  // create mutator
  if (arguments.length < 2) {
    return wrapMutator(arguments[0], function (model, apply) {
      return apply(model);
    });
  }
  return imh(arguments[1])(arguments[0]);
}

Object.assign(imh, {
  set,
  prop,
  map,
  unset,
  push,
  merge,
  splice,
  filter,
  sort,
  orderBy,
  swap,
  remove,
  add,
  mul,
  div,
  toggle,
  val,
  clear,
  def,
  pop,
  shift,
  unshift,
  reverse,
  result,
});

function wrapMutator(mutations, mutator) {
  if (!Array.isArray(mutations)) {
    mutations = [mutations];
  }
  return function (model, data, context) {
    if (!context) {
      context = createContext(model);
    }
    return mutator(
      model,
      function (value, data) {
        return applyMutations(value, context, data, mutations);
      },
      context,
      data
    );
  };
}

export function push(...items) {
  return function pushMutation(model) {
    mustBeArray(model);
    if (!items.length) return model;
    return model.concat(items);
  };
}

export function map(mutations) {
  return wrapMutator(mutations, function (model, apply) {
    mustBeArray(model);

    let hasChange = false;
    const nextModel = model.map(function (currentValue, index, array) {
      const nextValue = apply(currentValue, { index, array });
      if (nextValue !== currentValue) {
        hasChange = true;
        return nextValue;
      }
      return currentValue;
    });
    return hasChange ? nextModel : model;
  });
}

export function merge(...objects) {
  return function (model, _, context) {
    let cloned = model;
    const changedKeys = new Set();
    // use for loop for better performance
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      const keys = Object.keys(object);
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const value = object[key];
        if (cloned[key] !== value) {
          if (cloned === model) {
            cloned = context.clone(model);
          }
          cloned[key] = value;
          changedKeys.add(key);
        }
      }
    }

    if (changedKeys.size) {
      let hasChange = false;
      changedKeys.forEach(function (key) {
        if (model[key] !== cloned[key]) {
          hasChange = true;
        }
      });
      if (!hasChange) return model;
    }
    return cloned;
  };
}

export function prop(key, mutations) {
  if (Array.isArray(key)) {
    return key.reduceRight(function (prevMutations, key) {
      return [mutateSingleProp(key, prevMutations)];
    }, mutations)[0];
  }
  return mutateSingleProp(key, mutations);
}

function mutateSingleProp(key, mutations) {
  return wrapMutator(mutations, function (model, apply, context) {
    if (typeof model === "undefined" || model === null) {
      model = {};
    }
    const currentValue = model[key];
    const nextValue = apply(currentValue);
    if (currentValue === nextValue) {
      return model;
    }
    const cloned = context.clone(model);
    cloned[key] = nextValue;
    return cloned;
  });
}

export function set(key, value) {
  return function (model, data, context) {
    if (typeof model === "undefined" || model === null) {
      model = {};
    }
    if (model[key] === value) return model;
    const cloned = context.clone(model);
    cloned[key] = value;
    return cloned;
  };
}

export function unset() {
  const args = arguments;
  return function (model, data, context) {
    let cloned = model;
    for (let i = 0; i < args.length; i++) {
      const key = args[i];
      if (key in cloned) {
        if (cloned === model) {
          cloned = context.clone(model);
        }
        delete cloned[key];
      }
    }
    return cloned;
  };
}

function applyMutations(model, context, data, mutations) {
  return mutations.reduce(function (value, mutation) {
    const result = mutation(value, data, context);
    if (typeof result === "function") return result(value, context);
    return result;
  }, model);
}

function createContext(root) {
  const clonedObjects = (globalClonedObjects = new WeakMap());
  return {
    root,
    clone(obj, array) {
      if (typeof obj !== "object") {
        throw new Error("Cannot clone non-object value");
      }
      // is cloned
      if (clonedObjects.has(obj)) return obj;

      let cloned;
      if (Array.isArray(obj)) {
        if (array === false)
          throw new Error("Expected object type but got array type");
        cloned = obj.slice();
      } else {
        if (array === true)
          throw new Error("Expected array type but got object type");
        cloned = Object.assign({}, obj);
      }
      clonedObjects.set(cloned, obj);
      return cloned;
    },
  };
}

export function splice(index, length) {
  const args = arguments;
  return function spliceMutation(model, data, context) {
    mustBeArray(model);
    const hasChange = args.length > 2 || (index < model.length - 1 && length);
    if (!hasChange) return model;
    const cloned = context.clone(model);
    context.result = cloned.splice.apply(cloned, args);
    return shallowMemoArray(model, cloned);
  };
}

export function filter(predicate) {
  return function filterMutation(model) {
    mustBeArray(model);
    const filtered = model.filter(predicate);
    return shallowMemoArray(model, filtered);
  };
}

export function sort(compareFn) {
  return function sortMutation(model, data, context) {
    mustBeArray(model);
    const cloned = context.clone(model);
    cloned.sort(compareFn);
    return shallowMemoArray(model, cloned);
  };
}

export function orderBy(selector) {
  return sort((a, b) => {
    const av = selector(a);
    const bv = selector(b);
    return av > bv ? 1 : av < bv ? -1 : 0;
  });
}

export function swap(from, to) {
  return function swapMutation(model, data, context) {
    mustBeArray(model);
    const fv = model[from];
    const tv = model[to];
    if (fv === tv) return model;
    const cloned = context.clone(model);
    cloned[from] = tv;
    cloned[to] = fv;
    return cloned;
  };
}

export function remove(...indices) {
  return function removeMutation(model, data, context) {
    mustBeArray(model);
    // remove invalid indices before to proceed
    const validIndices = indices
      .filter((index) => index >= 0 && index < model.length)
      .sort();
    if (!validIndices.length) return model;
    const cloned = context.clone(model);
    while (validIndices.length) {
      cloned.splice(validIndices.pop(), 1);
    }
    return cloned;
  };
}

export function add(value) {
  return function addMutation(model) {
    if (typeof model === "string") {
      return model + value;
    }
    // is timespan
    if (typeof value === "object") {
      const {
        years = 0,
        months = 0,
        days = 0,
        hours = 0,
        minutes = 0,
        seconds = 0,
        milliseconds = 0,
      } = value;
      const isTimestamp = typeof model === "number";
      const from = isTimestamp ? new Date() : model;
      const to = new Date(
        from.getFullYear() + years,
        from.getMonth() + months,
        from.getDate() + days,
        from.getHours() + hours,
        from.getMinutes() + minutes,
        from.getSeconds() + seconds,
        from.getMilliseconds() + milliseconds
      );
      if (isTimestamp) {
        return model + to.getTime() - from.getTime();
      } else {
        if (from.getTime() === to.getTime()) return model;
        return to;
      }
    } else if (model instanceof Date) {
      const to = new Date(model.getTime() + parseFloat(value));
      if (to.getTime() === model.getTime()) return model;
      return to;
    }
    return model + value;
  };
}

export function mul(value) {
  return function (model) {
    return model * value;
  };
}

export function div(value) {
  return function (model) {
    return model / value;
  };
}

export function toggle() {
  return function toggleMutation(model) {
    return !model;
  };
}

export function val(value) {
  return function valMutation() {
    return value;
  };
}

export function def(value) {
  return function defMutation(model = value) {
    return model;
  };
}

export function clear() {
  return function clearMutation(model) {
    mustBeArray(model);
    return model.length ? [] : model;
  };
}

export function pop() {
  return function popMutation(model, data, context) {
    mustBeArray(model);
    if (!model.length) return model;
    const cloned = context.clone(model);
    context.result = cloned.pop();
    return cloned;
  };
}

export function result(fn) {
  return function resultMutation(model, data, context) {
    const mutation = fn(context.result, model);
    if (
      typeof mutation === "function" ||
      (Array.isArray(mutation) && typeof mutation[0] === "function")
    ) {
      return applyMutations(
        model,
        context,
        data,
        Array.isArray(mutation) ? mutation : [mutation]
      );
    }
    return model;
  };
}

export function shift() {
  return function shiftMutation(model, data, context) {
    mustBeArray(model);
    if (!model.length) return model;
    const cloned = context.clone(model);
    context.result = cloned.shift();
    return cloned;
  };
}

export function unshift(...items) {
  return function unshiftMutation(model) {
    mustBeArray(model);
    if (!model.length) return items;
    return items.concat(model);
  };
}

export function reverse() {
  return function (model, data, context) {
    mustBeArray(model);
    if (model.length < 2) return model;
    const cloned = context.clone(model);
    cloned.reverse();
    return shallowMemoArray(model, cloned);
  };
}

function mustBeArray(value) {
  if (!Array.isArray(value)) throw new Error("Input must be array type");
}

function getOriginalValue(obj) {
  if (typeof obj === "object" && globalClonedObjects) {
    const original = globalClonedObjects.get(obj);
    return original || obj;
  }
  return obj;
}

function shallowMemo(oldValue, newValue) {
  oldValue = getOriginalValue(oldValue);

  if (typeof newValue === "function") newValue = newValue();
  if (isEqual(oldValue, newValue)) return oldValue;
  if (Array.isArray(oldValue) && Array.isArray(newValue))
    return shallowMemoArray(oldValue, newValue);
  return newValue;
}

function shallowMemoArray(oldValue, newValue) {
  oldValue = getOriginalValue(oldValue);

  if (
    oldValue.length === newValue.length &&
    oldValue.every((value, index) => newValue[index] === value)
  )
    return oldValue;
  return newValue;
}

function isEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    isPromiseLike(a) ||
    isPromiseLike(b) ||
    Array.isArray(a) ||
    Array.isArray(b)
  )
    return false;
  if (a === null && b) return false;
  if (b === null && a) return false;

  const comparer = (key) => {
    return a[key] === b[key];
  };
  return Object.keys(a).every(comparer) && Object.keys(b).every(comparer);
}

function isPromiseLike(obj) {
  return obj && typeof obj.then === "function";
}
