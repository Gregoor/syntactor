// @flow
import React, {PureComponent} from 'react';
import * as Immutable from 'immutable';
import clipboard from 'clipboard-js';
import generate from 'babel-generator';

import type {ASTNode, ASTPath} from './types';
import {ArrayExpression, ObjectExpression} from './components/collections';
import Keymap from './components/keymap';
import {BooleanLiteral, NumericLiteral, StringLiteral} from './components/literals';
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
  StringLiteral,
  ArrayExpression,
  ObjectExpression
});

const BooleanNode = new Map({type: 'BooleanLiteral', value: true});
const NumericNode = new Map({type: 'NumericLiteral', value: '0'});
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

      case 'k':
      case 'ArrowUp':
        return 'UP';

      case 'j':
      case 'ArrowDown':
        return 'DOWN';

      case 'h':
      case 'ArrowLeft':
        return 'LEFT';

      case 'l':
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
    const itemIndex = selected.get(collectionPath.size) + 1 || 0;

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

  handleKeyDown = (event: any) => {
    const {ctrlKey, key} = event;

    const direction = this.getDirection(key);

    const editorState = this.state.history.first();
    if (!editorState.get('inputMode')) {

      if (direction) {
        return this.addToHistory((root, selected) => ({
          selected: navigate(direction, root, selected)
        }));
      }

      const selectedNode = this.getSelectedNode();

      switch (key) {

        case 's':
        case '\'':
          return this.insert(StringNode);

        case 'n':
          return this.insert(NumericNode);

        case 'b':
          return this.insert(BooleanNode);

        case 'a':
        case '[':
          return this.insert(ArrayNode);

        case 'o':
        case '{':
          return this.insert(ObjectNode);

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

        case 'd':
        case 'Delete':
          return this.addToHistory((root, selected) => ({
            root: root.deleteIn(
              selected.slice(0, 1 + selected.findLastIndex((value) => typeof value === 'number'))
            ),
            selected: selected.last() === 'end' ? new List() : navigate('UP', root, selected)
          }));

        case 'i':
        case 'Enter':
          return isEditable(selectedNode) && this.addToHistory(() => ({inputMode: true}));

        default:

      }

      if (ctrlKey && key === 'c') {
        event.preventDefault();
        let selected = editorState.get('selected');
        if (selected.last() === 'end') {
          selected = selected.slice(0, -2);
        }
        console.log(selected.toJS());
        return clipboard.copy(
          generate(editorState.get('root').getIn(selected).toJS()).code
        );
      }
    }

    if (ctrlKey && key.toLowerCase() === 'z') {
      event.preventDefault();
      return this.setState(({future, history}) => key === 'z'
        ? {
          future: future.unshift(history.first()),
          history: history.shift()
        }
        : {
          future: future.shift(),
          history: future.isEmpty() ? history : history.unshift(future.first())
        }
      );
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