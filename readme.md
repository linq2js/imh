# imh (Immutable Helper)

The extreme fast immutable helper

## Installation

```
$ npm install --save imh
```

## Benchmarks

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

Hence, what I recommend (from top to bottom):

If you don't need immutability, well... just mutate in peace! I mean, in place
If you need a complete, well-tested, rock-solid library and don't mind using a non-native API for reads: use ImmutableJS
If you value using plain arrays/objects above other considerations, use **imh**
If your typical use cases involve much more reading than writing, use **imh** as well
If you do a lot of writes, updating items in long arrays or attributes in fat objects, use ImmutableJS

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
