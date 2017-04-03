// @flow
import React, {PureComponent} from 'react';
import * as Immutable from 'immutable';

import type {ASTNode} from './types';
import {ArrayExpression, ObjectExpression} from './components/collections';
import {BooleanLiteral, NumericLiteral, StringLiteral} from './components/literals';
import renderTypeElement, {injectTypeElements} from './render-type-element';
import navigate from './navigate';
import parse from './parse';
import example from './example.json';

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

const isBooleanLiteral = (node) => node.get('type') === 'BooleanLiteral';
const isNumericLiteral = (node) => node.get('type') === 'NumericLiteral';
const isStringLiteral = (node) => node.get('type') === 'StringLiteral';
const isArrayExpression = (node) => node.get('type') === 'ArrayExpression';
const isObjectExpression = (node) => node.get('type') === 'ObjectExpression';

const isEditable = (node: ASTNode) => isStringLiteral(node) || isNumericLiteral(node);

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

class KeyInfo extends PureComponent {

  render() {
    const {children, keys} = this.props;
    return (
      <div>
        <span style={{display: 'inline-block', width: 100}}>
          {keys.map((key, i) => [
            <kbd style={{fontWeight: 'bold'}}>{key}</kbd>,
            i + 1 < keys.length ? ' | ' : ''
          ])}
        </span>
        <span>{children}</span>
      </div>
    )
  }

}

const KeySection = ({children, title}) => (
  <div style={{marginBottom: 20}}>
    <h3 style={{textAlign: 'center', margin: 0}}>{title}</h3>
    <hr/>
    {children}
  </div>
);

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

  handleKeyDown = (event: any) => {
    const {inputMode, root, selected} = this.state;
    const {ctrlKey, key} = event;

    const direction = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT'
    }[key];

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
    const selectedNode = this.getSelectedNode();
    const isInArray = (selected.last() === 'end' ? selected.slice(0, -2) : selected)
        .findLast((key) => ['elements', 'properties'].includes(key)) === 'elements';
    return (
      <div style={{whiteSpace: 'pre', outline: 'none'}}
           ref={(div) => div && !inputMode && div.focus()}
           tabIndex="0" onKeyDown={this.handleKeyDown}>
        <div style={{maxWidth: 800, margin: '0 auto'}}>
          <h1>Syntactor</h1>

          <div style={{marginBottom: 10, ...cardStyle}}>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
              {links.map(([label, link], i) => [
                <a key={label} href={link}>{label}</a>,
                i < links.length - 1 && '|'
              ])}
            </div>
            <div style={{marginTop: 20, whiteSpace: 'pre-line'}}>
              An editor with two basic goals:
              <ol>
                <li>Only allow valid code to be entered (no syntax errors)</li>
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
              {inputMode
                ? (
                  <KeySection title="General">
                    <KeyInfo keys={['Esc', 'Enter']}>Leave Input Mode</KeyInfo>
                  </KeySection>
                )
                : (
                  <div>
                    <KeySection title="Modify">
                      <KeyInfo keys={['Del']}>
                        Delete {isInArray ? 'element' : 'property'}
                      </KeyInfo>
                      {selectedNode && (
                        <div>
                          {isEditable(selectedNode) && (
                            <KeyInfo keys={['Enter', 'i']}>
                              Enter Input Mode
                            </KeyInfo>
                          )}
                          {isBooleanLiteral(selectedNode) && (
                            <KeyInfo keys={['t', 'f']}>Set to true/false</KeyInfo>
                          )}
                          {isNumericLiteral(selectedNode) && (
                            <KeyInfo keys={['+', '-']}>Increment/Decrement</KeyInfo>
                          )}
                        </div>
                      )}
                    </KeySection>

                    <KeySection title={'Insert into ' + (isInArray ? 'array' : 'object')}>
                      <KeyInfo keys={['s', '\'']}>String</KeyInfo>
                      <KeyInfo keys={['n']}>Number</KeyInfo>
                      <KeyInfo keys={['b']}>Boolean</KeyInfo>
                      <KeyInfo keys={['a', '[']}>Array</KeyInfo>
                      <KeyInfo keys={['o', String.fromCharCode(123)]}>Object</KeyInfo>
                    </KeySection>

                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

}