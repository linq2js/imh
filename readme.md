# imh (Immutable Helper)

The extremely fast immutable helper

## Installation

```
$ npm install --save imh
```

## Benchmarks

### Single mutation

| Library                         | Read |  Write |  Total |
| ------------------------------- | ---: | -----: | -----: |
| immutable.js (fastest)          |  265 |    372 |    637 |
| imh                             |   59 |    635 |    694 |
| timm                            |   43 |    662 |    705 |
| immutable-assign                |   58 |    806 |    864 |
| immhelper                       |   55 |  1,049 |  1,104 |
| seamless-immutable (production) |   56 | 13,630 | 13,686 |
| immer                           |   46 | 18,386 | 18,432 |
| update-immutable                |   44 | 38,532 | 38,576 |
| immutability-helper             |   50 | 38,666 | 38,716 |

### Multiple mutations

| Library                    | Read | Write | Total |
| -------------------------- | ---: | ----: | ----: |
| update-immutable (fastest) |    1 |    97 |    98 |
| imh                        |    1 |   198 |   199 |
| immutability-helper        |    3 |   263 |   266 |
| immhelper                  |    0 |   303 |   303 |
| immutable.js               |  170 |   538 |   708 |
| immer                      |    1 | 1,151 | 1,152 |
| timm                       |    2 | 1,710 | 1,712 |

**Hence, what I recommend (from top to bottom):**

1. If you don't need immutability, well... just mutate in peace! I mean, in place
1. If you need a complete, well-tested, rock-solid library and don't mind using a non-native API for reads: use ImmutableJS
1. If you value using plain arrays/objects above other considerations, use **imh**
1. If your typical use cases involve much more reading than writing, use **imh** as well
1. If you do a lot of writes, updating items in long arrays or attributes in fat objects, use ImmutableJS

## Usage

```jsx
import imh from "imh";

let state = {
  todos: [{ id: 1, title: "Todo 1", completed: false }],
  stats: {
    all: 1,
    active: 1,
    completed: 0,
  },
};

const StatsMutation = (current) =>
  // mutate stats prop
  imh.prop("stats", {
    all: current.todos.length,
    // compute number of active todos
    active: current.todos.filter((todo) => !todo.completed).length,
    // compute number of completed todos
    completed: current.todos.filter((todo) => todo.completed).length,
  });

function AddTodo(id, title) {
  state = imh(state, [
    // push new item to todos array
    imh.prop("todos", imh.push({ id, title, completed: true })),
    // update stats
    StatsMutation,
  ]);
}

function ToggleTodo(id) {
  state = imh(state, [
    // perform toggle action
    imh.prop(
      // nested prop path
      [
        // todos prop
        "todos",
        // toggle item which has id equal to given id
        (todo) => todo.id === id,
        // completed prop
        "completed",
      ],
      // toggle boolean value: true => false, false => true
      imh.toggle()
      // we can pass arrow function to mutate value as well
      // completed => !completed
    ),
    // update stats
    StatsMutation,
  ]);
}

AddTodo(2, "Todo 2");
console.log(state);
/*
{
  todos: [
    { id: 1, title: 'Todo 1', completed: false },
    { id: 2, title: 'Todo 2', completed: false },
  ],
  stats: { all: 2, active: 2, completed: 0 }
}
*/

AddTodo(3, "Todo 3");
console.log(state);
/*
{
  todos: [
    { id: 1, title: 'Todo 1', completed: false },
    { id: 2, title: 'Todo 2', completed: false },
    { id: 3, title: 'Todo 3', completed: false }
  ],
  stats: { all: 3, active: 3, completed: 0 }
}
*/

ToggleTodo(3);
console.log(state);
/*
{
  todos: [
    { id: 1, title: 'Todo 1', completed: false },
    { id: 2, title: 'Todo 2', completed: false },
    { id: 3, title: 'Todo 3', completed: true }
  ],
  stats: { all: 3, active: 2, completed: 1 }
}
*/
```

## API References

### imh(obj, mutation | mutations)

```jsx
imh(1, imh.add(1));
// => 2

// using val() to tell imh that is literal value (not mutation)
imh({ username: "admin", password: "admin" }, [
  imh.prop("password", imh.val("123456")),
  imh.prop("updatedOn", imh.val(Date.now())),
]);

// using custom mutation (a pure function that returns new value)
imh({ username: "admin", password: "admin" }, [
  imh.prop("password", () => "123456"),
  imh.prop("updatedOn", () => Date.now()),
]);

// using set() to update object property
imh({ username: "admin", password: "admin" }, [
  imh.set("password", "123456"),
  imh.set("updatedOn", Date.now()),
]);
```

### imh(mutation | mutations)

Create imh wrapper function

```jsx
const AddTen = imh(imh.add(10));
AddTen(1);
// => 11
```

## Array

### push(...items)

```jsx
imh([1, 2, 3], imh.push(4, 5, 6));
// => [1, 2, 3, 4, 5, 6]
```

### map(mutation | mutations)

```jsx
const todos = [
  { id: 1, title: "Todo 1" },
  { id: 2, title: "Todo 2" },
];
imh(
  todos,
  imh.map((todo) => ({ ...todo, title: todo.title.toUpperCase() }))
);
// => [ { id: 1, title: "TODO 1" }, { id: 2, title: "TODO 2" } ]

imh(todos, imh.map(imh.prop("title", imh.lower())));
// => [ { id: 1, title: "todo 1" }, { id: 2, title: "todo 2" } ]
```

### splice(index, length, ...newItems)

