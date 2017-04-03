import Immutable from 'immutable';

const times = (n, fn) => {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(fn(i));
  }
  return results;
};

export default Immutable.fromJS(
  times(5, (n) => [['properties', n, 'key'], ['properties', n, 'value']])
).flatten(true).toArray();
