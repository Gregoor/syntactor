import {parse as babylonParse} from 'babylon';
import Immutable from './proxy-immutable';

const fromJS = (js) => typeof js !== 'object' || js === null ? js :
  Array.isArray(js)
    ? Immutable.Seq(js).map(fromJS).toList()
    : Immutable.Seq(js).map(fromJS).toMap();

export default function parse(str) {
  return fromJS(babylonParse(str));
};

export function parseObject(obj) {
  return parse('var obj = ' + JSON.stringify(obj)).program.body[0].declarations[0].init
}