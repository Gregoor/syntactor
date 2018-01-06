// @flow
import React from 'react';
import ReactDOM from 'react-dom';

import Editor from './components/editor';

export {Editor};

export function render(element: Element, props: Editor.propTypes) {
  if (typeof element === 'string') element = document.querySelector(element);
  return ReactDOM.render(<Editor {...props}/>, element);
}