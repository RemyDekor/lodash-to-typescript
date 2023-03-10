import _ from 'lodash/fp';
import * as Re from 'remeda';

// ^?  The extension using this syntax to display the types from the line above is called "vscode-twoslash-queries"

const isUnexpectedValue = Math.random() > 0.5;

const obj = {
  // strNullable: isUnexpectedValue ? null : 'something',
  // arrAsConst: ['a_const', 'b_const'] as const,
  arrNumber: [1, 2, 3, 4],
  arrNullable: isUnexpectedValue ? null : [1, 2, 3, 4],
  // arrRand: isUnexpectedValue ? ['a', 'b', 'c'] : [1, 2, 3, 4],
  nested: { foo: { bar: isUnexpectedValue ? null : { thingy: [{value: 42}] } } }
};

// ---------------------------------
// ---------------------------------
// ---------------------------------

/**
 * data-first
 * @example:
 * theFunction(data, functionParams);
 *
 * data-last 
 * @example:
 * theFunction(functionParams, data);
 * theFunction(functionParams)(data); // when curried
 */

// ---------------------------------

// In order to fit with the functional paradigm, lodash/fp is data-last
// and accepts both curried or uncurried syntax like so:

const lodash_get1 = _.get('arrNumber', obj);
//    ^? ✅
const lodash_get2 = _.get('arrNumber')(obj);
//    ^? ❌

// As we can see, the type is lost when using the curried version.
// That means that we lose all types going through a flow(..) 🛑 😱

const lodash_flow = _.flow(
//    ^? ❌                  
    _.get('arrNumber'),
    _.filter(n => n % 2 === 0)
    //            ^?
  )(obj);

  // lodash/fp has more unwanted behaviours for strict TypeScript code.
  // Here are a few examples:

// 1️⃣🛑 when accessing a nested property:

const vanilla_get_nested = obj.nested.foo;
//    ^? 
const lodash_get_nested1 = _.get('nested.foo', obj); // 🛑 string syntax cannot infer types when nested
//    ^? ❌
const lodash_get_nested2 = _.get(['nested', 'foo'], obj); // ✅ correct type, but we currently use the string path syntax in the codebase

// 2️⃣🛑 in case of a typo or accessing a non-existing field:

const vanilla_get_undefined_field = obj.asdf; // helpful error (even though the type is `any`)
//    ^?   
const lodash_get_undefined_field1 = _.get('asdf', obj); // 🛑 no error
//    ^? 
const lodash_get_undefined_field2 = _.get('?-!asdf_*', obj); // 🛑 still no error 😱
//    ^?

// 3️⃣🛑 when accessing the property of a nullable object:

const vanilla_get_nested_in_nullable1 = obj.nested.foo.bar.thingy; // helpful error
//    ^? 
const vanilla_get_nested_in_nullable2 = obj.nested.foo.bar?.thingy; // explicit about the fact `bar` may be null or undefined
//    ^?   
const lodash_get_nested_in_nullable1 = _.get('nested.foo.bar.thingy', obj); // 🛑 no clue what's wrong
//    ^? ❌
const lodash_get_nested_in_nullable2 = _.get(['nested','foo','bar','thingy'], obj); // 🛑 no clue what's wrong, even with the array path syntax
//    ^? ❌

// 4️⃣🛑  when filtering an object:

const vanilla_filter = obj.filter(n => Boolean(n)); // helpful error
//    ^? 
const lodash_filter = _.filter(n => Boolean(n), obj); // 🟠 treats the object as a collection (not explicit that it's not an array)
//    ^?

// 5️⃣🛑 set a property of an object to a value of unexpected type:

const { arrNumber: arrNumber1 } = _.set('arrNumber', 'something_else', obj); // 🛑 no error
//      ^?

// ---------------------------------

/*
  WIP: Lodash/fp Typescript replacements & Migration strategies:

- Simple 'get' logics: vanilla TS (dot notation) + RemedaJs's clone
  or custom function (see dot-path-value for example `getByPath` function that passes type)

- 'set' logics without shape transformation: immerJs (included in RTK,
  e.g. createNextState aka produce)

- Data/Shape transformations & misc. : RemedaJs + vanilla TS

*/

// ---------------------------------

// 🚀 Remeda to the rescue!
// Remeda.js is Typescript-first functional util library, with a similar scope to lodash.
// it enable both data-first and data-last syntax:

const re_filter1 = Re.filter(n => n % 2 === 0)(obj.arrNumber); // data-last is the curried syntax. It cannot infer the type properly, but it does not break JS code (helpful for soft migration)
//    ^?
const re_filter2 = Re.filter(obj.arrNumber, n => n % 2 === 0);
//    ^? ✅

// As you can see, data-last syntax is not capable of infering the types properly.
// But this is not an issue because Remeda is smart enough to do it when inside a pipe (i.e. flow):

const remeda_flow = Re.pipe(obj.arrNumber, Re.filter(n => n % 2 === 0));
//    ^? ✅

// Remeda enables us to use similar util functions with the proper Typescript linting and type infering:

const { arrNumber: arrNumber2 } = Re.set(obj, 'arrNumber', 'something_else'); // ✅ helpful error
//      ^?
const remeda_filter = Re.filter(obj, n => Boolean(n)); // ✅ long TS error, but still helpful


// The only case where we would need type annotation would be when creating a lazy pipe
// (expected input and output for the functions inside of it):
const remeda_lazy_flow = Re.createPipe<number[], number[]>(Re.filter(n => n % 2 === 0));
const remeda_lazy_flow_result = remeda_lazy_flow(obj.arrNumber);
//    ^?

// ---------------------------------

// 🟡 The most difficult difference to handle for the migration:
// functional util libraries are not as null-friendly as lodash/fp (not at all for most of them)
// Remeda is no exception

const lodash_filter_nullable = _.filter(n => n % 2 === 0, obj.arrNullable); // returns [] if obj.arrNullable is null

const remeda_filter_nullable1 = Re.filter(obj.arrNullable, n => n % 2 === 0); // 🛑 does not accept a value of type `number[] | null`
const remeda_filter_nullable2 = Re.filter(obj.arrNullable || [], n => n % 2 === 0); // 🟡 We have to be explicit about the fallback value if it's nullable

// 🤓 This would force us to be explicit about nullable values (and the non-nullable values!!),
// and could make the code more robust in the long run.

// ---------------------------------

/*
 Also see,
 Mapping of the functions of Remeda compared to Lodash and Ramda:
 https://github.com/remeda/remeda/blob/master/mapping.md
*/ 

/*
  Discuss:
  - Questions?
  - Migration strategies (WIP) 
*/
