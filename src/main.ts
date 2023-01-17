import './style.css'

import _ from 'lodash/fp';
import * as Re from 'remeda';
import * as Rb from 'rambda'; // minimal alternative of ramda (more complete version => rambdax)
// import * as R from 'ramda';

const logLibrariesResults = ([loRes, reResJs, reResTs, rbRes]: [unknown, unknown, unknown, unknown]) => {
  console.log("lodash/fp", loRes);
  console.log("remeda data-last", reResJs);
  console.log("remeda data-first", reResTs);
  console.log("rambda", rbRes);
}


const isUnexpectedValue = Math.random() > 0.5

const createObj = () => ({
  strNullable: isUnexpectedValue ? null : 'something',
  arrNumber: [1, 2, 3, 4],
  arrNullable: isUnexpectedValue ? null : [1, 2, 3, 4],
  arrRand: isUnexpectedValue ? ['a', 'b', 'c'] : [1, 2, 3, 4],
  nested: { foo: { bar: isUnexpectedValue ? null : { thingy: [42] } } }
});

const obj = createObj(); // null // use this "null" to see how different libs handle it (hint: zod might help us with libs other than lodash)
console.table(obj)

const loObj = _.clone(obj);
const reObj = Re.clone(obj);
const rbObj = Rb.clone(obj);

console.log('--------------- get a nullable ---------------');

const vanillaRes = obj?.strNullable; // ✅ knows the type, as expected
console.log("vanilla 'get': ", vanillaRes);
const loRes = _.get('strNullable')(loObj); // 🟠 does not know what type we are getting
const reResJs = Re.pathOr(['strNullable'], undefined)(reObj); // 🟠 does not use 'null', and uses fallback value instead 🟠 not usable in TS 
const reResTs = Re.pathOr(reObj, ['strNullable'], undefined); // 🟠 does not use 'null', and uses fallback value instead, stops screaming if fallback is an actual value (e.g. 'abc')
const rbRes = Rb.path(['strNullable'])(rbObj); // 🟠 null becomes undefined

logLibrariesResults([loRes, reResJs, reResTs, rbRes])

console.log('--------------- set ---------------');

const loSetRes = _.set('strNullable', 'an other thing')(loObj); // ✅ keeps the output's type
const reSetResJs = Re.set('strNullable', 'an other thing')(reObj); // 🟠 works fine in JS, but TS is yelling at us + 🟠 loses the output's type
const reSetResTs = Re.set(reObj, 'strNullable', 'an other thing'); // ✅ keeps the output's type
const rbSetRes = Rb.set(Rb.lensProp('strNullable'), 'an other thing')(rbObj); // 🟠 awkward lens syntax, ✅ but keeps the output's type

logLibrariesResults([loSetRes, reSetResJs, reSetResTs, rbSetRes])

console.log('--------------- filter array ---------------');

const loFilterRes = _.filter(n => (n % 2 === 0))(_.get('arrNumber', loObj));  // 🟠 can NOT infer n's type 🟠 neither output type (unknown[])
const reFilterResJs = Re.filter(n => (n % 2 === 0))(reObj.arrNumber); // 🟠 can NOT infer n's type 🟠 neither output type (unknown[])
const reFilterResTs = Re.filter(reObj.arrNumber, n => (n % 2 === 0)); // ✅ can infer n's type + ✅ output type (number[])
const rbFilterRes = Rb.filter(n => n % 2 === 0)(rbObj.arrNumber); //🟠 can NOT infer n's type 🟠 neither output type (unknown[])

logLibrariesResults([loFilterRes, reFilterResJs, reFilterResTs, rbFilterRes]);

console.log('--------------- filter a nullable array ---------------');

const isEven = (n: number): boolean => n % 2 === 0

const loFilterNullableRes = _.filter(isEven)(_.get('arrNullable', loObj));  // ✅ 👻 Accepts `null` (outputs `[]`)
const reFilterNullableResJs = Re.filter(isEven)(reObj?.arrNullable || []); // 🟠 Does not accept nullable, warns with Typescript
const reFilterNullableResTs = Re.filter(reObj?.arrNullable || [], isEven); // 🟠 Does not accept nullable, warns with Typescript
const rbFilterNullableRes = Rb.filter(isEven)(rbObj?.arrNullable || []); // 🟠 Does not accept nullable, warns with Typescript

logLibrariesResults([loFilterNullableRes, reFilterNullableResJs, reFilterNullableResTs, rbFilterNullableRes]);

console.log('--------------- flow/pipe ---------------');

const isNumber = (x: any): x is number => typeof x === 'number';

const loRandPipeRes = _.flow(_.get('arrRand'), _.filter(_.isNumber), _.filter(n => (n % 2 === 0)))(loObj);
const reRandPipeResJs = Re.createPipe(Re.filter(Re.isNumber), Re.filter(n => (n % 2 === 0)), )(reObj?.arrRand);
const reRandPipeResTs1 = Re.pipe(reObj?.arrRand, Re.filter(Re.isNumber), Re.filter(n => (n % 2 === 0))); // not sure why TS is unhappy (something about output == never[])
const reRandPipeResTs2 = Re.pipe(reObj?.arrRand, Re.filter(isNumber), Re.filter(n => (n % 2 === 0))); // not sure why using custom isNumber instead of Re.isNumber fixes it
const rbRandPipeRes = Rb.pipe(Rb.filter(isNumber), Rb.filter(n => (n % 2 === 0)))(rbObj?.arrRand) // Rambda does not have isNumber

console.log("lodash/fp", loRandPipeRes);
console.log("remeda data-last", reRandPipeResJs);
console.log("remeda data-first 1", reRandPipeResTs1);
console.log("remeda data-first 2", reRandPipeResTs2);
console.log("rambda", rbRandPipeRes);

// things to consider:
// - behaviours around 'null' and undefined values
// - how well the types are infered at the output
// - syntax: how easy/similar to what we already have is it
// - how functional it is

// Lodash/fp:
// - NOT Typescript friendly (=> outputs often have 'any'/'unknown' type)

// Remeda:
// - Doc says it infers types from the data => but only if data-first
// - Supports Typescript when data-first (a few edge-cases can be confusing, but it seems like it does)
// - Typescript yells at us when data-last (almost always)
// - NOT null-friendly (e.g. pathOr considers 'null' as not being a value, and uses the default instead (lodash keeps 'null' in this case))


// Rambda
// seems very similar to lodash/fp (except for the null-friendly part)

// Ramda
// ..

