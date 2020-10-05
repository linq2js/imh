import imh from "./index";

const array = [1, 2, 3];

imh(array, [
  imh.push("aaa", 1),
  imh.push("aaa", 1),
  imh.push("aaa", 1),
  imh.push("aaa", 1),
  imh.map((value, data) => value * 2 * data.index),
]);
