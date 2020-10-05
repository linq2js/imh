import imh from "./index";
import { List, Map, fromJS } from "immutable";

const performanceTestCount = 800;
const todos = {
  ids: [1],
  entities: {
    1: "todo 1",
  },
};

test("date.add(number)", () => {
  const original = new Date();
  const next = imh(original, imh.add(1));
  expect(next.getTime()).toBe(original.getTime() + 1);
});

test("date.add(timestamp)", () => {
  const original = new Date(1900, 1, 1);
  const next = imh(original, imh.add({ years: 2, days: 10 }));
  expect(next.getFullYear()).toBe(1902);
  expect(next.getDate()).toBe(11);
});

test("set(prop, value)", () => {
  const original = { title: "todo" };
  const next = imh(original, imh.prop("title", imh.val("new todo")));
  expect(next).toEqual({ title: "new todo" });
});

test("set(index, value)", () => {
  const original = [1, 2, 3];
  const next = imh(original, imh.prop(1, imh.val(3)));
  expect(next).toEqual([1, 3, 3]);
});

test("prop(name, value)", () => {
  const original = { title: "todo" };
  const next = imh(original, imh.prop("title", imh.val("new todo")));
  expect(next).toEqual({ title: "new todo" });
});

test("prop([p1, p2, p3], value)", () => {
  const original = { p1: { p2: { p3: "todo" } } };
  const next = imh(original, imh.prop(["p1", "p2", "p3"], imh.val("new todo")));
  expect(next).toEqual({ p1: { p2: { p3: "new todo" } } });
});

test("merge(original, original)", () => {
  const original = { a: 1, b: 2, c: 3 };
  const next = imh(original, imh.merge(original, original));
  expect(next).toBe(original);
});

test("merge(newProps)", () => {
  const original = { a: 1, b: 2, c: 3 };
  const next = imh(original, imh.merge({ d: 4 }));
  expect(next).toEqual({ a: 1, b: 2, c: 3, d: 4 });
});

test("reverse()", () => {
  const original = [1, 2, 3];
  const next = imh(original, imh.reverse());
  expect(next).toEqual([3, 2, 1]);
});

test("reverse(), reverse()", () => {
  const original = [1, 2, 3];
  // if we reverse array twice, it backs to original value
  const next = imh(original, [imh.reverse(), imh.reverse()]);
  expect(next).toBe(original);
});

test("add todo", () => {
  const counter = modelCounter();
  const next = imh(todos, [
    imh.prop("ids", imh.push(2, 3)),
    counter.inject(),
    imh.prop(
      "entities",
      imh.merge({
        2: "todo 2",
        3: "todo 3",
      })
    ),
    counter.inject(),
  ]);
  expect(next).toEqual({
    ids: [1, 2, 3],
    entities: {
      1: "todo 1",
      2: "todo 2",
      3: "todo 3",
    },
  });
  expect(counter.count).toBe(1);
});

test("immutablejs performance", () => {
  let next = todos;

  for (let i = 0; i < performanceTestCount; i++) {
    let imTodos = fromJS(next);
    imTodos = imTodos.set("ids", imTodos.get("ids").push(i));
    imTodos = imTodos.set(
      "entities",
      imTodos.get("entities").set(i, "todo " + i)
    );
    next = imTodos.toJS();
  }
});

test("imh performance 1", () => {
  const mutations = [];
  for (let i = 0; i < performanceTestCount; i++) {
    mutations.push(imh.prop("ids", imh.push(i)));
    mutations.push(imh.prop("entities", imh.set(i, "todo " + i)));
  }
  const next = imh(todos, mutations);
});

test("imh performance 2", () => {
  const mutations = [];
  const half = performanceTestCount / 2;
  let next = todos;
  for (let i = 0; i < half; i++) {
    mutations.push(imh.prop("ids", imh.push(i)));
    mutations.push(imh.prop("entities", imh.set(i, "todo " + i)));
  }
  next = imh(next, mutations);

  mutations.length = 0;
  for (let i = half; i < performanceTestCount; i++) {
    mutations.push(imh.prop("ids", imh.push(i)));
    mutations.push(imh.prop("entities", imh.set(i, "todo " + i)));
  }
  next = imh(next, mutations);
});

test("imh performance 3", () => {
  let next = todos;
  for (let i = 0; i < performanceTestCount; i++) {
    next = imh(next, [
      imh.prop("ids", imh.push(i)),
      imh.prop("entities", imh.set(i, "todo " + i)),
    ]);
  }
});

test("splice(index, length)", () => {
  const original = [1, 2, 3, 4];
  const next = imh(original, imh.splice(1, 2));
  expect(next).toEqual([1, 4]);
});

test("splice(index, length, ...newItems)", () => {
  const original = [1, 2, 3, 4];
  const next = imh(original, imh.splice(1, 2, 1, 1));
  expect(next).toEqual([1, 1, 1, 4]);
});

test("splice(index, length, ...newItems) no change", () => {
  const original = [1, 2, 3, 4];
  const next = imh(original, imh.splice(1, 2, 2, 3));
  expect(next).toBe(original);
});

test("result()", () => {
  let lastResult;
  const original = [1, 2, 3, 4];
  const next = imh(original, [
    imh.splice(1, 2, 2, 3),
    imh.result((result) => {
      lastResult = result;
    }),
  ]);
  expect(next).toBe(original);
  expect(lastResult).toEqual([2, 3]);
});

test("result() continue mutate", () => {
  const original = [1, 2, 3, 4];
  const next = imh(original, [
    imh.splice(1, 2, 2, 3),
    imh.result((result) => imh.push(...result)),
  ]);
  expect(next).toEqual([1, 2, 3, 4, 2, 3]);
});

test("prop(fn, value)", () => {
  const original = [
    { id: 1, title: "Todo 1", completed: false },
    { id: 2, title: "Todo 2", completed: false },
  ];

  const next = imh(
    original,
    imh.prop((todo) => todo.id === 1, imh.prop("completed", imh.toggle()))
  );

  expect(next).toEqual([
    { id: 1, title: "Todo 1", completed: true },
    { id: 2, title: "Todo 2", completed: false },
  ]);
});

test("temp", () => {
  let state = {
    todos: [{ id: 1, title: "Todo 1", completed: false }],
    stats: {
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
      imh.prop("todos", imh.push({ id, title, completed: false })),
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
  AddTodo(3, "Todo 3");
  ToggleTodo(3);

  // console.log(state);
});

function modelCounter() {
  let count = 0;
  return {
    get count() {
      return count;
    },
    inject() {
      return function (model) {
        if (typeof model === "object" && !model.__counted__) {
          Object.defineProperty(model, "__counted__", {
            value: true,
            enumerable: false,
          });
          count++;
        }
        return model;
      };
    },
  };
}
