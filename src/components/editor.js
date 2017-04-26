// @flow
import React, {PureComponent} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import * as Immutable from 'immutable';
import generate from 'babel-generator';

import type {ASTNode, ASTPath} from '../types';
import {ArrayExpression, ObjectExpression} from './collections';
import Keymap from './keymap';
import {BooleanLiteral, NumericLiteral, NullLiteral, StringLiteral} from './literals';
import {
  isBooleanLiteral, isNumericLiteral, isArrayExpression, isObjectExpression, isEditable
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
const NumericNode = new Map({type: 'NumericLiteral', value: '0'});
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

  // Hacky! When changing to an input onFocus is fired, which calls changeSelected which leads to a
  // double render
  isChanging: boolean;

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

  componentDidUpdate() {
    this.isChanging = false;
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
      if (!root.getIn(selected)) {
        selected = new List();
      }
      return {
        future: new List(),
        history: history.unshift(new Map({
          root, selected,
          ...updateFn(root, selected)
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
      root: newRoot,
      selected: newSelected
    };
  });

  changeSelected = (arg: ASTPath | (root: ASTNode, selected: ASTPath) => ASTPath) => {
    if (this.isChanging) {
      return;
    }
    this.isChanging = true;
    return this.addToHistory((root, selected) => ({
      root: root.getIn(selected.push('type')) === 'NumericLiteral'
        ? root.updateIn(selected.push('value'), (value) => parseFloat(value))
        : root,
      selected: typeof arg === 'function' ? arg(root, selected) : arg
    }));
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
    const {ctrlKey, key} = event;

    const direction = this.getDirection(key);
    const selectedInput: any = this.root.getSelectedInput();
    if (direction && (
        ['UP', 'DOWN'].includes(direction) || !selectedInput
        || !between(selectedInput.selectionStart + (direction === 'LEFT' ? -1 : 1), 0, selectedInput.value.length)
    )) {
      event.preventDefault();
      return this.changeSelected((root, selected) => navigate(direction, root, selected));
    }

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
        return isNumericLiteral(this.getSelectedNode()) && this.updateValue(
            (value) => value + (key === '+' ? 1 : -1)
          );

      case 't':
      case 'f':
        return isBooleanLiteral(this.getSelectedNode()) && this.updateValue(
            () => Boolean(key === 't')
          );

      case 'Backspace':
        return this.deleteSelected();

      case 'Enter':
        event.preventDefault();
        break;

      default:

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
            node={editorState.get('root')}
            selected={selected}
            onSelect={this.changeSelected}
            ref={(el) => this.root = el}
          />
        </Form>
        {showKeymap && (
          <Keymap {...{isInArray}} selectedNode={this.getSelectedNode()}/>
        )}
      </Container>
    );
  }

}