```jsx
imh([1, 2, 3, 4, 5], imh.splice(2, 2));
// => [1, 2, 5]

imh([1, 2, 3, 4, 5], imh.splice(2, 2, 9, 10));
// => [1, 2, 9, 10, 5]
```

### filter(predicate)

```jsx
imh(
  [1, 2, 3, 4, 5],
  imh.filter((number) => number % 2 === 0)
);
// => [2, 4]
```

### sort([compareFn])

```jsx
imh([3, 2, 1], imh.sort());
// => [1, 2, 3]

imh(
  [{ name: "banana" }, { name: "apple" }, { name: "watermelon" }],
  imh.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
);
// => [{ name: "apple" }, { name: "banana" }, { name: "watermelon" }]
```

### orderBy([selector[, direction]])

```jsx
// order by name ascending
imh(
  [{ name: "banana" }, { name: "apple" }, { name: "watermelon" }],
  imh.orderBy((item) => item.name)
);
// => [{ name: "apple" }, { name: "banana" }, { name: "watermelon" }]

// order by name descending
imh(
  [{ name: "banana" }, { name: "apple" }, { name: "watermelon" }],
  imh.orderBy((item) => item.name, -1)
);
// => [{ name: "watermelon" }, { name: "banana" }, { name: "apple" }]
```

### swap(from, to)

```jsx
imh([1, 2, 3], imh.swap(0, 2));
// => [3, 2, 1]
```

### remove(...indices)

```jsx
imh([1, 2, 3], imh.remove(0, 2));
// => [2]
```

### clear()

```jsx
imh([1, 2, 3], imh.clear());
// => []
```

### pop()

```jsx
imh([1, 2, 3], imh.pop());
// => [1, 2]
```

### shift()

```jsx
imh([1, 2, 3], imh.shift());
// => [2, 3]
```

### unshift(...items)

```jsx
imh([1, 2, 3], imh.unshift(-1, 0));
// => [-1, 0, 1, 2, 3]
```

### reverse()

```jsx
imh([1, 2, 3], imh.reverse());
// => [3, 2, 1]
```

## Object

### prop()

Update current / nested object property

```jsx
const model = { l1: { l2: { l3: { l4: 1 } } } };
imh(
  model,
  imh.prop("l1", imh.prop("l2", imh.prop("l3", imh.prop("l4", imh.val(2)))))
);

imh(
  model,
  imh.prop(
    "l1",
    imh.prop(
      "l2",
      imh.prop(
        "l3",
        imh.prop("l4", () => 2)
      )
    )
  )
);

imh(model, imh.prop("l1", imh.prop("l2", imh.prop("l3", imh.set("l4", 2)))));

imh(model, imh.prop(["l1", "l2", "l3", "l4"], imh.val(2)));

imh(
  model,
  imh.prop(["l1", "l2", "l3", "l4"], () => 2)
);

imh(model, imh.prop(["l1", "l2", "l3"], imh.set("l4", 2)));
```

### set()

```jsx
imh({ name: "Peter" }, imh.set("name", "Spider Man"));
// => { name: 'Spider Man' }
```

### unset(...keys)

```jsx
imh({ prop1: 1, prop2: 2, prop3: 3 }, imh.unset("prop1", "prop2"));
// => { prop3: 3 }

imh([1, 2, 3], imh.unset(1, 2));
// => [1, undefined, undefined]
```

### merge(...values)

```jsx
imh({ p1: 1, p2: 2 }, imh.merge({ p1: 1, p2: 2 }));
// => { p1: 1, p2: 2 } nothing to change

imh({ p1: 1, p2: 2 }, imh.merge({ p1: 1 }, { p2: 2 }));
// => { p1: 1, p2: 2 } nothing to change

imh({ p1: 1, p2: 2 }, imh.merge({ p1: 5 }, { p1: 1 }));
// => { p1: 1, p2: 2 } nothing to change

imh({ p1: 1, p2: 2 }, imh.merge({ p3: 3 }));
// => { p1: 1, p2: 2, p3: 3 }
```

## String

### replace(findWhat, replaceWith)

```jsx
imh("banana, apple, watermelon, banana", imh.replace("banana", "orange"));
// => 'orange, apple, watermelon, banana`

imh("banana, apple, watermelon, banana", imh.replace("banana", /orange/g));
// => 'orange, apple, watermelon, orange`
```

### upper()

```jsx
imh("Oop!!!", imh.upper());
// => OOP!!!
```

````
### lower()

```jsx
imh("Oop!!!", imh.lower());
// => oop!!!
````

## Misc

### add()

```jsx
imh(1, imh.add(9));
// => 10

imh(
  new Date(2000, 1, 1),
  img.add({
    years: 1,
    months: 1,
    days: 1,
    hours: 12,
    minutes: 12,
    seconds: 12,
    milliseconds: 900,
  })
);
// => 2001/02/02 12:12:12:900

imh(
  // unix timestamp
  new Date(2000, 1, 1).getTime(),
  img.add({
    years: 1,
    months: 1,
    days: 1,
    hours: 12,
    minutes: 12,
    seconds: 12,
    milliseconds: 900,
  })
);
// => unix timestamp
```

### toggle()

```jsx
imh({ completed: false }, imh.prop("completed", imh.toggle()));
// => { completed: true }
```

### val(value)

### result(callback)

Get result of last mutation. It is often used with splice() / pop() / shift()

```jsx
let state = {
  sourceList: ["item 1", "item 2"],
  destList: ["item 3", "item 4"],
};

function move(index, count) {
  state = imh(state, [
    // remove some from sourceList
    imh.prop("sourceList", imh.splice(index, count)),
    // append to destList
    imh.result((result) => imh.prop("destList", imh.push(...result))),
  ]);
}
```
