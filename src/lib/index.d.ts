export interface MutationContext {
  root: any;
  clone<T>(value: T, isArray?: boolean): T;
}

export type Mutation<TModel = any, TData = any> = (
  model: TModel,
  data?: TData,
  context?: MutationContext
) => TModel | Mutation<TModel, TData> | Mutation<TModel, TData>[];

export type Push = (...items: any[]) => Mutation;

export type Prop = (
  key:
    | string
    | number
    | ((item: any, index?: number) => boolean)
    | (string | number | ((item: any, index?: number) => boolean))[],
  mutations: Mutation | Mutation[]
) => Mutation;

export interface ArrayData {
  index: number;
  array: any[];
}

export type Map = (
  mutations: Mutation<any, ArrayData> | Mutation<any, ArrayData>[]
) => Mutation;

export type Unset = (...keys: (string | number)[]) => Mutation;

export type Set = (key: string | number, value: any) => Mutation;

export type Merge = (...values: {}[]) => Mutation;

export type Splice = (
  index: number,
  length: number,
  ...items: any[]
) => Mutation;

export type Filter = (
  predicate: (item: any, index?: number) => boolean
) => Mutation;

export type Sort = (compareFn: (a?: any, b?: any) => number) => Mutation;

export type OrderBy = (
  selector: (item?: any) => any,
  direction?: Descending | Ascending
) => Mutation;

export type Descending = -1;
export type Ascending = 1;

export type Swap = (from: number, to: number) => Mutation;

export type Remove = (...indices: number[]) => Mutation;

export type Toggle = (...keys: any[]) => Mutation;

export type Val = (value: any) => Mutation;

export type Def = (value: any) => Mutation;

export type Clear = () => Mutation;

export interface Timespan {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

export interface Add extends Function {
  (value: number | string | Timespan): Mutation;
}

export type Mul = (value: number) => Mutation;

export type Div = (value: number) => Mutation;

export type Pop = () => Mutation;
export type Shift = () => Mutation;
export type Reverse = () => Mutation;
export type Result = (
  fn: (result: any, model?: any) => Mutation | Mutation[] | void
) => Mutation;
export type Unshift = (...items: any[]) => Mutation;

export type Replace = (findWhat: string, replaceWith: any) => Mutation;
export type Upper = () => Mutation;
export type Lower = () => Mutation;

export interface DefaultExports extends Function {
  <TModel>(model: TModel, mutations: Mutation | Mutation[]): TModel;
  push: Push;
  prop: Prop;
  map: Map;
  unset: Unset;
  merge: Merge;

  splice: Splice;
  filter: Filter;
  sort: Sort;
  orderBy: OrderBy;
  swap: Swap;
  remove: Remove;
  add: Add;
  toggle: Toggle;
  val: Val;
  clear: Clear;

  pop: Pop;
  shift: Shift;
  unshift: Unshift;
  reverse: Reverse;
  result: Result;

  set: Set;

  replace: Replace;
  lower: Lower;
  upper: Upper;

  mul: Mul;
  div: Div;
  def: Def;
}

declare const imh: DefaultExports;
export default imh;
export const splice: Splice;
export const filter: Filter;
export const sort: Sort;
export const orderBy: OrderBy;
export const swap: Swap;
export const remove: Remove;
export const add: Add;
export const push: Push;
export const prop: Prop;
export const map: Map;
export const unset: Unset;
export const merge: Merge;
export const toggle: Toggle;
export const val: Val;
export const def: Def;
export const clear: Clear;
export const pop: Pop;
export const shift: Shift;
export const unshift: Unshift;
export const reverse: Reverse;
export const result: Result;
export const mul: Mul;
export const div: Div;
export const set: Set;
export const upper: Upper;
export const lower: Lower;
export const replace: Replace;
