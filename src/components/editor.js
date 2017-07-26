// @flow
import React, {PureComponent} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import * as Immutable from 'immutable';
import generate from 'babel-generator';

import type {ASTNode, ASTPath, Direction} from '../types';
import {ArrayExpression, ObjectExpression} from './collections';
import Keymap from './keymap';
import {BooleanLiteral, NumericLiteral, NullLiteral, StringLiteral} from './literals';
import {
  isBooleanLiteral,
  isNullLiteral,
  isNumericLiteral,
  isArrayExpression,
  isObjectExpression,
  isEditable
} from '../utils/checks';
import navigate from '../navigate/index';
import parse from '../utils/parse';
import styles from '../utils/styles';
import TypeElement, {injectTypeElements} from './type-element';

const {List, Map} = Immutable;

const MAX_HISTORY_LENGTH = 100;

function between(number, lower, upper) {
  return number >= lower && number <= upper;
}

injectTypeElements({
  BooleanLiteral,
  NumericLiteral,
  NullLiteral,
  StringLiteral,
  ArrayExpression,
  ObjectExpression
});

const BooleanNode = new Map({type: 'BooleanLiteral', value: true});
const NumericNode = new Map({type: 'NumericLiteral', value: ''});
const NullNode = new Map({type: 'NullLiteral'});
const StringNode = new Map({type: 'StringLiteral', value: ''});
const ArrayNode = Immutable.fromJS({type: 'ArrayExpression', elements: []});
const ObjectNode = Immutable.fromJS({type: 'ObjectExpression', properties: []});

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  white-space: pre;
  outline: none;
  ${styles.text}
`;

const Button = styled.button`
  position: absolute;
  right: 0;
`;

const Form = styled.form`
  width: 100%;
  padding: 1px;
  overflow-x: auto;  
