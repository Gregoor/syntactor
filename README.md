[![Build Status](https://travis-ci.org/Gregoor/syntactor.svg?branch=master)](https://travis-ci.org/Gregoor/syntactor)

# Syntactor
An editor with two basic goals:
1. Only allow valid code to be entered (no syntax errors)
2. Common code transformations in just as many or less keystrokes, compared to other editors

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

Name | Type | Default Value
---|---|---|
initiallyShowKeymap | boolean | `true`
defaultValue | JSON | `{}`

## Contributing/Running the demo page

First clone this repo, then:
```bash
yarn
```
And start it with
```bash
yarn start
```
