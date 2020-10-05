import { fromJS } from "immutable";
import timm from "timm";
import immutabilityHelper from "immutability-helper";
import updateImmutable from "update-immutable";
import immhelper from "immhelper";
import immer from "immer";
import imh from "./src/lib";

const testCases = 5000;
const mutationCount = 100;
const todos = {
  ids: [],
  entities: {},
};
const solutions = {
  imh() {
    let currentState;

    return {
      init(state) {
        currentState = state;
      },
      write(items) {
        const mutations = [
          imh.prop("ids", imh.push(...items.map((item) => item.id))),
        ];
        items.map((item) =>
          mutations.push(imh.prop(["entities", item.id], () => item))
        );
        currentState = imh(currentState, mutations);
      },
      read() {
        return currentState;
      },
    };
  },
  "immutable.js"() {
    let currentState;

    return {
      init(state) {
        currentState = fromJS(state);
      },
      write(items) {
        items.forEach((item) => {
          currentState = currentState.set(
            "ids",
            currentState.get("ids").push(item.id)
          );
          currentState = currentState.setIn(["entities", item.id], item);
        });
      },
      read() {
        return currentState.toJS();
      },
    };
  },
  timm() {
    let currentState;
    return {
      init(state) {
        currentState = state;
      },
      write(items) {
        items.forEach((item) => {
          currentState = timm.set(
            currentState,
            "ids",
            timm.addLast(currentState.ids, item.id)
          );
          currentState = timm.setIn(currentState, ["entities", item.id], item);
        });
      },
      read() {
        return currentState;
      },
    };
  },
  immer() {
    let currentState;

    return {
      init(state) {
        currentState = state;
      },
      write(items) {
        currentState = immer(currentState, (draft) => {
          items.forEach((item) => {
            draft.ids.push(item.id);
            draft.entities[item.id] = item;
          });
        });
      },
      read() {
        return currentState;
      },
    };
  },
  "immutability-helper"() {
    let currentState;
    return {
      init(state) {
        currentState = state;
      },
      write(items) {
        const specs = {
          ids: {
            $push: items.map((item) => item.id),
          },
          entities: {},
        };
        items.forEach((item) => {
          specs.entities[item.id] = { $set: item };
        });
        currentState = immutabilityHelper(currentState, specs);
      },
      read() {
        return currentState;
      },
    };
  },
  "update-immutable"() {
    let currentState;
    return {
      init(state) {
        currentState = state;
      },
      write(items) {
        const specs = {
          ids: {
            $push: items.map((item) => item.id),
          },
          entities: {},
        };
        items.forEach((item) => {
          specs.entities[item.id] = { $set: item };
        });
        currentState = updateImmutable(currentState, specs);
      },
      read() {
        return currentState;
      },
    };
  },
  immhelper() {
    let currentState;
    return {
      init(state) {
        currentState = state;
      },
      write(items) {
        const specs = {
          ids: ["push", ...items.map((item) => item.id)],
          entities: {},
        };
        items.forEach((item) => {
          specs.entities[item.id] = () => item;
        });
        currentState = immhelper(currentState, specs);
      },
      read() {
        return currentState;
      },
    };
  },
};

function runTest(cb) {
  const start = Date.now();
  cb();
  return Date.now() - start;
}

const testData = new Array(mutationCount)
  .fill(0)
  .map((_, index) => ({ id: index, title: "Todo " + index }));

Object.entries(solutions).forEach(([key, solution]) => {
  let writeMs = 0;
  let readMs = 0;
  let ok = false;
  const { init, write, read } = solution();
  for (let i = 0; i < testCases; i++) {
    init(todos);
    writeMs += runTest(() => {
      write(testData);
    });
    readMs += runTest(() => {
      const result = read();
      if (
        result.ids.length === testData.length &&
        result.entities[testData[0].id].id === testData[0].id &&
        result.entities[testData[testData.length - 1].id].id ===
          testData[testData.length - 1].id
      ) {
        ok = true;
      }
    });
  }
  console.log(key, "verified:", ok ? "passed" : "failed");
  console.log(
    `  Total elapsed: ${readMs} ms (read) + ${writeMs} ms (write) = ${
      readMs + writeMs
    } ms`
  );
});
