// @flow
import React, {PureComponent} from 'react';
import * as Immutable from 'immutable';

import type {ASTNode} from './types';
import {ArrayExpression, ObjectExpression} from './components/collections';
import Keymap from './components/keymap';
import {BooleanLiteral, NumericLiteral, StringLiteral} from './components/literals';
import {
  isBooleanLiteral, isNumericLiteral, isArrayExpression, isObjectExpression, isEditable
} from './checks';
import example from './example.json';
import navigate from './navigate';
import parse from './parse';
import renderTypeElement, {injectTypeElements} from './render-type-element';

const {List, Map} = Immutable;

injectTypeElements({
  BooleanLiteral,
  NumericLiteral,
  StringLiteral,
  ArrayExpression,
  ObjectExpression
});

const BooleanNode = new Map({type: 'BooleanLiteral', value: true});
const NumericNode = new Map({type: 'NumericLiteral', value: ''});
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
    inputMode: false,
    root: parse(example),
    rootHistory: new List(),
    selected: new List()
  };

  getSelectedNode() {
    const {root, selected} = this.state;
    return root.getIn(selected);
  }

  getClosestCollectionPath() {
    const {selected} = this.state;
    const selectedNode = this.getSelectedNode();

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

  getDirection(key) {
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

    }
  }

  handleKeyDown = (event: any) => {
    const {inputMode, root, selected} = this.state;
    const {ctrlKey, key} = event;

    const direction = this.getDirection(key);

    if (!inputMode) {
      event.preventDefault();

      if (direction) {
        return this.setState(({root, selected}) => ({
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
          // TODO: history
          return isNumericLiteral(selectedNode) && this.setState({
              root: root.updateIn(selected.push('value'), (value) => value + (key === '+' ? 1 : -1))
            });

        case 't':
        case 'f':
          // TODO: history
          return isBooleanLiteral(selectedNode) && this.setState({
              root: root.setIn(selected.push('value'), Boolean(key === 't'))
            });

        case 'd':
        case 'Delete':
          // TODO: history
          return this.setState(({
            root: root.deleteIn(
              selected.slice(0, 1 + selected.findLastIndex((value) => typeof value === 'number'))
            ),
            selected: selected.last() === 'end' ? new List() : navigate('UP', root, selected)
          }));

        case 'i':
        case 'Enter':
          return isEditable(selectedNode) && this.setState(() => ({inputMode: true}));

        default:

      }
    }

    if (ctrlKey && key === 'z') {
      return this.setState(({root, rootHistory}) => ({
        root: rootHistory.last() || root,
        rootHistory: rootHistory.pop()
      }));
    }

    if (['Enter', 'Escape'].includes(key)) {
      return this.setState(({root, rootHistory, selected}) => {
        const newRoot = root.getIn(selected.push('type')) === 'NumericLiteral'
          ? root.updateIn(selected.push('value'), (value) => parseFloat(value))
          : root;
        return ({
          inputMode: false,
          root: newRoot,
          rootHistory: rootHistory.push(newRoot)
        });
      });
    }
  };

  handleChange = ({target: {value}}: any) => {
    if (this.state.inputMode) this.setState(({root, selected}) => {
      return {root: root.setIn(selected.push('value'), value)};
    });
  };

  insert = (node: ASTNode) => {
    const {root, selected} = this.state;
    const collectionPath = this.getClosestCollectionPath();
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
    this.setState({
      inputMode: !isArray || isEditable(newRoot.getIn(newSelected)),
      root: newRoot,
      selected: newSelected
    });
  };

  render() {
    const {inputMode, root, selected} = this.state;
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
              {renderTypeElement(root, {inputMode, level: 0, selected})}
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