import {parse} from 'babylon';
import Immutable from 'immutable';


const fromJS = (js) => typeof js !== 'object' || js === null ? js :
  Array.isArray(js)
    ? Immutable.Seq(js).map(fromJS).toList()
    : Immutable.Seq(js).map(fromJS).toMap();

export default (obj) => {
  const root = parse('var obj = ' + (obj instanceof String ? obj : JSON.stringify(obj)))
    .program.body[0].declarations[0].init;
  return fromJS(root);
}