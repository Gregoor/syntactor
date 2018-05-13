import React from 'react';
import ReactDOM from 'react-dom';

import { render } from './api';
import Demo from './components/demo';

const demoElement = document.getElementById('insert-syntactor-demo-here');
if (demoElement) {
  ReactDOM.render(<Demo />, demoElement);
} else {
  window.Syntactor = { render: render };
}
