import Immutable from 'immutable';

const accesor = new Proxy(Object.prototype, {
  get(target, property, receiver) {
    return receiver.get(property)
  }
});

// Workaround to monkey patch loaded immutable.js library, although it should be:
// Iterable.prototype = Object.create(accessor, {....})
Object.setPrototypeOf(Immutable.Iterable.prototype, accesor);

export default Immutable;
export * from 'immutable';