`;

declare type Props = {
  initiallyShowKeymap: boolean,
  defaultValue: {}
};

declare type EditorState = Map<any, any>;

export default class Editor extends PureComponent {

  static defaultProps = {
    initiallShowKeymap: true,
    defaultValue: {}
  };

  state: {
    future: List<EditorState>,
    history: List<EditorState>,
    showKeymap: boolean
  };

  lastDirection: any;

  root: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      future: new List(),
      history: new List([
        new Map({
          root: parse(props.defaultValue),
          selected: new List()
        })
      ]),
      showKeymap: props.initiallyShowKeymap
    };
  }

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

  toggleShowKeymap = () => this.setState(({showKeymap}) => ({
    showKeymap: !showKeymap
  }));

  retainFocus = (el: any) => {
    if (el && !isEditable(this.getSelectedNode())) {
      const div = ReactDOM.findDOMNode(el);
      if (div instanceof HTMLElement) {
        div.focus();
      }
    }
  };

  bindRoot = (el: any) => this.root = el;

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
      let selected = editorState.get('selected');
      if (selected.last() !== 'end' && !root.getIn(selected)) {
        selected = new List();
      }
      const newState = {root, selected, ...updateFn(root, selected)};
      return Immutable.is(selected, newState.selected) && Immutable.is(root, newState.root)
        ? undefined
        : {
          future: new List(),
          history: history.unshift(new Map(newState)).slice(0, MAX_HISTORY_LENGTH)
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
    let newSelected = collectionPath.push(itemIndex);
    if (!isArray) newSelected = newSelected.push('key');
    return {
      root: newRoot,
      selected: newSelected
    };
  });

  replace(node: Map<string, any>) {
    this.addToHistory((root, selected) => ({
      root: root.updateIn(selected, () => node)
    }));
  }

  changeSelected = (changeFn: (root: ASTNode, selected: ASTPath) => {direction?: Direction, selected: ASTPath}) => {
    return this.addToHistory((root, selected) => {
      const {direction, selected: newSelected} = changeFn(root, selected);
      this.lastDirection = direction;
      return {
        root: root.getIn(selected.push('type')) === 'NumericLiteral'
          ? root.updateIn(selected.push('value'), (value) => parseFloat(value))
          : root,
        selected: newSelected
      };
    });
  };

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

  moveSelected(direction: Direction) {
    if (!['UP', 'DOWN'].includes(direction)) return;

    this.addToHistory((root, selected) => {
      const collectionPath = this.getClosestCollectionPath(root, selected);
      const itemIndex = selected.last() === 'end'
        ? collectionPath.size
        : selected.get(collectionPath.size) || 0;
      const itemPath = collectionPath.push(itemIndex);
      const newItemIndex = parseInt(itemIndex + (direction === 'UP' ? -1 : 1), 10);
      const newItemPath = collectionPath.push(newItemIndex);
      const targetItem = root.getIn(newItemPath);

      if (newItemIndex < 0 || !targetItem) {
        return
      }
      return {
        root: root
          .updateIn(itemPath, () => targetItem)
          .updateIn(newItemPath, () => root.getIn(itemPath)),
        selected: selected.update(collectionPath.size, () => newItemIndex)
      }
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
    if (isEditable(this.getSelectedNode())) {
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
    if (isEditable(this.getSelectedNode())) {
      return;
    }

    this.handleCopy(event);
    this.deleteSelected();
  };

  handlePaste = (event: any) => {
    if (isEditable(this.getSelectedNode())) {
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
    const {altKey, ctrlKey, key} = event;

    const direction = this.getDirection(key);
    const selectedInput: any = this.root.getSelectedInput();
    if (!altKey && direction && (
        ['UP', 'DOWN'].includes(direction) || !selectedInput
        || !between(selectedInput.selectionStart + (direction === 'LEFT' ? -1 : 1), 0, selectedInput.value.length)
    )) {
      event.preventDefault();
      return this.changeSelected((root, selected) => ({
        direction,
        selected: navigate(direction, root, selected)
      }));
    }

    if (isNumericLiteral(this.getSelectedNode()) && ['+', '-'].includes(key)) {
      event.preventDefault();
      return this.updateValue((value) => value + (key === '+' ? 1 : -1));
    }


    if (key === 'd' && ctrlKey) {
      event.preventDefault();
      return this.deleteSelected();
    }

    const selectedIsNull = isNullLiteral(this.getSelectedNode());
    if (selectedIsNull && !isNaN(parseInt(key, 10))) {
      return this.replace(NumericNode);
    }
    if (
      this.state.history.first().get('selected').last() !== 'key' && (
        selectedIsNull || altKey || isBooleanLiteral(this.getSelectedNode())
      )
    ) {
      switch (key) {

        case 's':
        case '\'':
          event.preventDefault();
          return this.replace(StringNode);

        case 'n':
          event.preventDefault();
          return this.replace(
            NumericNode.set('value', Number(this.getSelectedNode().get('value')) || '')
          );

        case 't':
        case 'f':
          event.preventDefault();
          return this.replace(BooleanNode.set('value', Boolean(key === 't')));

        case 'a':
        case '[':
          event.preventDefault();
          return this.replace(ArrayNode);

        case 'o':
        case '{':
          event.preventDefault();
          return this.replace(ObjectNode);

        case '.':
          event.preventDefault();
          return this.replace(NullNode);

        default:

      }
    }

    if (direction && altKey) {
      this.moveSelected(direction);
    }

    if (key === 'Enter') {
      event.preventDefault();
      return this.insert(NullNode);
    }

    if (ctrlKey && key.toLowerCase() === 'z') {
      event.preventDefault();
      return key === 'z' ? this.undo() : this.redo();
    }

  };

  handleChange = ({target: {value}}: any) => {
    this.addToHistory((root, selected) => ({
      root: root.setIn(selected.push('value'), value)
    }));
  };

  handleSelect = (selected: ASTPath) => this.changeSelected(() => ({selected}));

  render() {
    const {history, showKeymap} = this.state;
    const editorState = history.first();
    const selected = editorState.get('selected');
    const isInArray = (selected.last() === 'end' ? selected.slice(0, -2) : selected)
        .findLast((key) => ['elements', 'properties'].includes(key)) === 'elements';
    return (
      <Container tabIndex="0" ref={(el) => this.retainFocus(el)} onKeyDown={this.handleKeyDown}>
        <Button type="button" onClick={this.toggleShowKeymap}>{showKeymap ? 'x' : '?'}</Button>
        <Form onChange={this.handleChange} style={{marginRight: 10}}>
          <TypeElement
            lastDirection={this.lastDirection}
            node={editorState.get('root')}
            selected={selected}
            onSelect={this.handleSelect}
            ref={this.bindRoot}
          />
        </Form>
        {showKeymap && (
          <Keymap {...{isInArray}} selected={selected} selectedNode={this.getSelectedNode()}/>
        )}
      </Container>
    );
  }

}