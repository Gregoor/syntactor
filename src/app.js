// @flow
import React, {PureComponent} from 'react';
import * as Immutable from 'immutable';
import generate from 'babel-generator';

import type {ASTNode, ASTPath} from './types';
import {ArrayExpression, ObjectExpression} from './components/collections';
import Keymap from './components/keymap';
import {BooleanLiteral, NumericLiteral, NullLiteral, StringLiteral} from './components/literals';
import {
  isBooleanLiteral, isNumericLiteral, isArrayExpression, isObjectExpression, isEditable
} from './checks';
import example from '../package.json';
import navigate from './navigate';
import parse from './parse';
import renderTypeElement, {injectTypeElements} from './render-type-element';

const {List, Map} = Immutable;

const MAX_HISTORY_LENGTH = 100;

injectTypeElements({
  BooleanLiteral,
  NumericLiteral,
  NullLiteral,
  StringLiteral,
  ArrayExpression,
  ObjectExpression
});

const BooleanNode = new Map({type: 'BooleanLiteral', value: true});
const NumericNode = new Map({type: 'NumericLiteral', value: '0'});
const NullNode = new Map({type: 'NullLiteral'});
const StringNode = new Map({type: 'StringLiteral', value: ''});
const ArrayNode = Immutable.fromJS({type: 'ArrayExpression', elements: []});
const ObjectNode = Immutable.fromJS({type: 'ObjectExpression', properties: []});

const links = [
  ['Reasoning', 'https://medium.com/@grgtwt/code-is-not-just-text-1082981ae27f'],
  ['Roadmap', 'https://github.com/Gregoor/syntactor#roadmap'],
  ['GitHub', 'https://github.com/gregoor/syntactor'],
  ['Issues', 'https://github.com/Gregoor/syntactor/issues']
];

const cardStyle = {
  padding: 20,
  background: 'white',
  boxShadow: '0 2px 2px 0 rgba(0,0,0,.14), 0 3px 1px -2px rgba(0,0,0,.2), 0 1px 5px 0 rgba(0,0,0,.12)'
};

export default class App extends PureComponent {

  state = {
    future: new List(),
    history: new List([
      new Map({
        inputMode: false,
        root: parse(example),
        selected: new List()
      })
    ])
  };

  componentDidMount() {
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('cut', this.handleCut);
    document.addEventListener('paste', this.handlePaste);
  }

  componentWillUnmount() {
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('cut', this.handleCut);
    document.removeEventListener('paste', this.handlePaste);
  }

  getSelectedNode() {
    const editorState = this.state.history.first();
    return editorState.get('root').getIn(editorState.get('selected'));
  }

  getClosestCollectionPath(root: ASTNode, selected: ASTPath) {
    const selectedNode = root.getIn(selected);

    if (selectedNode) {
      if (isObjectExpression(selectedNode)) {
        return selected.push('properties');
      } else if (isArrayExpression(selectedNode)) {
        return selected.push('elements');
      }
    }

    const index = selected.findLastIndex((key) => ['elements', 'properties'].includes(key));
    return selected.slice(0, index + 1);
  }

  getDirection(key: string) {
    switch (key) {

      case 'ArrowUp':
        return 'UP';

      case 'ArrowDown':
        return 'DOWN';

      case 'ArrowLeft':
        return 'LEFT';

      case 'ArrowRight':
        return 'RIGHT';

      default:
        return;

    }
  }

  addToHistory(updateFn: (root: ASTNode, selected: ASTPath) => any) {
    this.setState(({history}) => {
      const editorState = history.first();
      const root = editorState.get('root');
      const selected = editorState.get('selected');
      const inputMode = editorState.get('inputMode');
      return {
        future: new List(),
        history: history.unshift(new Map({
          inputMode, root, selected,
          ...updateFn(root, selected, inputMode)
        })).slice(0, MAX_HISTORY_LENGTH)
      };
    });
  }

  updateValue(updateFn: (any) => any) {
    this.addToHistory((root, selected) => ({
      root: root.updateIn(selected.push('value'), updateFn)
    }));
  }

  insert = (node: ASTNode) => this.addToHistory((root, selected) => {
    const collectionPath = this.getClosestCollectionPath(root, selected);
    const itemIndex = selected.last() === 'end'
      ? collectionPath.size
      : selected.get(collectionPath.size) + 1 || 0;

    const isArray = isArrayExpression(root.getIn(collectionPath.slice(0, -1)));

    const newRoot = root.updateIn(collectionPath, (list) => list.insert(
      itemIndex,
      isArray
        ? node
        : new Map({type: 'ObjectProperty', key: StringNode, value: node})
    ));
    const newSelected = isArray
      ? collectionPath.push(itemIndex)
      : collectionPath.push(itemIndex, 'key');
    return {
      inputMode: !isArray || isEditable(newRoot.getIn(newSelected)),
      root: newRoot,
      selected: newSelected
    };
  });

  deleteSelected() {
    return this.addToHistory((root, selected) => {
      const newRoot = root.deleteIn(
        selected.slice(0, 1 + selected.findLastIndex((value) => typeof value === 'number'))
      );
      const isRootDelete = selected.isEmpty() || (selected.size === 2 && selected.last() === 'end');
      return {
        root: isRootDelete ? NullNode : newRoot,
        selected: isRootDelete || selected.last() === 'end'
          ? new List()
          : navigate('DOWN', newRoot, navigate('UP', root, selected))
      };
    });
  }

