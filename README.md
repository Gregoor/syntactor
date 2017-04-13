# Syntactor

An editor with two basic goals:
1. Only allow valid code to be entered (no syntax errors)
2. At least as fast at making changes as regular editors

For now, it's only a JSON editor.

## Usage
In your commandline:
```bash
yarn add syntactor
#or
npm install syntactor --save
```
In your code:
```javascript
const Syntactor = require('syntactor');
Syntactor.render(document.querySelector('#container'), {
  initiallyShowKeymap: true,
  defaultValue: {answer: 42}
});
```

Or if you're using React (and ES2015):
```javascript
import {Editor} from 'syntactor';

const SomeComponent = () => (
  <div>
    <Editor initiallyShowKeymap defaultValue={{answer: 42}}/>
  </div>
);
```

### Props
These can be either passed as React props or as the 2nd argument into the `Syntactor.render` function.
<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default Value</th>
  </tr>
  <tr>
    <td>initiallyShowKeymap</td>
    <td>boolean</td>
    <td>`true`</td>
  </tr>
  <tr>
    <td>defaultValue</td>
    <td>JSON</td>
    <td>`{}`</td>
  </tr>
</table>

## Contributing/Running the demo page

First clone this repo, then:
```bash
yarn
```
And start it with
```bash
yarn start
```