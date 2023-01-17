import './style.css'

import _, { LodashRest } from 'lodash/fp';
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
  strRand: isUnexpectedValue ? null : 'something',
  arrNumber: [101, 102, 103, 104],
  arrRand: isUnexpectedValue ? ['a', 'b', 'c'] : [1, 2, 3],
});

const obj = createObj(); // null; // use this "null" to see how different libs handle it (hint: zod might help us with libs other than lodash)

console.table(obj)

const loObj = _.clone(obj);
const reObj = Re.clone(obj);
const rbObj = Rb.clone(obj);

console.log('--------------- get ---------------');
console.log("vanilla 'get': ", obj?.strRand);

const loRes = _.get('strRand')(loObj);
// remeda Data-last (js)
const reResJs = Re.pathOr(['strRand'], undefined)(reObj); // does not use 'null', and uses fallback value instead
// remeda Data-first (ts)
const reResTs = Re.pathOr(reObj, ['strRand'], undefined); // does not use 'null', and uses fallback value instead
const rbRes = Rb.path(['strRand'])(rbObj); // null becomes undefined

logLibrariesResults([loRes, reResJs, reResTs, rbRes])

console.log('--------------- filter ---------------');

// const loFilterRes = _.filter(n => (n % 2 === 0))(loObj); // gets output type correctly only because _.toString
// const reFilterResJs = Re.createPipe(Re.filter(n => (n % 2 === 0)), Re.map(n => n.toString()))(reObj?.arrNumber);
// const reFilterResTs = Re.pipe(reObj?.arrNumber, Re.filter(n => (n % 2 === 0)), Re.map(n => n.toString())); // gets n's type correctly + output type without a specific toString() function
// const rbFilterResTs = Rb.pipe(Rb.filter(n => n % 2 === 0), Rb.map(Rb.toString))(rbObj?.arrNumber); // gets output type correctly only because Rb.toString

// console.log("lodash/fp", loFilterRes);
// console.log("remeda data-last", reFilterResJs);
// console.log("remeda data-first", reFilterResTs);
// console.log("rambda", rbFilterResTs);

console.log('--------------- flow/pipe ---------------');

const loPipeRes = _.flow(_.get('arrNumber'), _.filter(n => (n % 2 === 0)), _.map(_.toString))(loObj); // gets output type correctly only because _.toString
const rePipeResJs = Re.createPipe(Re.filter(n => (n % 2 === 0)), Re.map(n => n.toString()))(reObj?.arrNumber);
const rePipeResTs = Re.pipe(reObj?.arrNumber, Re.filter(n => (n % 2 === 0)), Re.map(n => n.toString())); // gets n's type correctly + output type without a specific toString() function
const rbPipeResTs = Rb.pipe(Rb.filter(n => n % 2 === 0), Rb.map(Rb.toString))(rbObj?.arrNumber); // gets output type correctly only because Rb.toString

console.log('---');
console.log("lodash/fp", loPipeRes);
console.log("remeda data-last", rePipeResJs);
console.log("remeda data-first", rePipeResTs);
console.log("rambda", rbPipeResTs);

const isNumber = (x: any): x is number => typeof x === 'number';

const loRandPipeRes = _.flow(_.get('arrRand'), _.filter(_.isNumber), _.filter(n => (n % 2 === 0)))(loObj);
const reRandPipeResJs = Re.createPipe(Re.filter(Re.isNumber), Re.filter(n => (n % 2 === 0)), )(reObj?.arrRand);
const reRandPipeResTs1 = Re.pipe(reObj?.arrRand, Re.filter(Re.isNumber), Re.filter(n => (n % 2 === 0)));
const reIsNumber = (x: any): x is number => Re.isNumber(x) // needed this instead of Re.isNumber - maybe bc of nullable (see reRandPipeResTs1 vs reRandPipeResTs2)
const reRandPipeResTs2 = Re.pipe(reObj?.arrRand, Re.filter(reIsNumber), Re.filter(n => (n % 2 === 0)));
const rbRandPipeRes = Rb.pipe(Rb.filter(isNumber), Rb.filter(n => (n % 2 === 0)))(rbObj?.arrRand) // does not have Rambda.isNumber

console.log('---');
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
// - Somewhat support Typescript when data-first, but TBC (I got confused a few times, see reRandPipeResTs1/reRandPipeResTs2)
// - Not Typescript-friendly when data-last
// - NOT null-friendly (e.g. pathOr considers 'null' as not being a value, and uses the default instead (lodash keeps 'null' in this case))

// Rambda
// seems very similar to lodash/fp (except for the null-friendly part)

// Ramda
// ..