  goToEditable(direction: 'LEFT' | 'RIGHT') {
    return this.addToHistory((root, selected) => {
      let visitedPaths = new List();
      let lastEditablePath = selected;
      let newSelectedNode;
      let newlySelectedIsEditable;
      do {
        selected = navigate(direction, root, selected);
        if (visitedPaths.includes(selected)) {
          return {selected: lastEditablePath};
        }
        visitedPaths = visitedPaths.push(selected);
        newSelectedNode = root.getIn(selected);
        newlySelectedIsEditable = newSelectedNode && isEditable(newSelectedNode);
        if (newlySelectedIsEditable) {
          lastEditablePath = selected;
        }
      } while (!newlySelectedIsEditable);
      return {selected: lastEditablePath};
    });
  }

  undo() {
    this.setState(({future, history}) => ({
      future: future.unshift(history.first()),
      history: history.size > 1 ? history.shift() : history
    }));
  }

  redo() {
    this.setState(({future, history}) => ({
      future: future.shift(),
      history: future.isEmpty() ? history : history.unshift(future.first())
    }));
  }

  handleCopy = (event: any) => {
    if (this.state.history.first().get('inputMode')) {
      return;
    }

    const editorState = this.state.history.first();
    let selected = editorState.get('selected');
    if (selected.last() === 'end') {
      selected = selected.slice(0, -2);
    }
    event.clipboardData.setData('text/plain',
      generate(editorState.get('root').getIn(selected).toJS()).code
    );
    event.preventDefault();
  };

  handleCut = (event: any) => {
    if (this.state.history.first().get('inputMode')) {
      return;
    }
    this.handleCopy(event);
    this.deleteSelected();
  };

  handlePaste = (event: any) => {
    if (this.state.history.first().get('inputMode')) {
      return;
    }
    const clipboardStr = event.clipboardData.getData('text/plain');
    let data;
    try {
      data = JSON.parse(clipboardStr);
    } catch (e) {
      console.error(e);
      return;
    }
    event.preventDefault();
    this.insert(parse(data));
  };

  handleKeyDown = (event: any) => {
    const {ctrlKey, key} = event;

    const direction = this.getDirection(key);

    const editorState = this.state.history.first();
    if (!editorState.get('inputMode')) {

      if (direction) {
        event.preventDefault();
        return this.addToHistory((root, selected) => ({
          selected: navigate(direction, root, selected)
        }));
      }

      const selectedNode = this.getSelectedNode();

      switch (key) {

        case 's':
        case '\'':
          event.preventDefault();
          return this.insert(StringNode);

        case 'n':
          event.preventDefault();
          return this.insert(NumericNode);

        case 'b':
          event.preventDefault();
          return this.insert(BooleanNode);

        case 'a':
        case '[':
          event.preventDefault();
          return this.insert(ArrayNode);

        case 'o':
        case '{':
          event.preventDefault();
          return this.insert(ObjectNode);

        case '.':
          event.preventDefault();
          return this.insert(NullNode);

        case '+':
        case '-':
          return isNumericLiteral(selectedNode) && this.updateValue(
            (value) => value + (key === '+' ? 1 : -1)
          );

        case 't':
        case 'f':
          return isBooleanLiteral(selectedNode) && this.updateValue(
            () => Boolean(key === 't')
          );

        case 'Delete':
          return this.deleteSelected();

        case 'Enter':
          event.preventDefault();
          return isEditable(selectedNode) && this.addToHistory(() => ({inputMode: true}));

        default:

      }
    }

    if (['UP', 'DOWN'].includes(direction)) {
      return this.addToHistory((root, selected) => ({
        inputMode: false,
        selected: navigate(direction, root, selected)
      }));
    }

    if (ctrlKey && key.toLowerCase() === 'z') {
      event.preventDefault();
      return key === 'z' ? this.undo() : this.redo();
    }

    if (['Enter', 'Escape'].includes(key)) {
      this.addToHistory((root, selected) => ({
        inputMode: false,
        root: root.getIn(selected.push('type')) === 'NumericLiteral'
          ? root.updateIn(selected.push('value'), (value) => parseFloat(value))
          : root
      }));
    }

    if (key === 'Tab') {
      event.preventDefault();
      return this.goToEditable(event.shiftKey ? 'LEFT' : 'RIGHT');
    }
  };

  handleChange = ({target: {value}}: any) => {
    this.addToHistory((root, selected, inputMode) => inputMode ? {
      root: root.setIn(selected.push('value'), value)
    } : {});
  };

  render() {
    const {history} = this.state;
    const editorState = history.first();
    const inputMode = editorState.get('inputMode');
    const selected = editorState.get('selected');
    const isInArray = (selected.last() === 'end' ? selected.slice(0, -2) : selected)
        .findLast((key) => ['elements', 'properties'].includes(key)) === 'elements';
    return (
      <div style={{whiteSpace: 'pre', outline: 'none'}}
           ref={(div) => div && !inputMode && div.focus()}
           tabIndex="0" onKeyDown={this.handleKeyDown}>
        <div style={{maxWidth: 800, margin: '0 auto'}}>
          <h1>Syntactor</h1>

          <div style={{marginBottom: 10, ...cardStyle}}>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              |
              {links.map(([label, link], i) => [
                <a key={label} href={link}>{label}</a>,
                '|'
              ])}
            </div>
            <div style={{marginTop: 20, whiteSpace: 'pre-line'}}>
              An editor with two basic goals:
              <ol>
                <li>Manage syntax and code style (no syntax errors, no bikeshedding)</li>
                <li>At least as fast at making changes as regular editors</li>
              </ol>
              For now, it's only a JSON editor.
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'row'}}>
            <form onChange={this.handleChange} style={{height: '100%', width: '100%', ...cardStyle}}>
              {renderTypeElement(editorState.get('root'), {inputMode, level: 0, selected})}
            </form>
            <div style={{marginLeft: 10, minWidth: 270, height: '100%', ...cardStyle}}>
              <Keymap {...{inputMode, isInArray}} selectedNode={this.getSelectedNode()}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

}