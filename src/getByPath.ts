export type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type ArrayKey = number;

type IsTuple<T extends readonly any[]> = number extends T['length'] ? false : true;

type TupleKeys<T extends readonly any[]> = Exclude<keyof T, keyof any[]>;

export type PathConcat<TKey extends string | number, TValue> = TValue extends Primitive
  ? `${TKey}`
  : `${TKey}` | `${TKey}.${Path<TValue>}`;

export type Path<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: PathConcat<K & string, T[K]>;
      }[TupleKeys<T>]
    : PathConcat<ArrayKey, V>
  : {
      [K in keyof T]-?: PathConcat<K & string, T[K]>;
    }[keyof T];

type ArrayPathConcat<TKey extends string | number, TValue> = TValue extends Primitive
  ? never
  : TValue extends readonly (infer U)[]
  ? U extends Primitive
    ? never
    : `${TKey}` | `${TKey}.${ArrayPath<TValue>}`
  : `${TKey}.${ArrayPath<TValue>}`;

export type ArrayPath<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: ArrayPathConcat<K & string, T[K]>;
      }[TupleKeys<T>]
    : ArrayPathConcat<ArrayKey, V>
  : {
      [K in keyof T]-?: ArrayPathConcat<K & string, T[K]>;
    }[keyof T];

export type PathValue<T, TPath extends Path<T> | ArrayPath<T>> = T extends any
  ? TPath extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? R extends Path<T[K]>
        ? undefined extends T[K] ? PathValue<T[K], R> | undefined : PathValue<T[K], R>
        : never
      : K extends `${ArrayKey}`
      ? T extends readonly (infer V)[]
        ? PathValue<V, R & Path<V>>
        : never
      : never
    : TPath extends keyof T
      ? T[TPath]
      : TPath extends `${ArrayKey}`
        ? T extends readonly (infer V)[]
          ? V
          : never
        : never
  : never;

export function getByPath<T extends Record<string, any>, TPath extends Path<T>>(
  obj: T,
  path: TPath,
): PathValue<T, TPath> {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) as PathValue<T, TPath>;
}

// ⬆️ code from 'dot-value-path' repo ---------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// ⬇️ code I'm working on to support array path notation (like in Remeda) ----------

export type PathPush<TKey extends string | number, TValue> = TValue extends Primitive
  ? [TKey]
  : [TKey] | [TKey, ...PathsAsArr<TValue>];

export type PathsAsArr<T> = T extends readonly (infer V)[]
? IsTuple<T> extends true
  ? {
      [K in TupleKeys<T>]-?: PathPush<K & string, T[K]>;
    }[TupleKeys<T>]
  : PathPush<ArrayKey, V>
: {} extends T
  ? never
  : {
      [K in keyof T]-?: PathPush<K & string, T[K]>;
    }[keyof T];

export type TypeFromPath<T extends Record<string, any>, TPath extends PathsAsArr<T>> = TPath extends [infer K, ...infer R]
    ? K extends keyof T
      ? 0 extends R['length']
        ? T[K]
        : R extends PathsAsArr<T[K]>
          ? undefined extends T[K] ? TypeFromPath<T[K], R> | undefined : TypeFromPath<T[K], R>
          : never
      : never
    : never

type Test1 = Path<{a: '1', b: '2'}>
//    ^?
type Test2 = PathsAsArr<{a: '1', b: '2'}>
//    ^?

type Concat<T> = T extends Array<string | number> & [infer A, ...infer Rest]
  ? A extends string | number
    ? T['length'] extends 1
      ? `${A}`
      : `${A}.${Concat<Rest>}`
    : never
  : never;

type ConcatenatedPath = Concat<['a', 'b']>
//    ^?

export function getByPathArr<T extends Record<string, any>, TPath extends PathsAsArr<T>>(
  obj: T,
  path: TPath,
): TypeFromPath<T, TPath> {
  return (path as any[]).reduce((acc, key) => acc?.[key], obj) as TypeFromPath<T, TPath>;
}

type Meehhh = PathsAsArr<{a: {'b': 'c'}, 'ok': {'nope': {'meh': 'sisi', 'fff': '1' }}}>
//    ^?

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// ⬇️ usage sandbox ---------------------------------------------------------------

const obj = {
  a: {
    abon: {},
    b: {
      c: 'coucou' as const,
      d: 123
    }
  }
};

const play_with_me1 = getByPath(obj, "a.b");
//    ^?
type Play1 = typeof play_with_me1;


const play_with_me2 = getByPathArr(obj, ["a", "b"]) 
//    ^?
type Play2 = typeof play_with_me2;
