const times = (n, fn) => {
  const results = [];
  for (let i = 0; i < 4; i++) {
    results.push(fn(i));
  }
  return results;
};

export default times(5, (n) => ['properties', n, 'key']);
