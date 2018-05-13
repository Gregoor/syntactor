// @flow
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import generate from 'babel-generator';
import {
  booleanLiteral,
  nullLiteral,
  numericLiteral,
  stringLiteral,
  arrayExpression,
  objectExpression,
  objectProperty,
  isBooleanLiteral,
  isNullLiteral,
  isNumericLiteral,
  isStringLiteral,
  isArrayExpression,
  isObjectExpression,
  isObjectProperty,
  isIdentifier
} from 'babel-types';
import navigate from '../navigate';
import * as Immutable from '../utils/proxy-immutable';
import parse, { parseObject } from '../utils/parse';
import styles from '../utils/styles';
import type {
  ASTNodeData,
  ASTPath,
  Direction,
  VerticalDirection
} from '../types';
import * as collections from './collections';
import * as declarations from './declarations';
import Keymap from './keymap';
import * as literals from './literals';
import * as misc from './misc';
import ASTNode, { injectASTNodeComponents } from './ast-node';

const { List } = Immutable;

const MAX_HISTORY_LENGTH = 100;

function between(number, lower, upper) {
  return number >= lower && number <= upper;
}

function isEditable(node?: ASTNodeData) {
  return isStringLiteral(node) || isNumericLiteral(node) || isIdentifier(node);
}

injectASTNodeComponents({
  ...collections,
  ...declarations,
  ...literals,
  ...misc
});

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  white-space: pre;
  outline: none;
  ${styles.text};
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
  defaultValue: {},
  onChange: (json: string) => any
};

declare type EditorState = {
  +root: ASTNodeData,
  +selected: ASTPath
};

const INCREMENTS = {
  i: 1,
  I: 10,
  d: -1,
  D: -10
};

const SELECTED_PREFIX = List.of('program', 'body');

export default class Editor extends PureComponent<
  Props,
  {
    future: List<EditorState>,
    history: List<EditorState>,
    showKeymap: boolean
  }
> {
  static defaultProps = {
    initiallShowKeymap: true,
    defaultValue: {},
    onChange: () => null
  };

  lastDirection: any;

  rootRef: { current: null | ASTNode<void> } = React.createRef();

  constructor(props: Props) {
    super(props);
    this.state = {
      future: List(),
      history: List([
        {
          root: parse(props.defaultValue),
          selected: SELECTED_PREFIX
        }
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

  toggleShowKeymap = () =>
    this.setState(({ showKeymap }) => ({
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

  getCurrentEditorState() {
    return this.state.history.first();
  }

  getSelectedNode() {
    const { root, selected } = this.getCurrentEditorState();
    return root.getIn(selected);
  }

  getClosestCollectionPath(root: any /*ASTNode*/, selected: ASTPath) {
    const selectedNode = root.getIn(selected);

    if (isObjectExpression(selectedNode)) {
      return selected.push('properties');
    } else if (isArrayExpression(selectedNode)) {
      return selected.push('elements');
    }

    const index = selected.findLastIndex(key =>
      ['elements', 'properties'].includes(key)
    );
    return selected.slice(0, index + 1);
  }

  addToHistory(updateFn: (root: any /*ASTNode*/, selected: ASTPath) => any) {
    this.setState(({ history }) => {
      let { root, selected } = history.first() || {};
      if (selected.last() !== 'end' && !root.getIn(selected)) {
        selected = List();
      }
      const newState = { root, selected, ...updateFn(root, selected) };
      const isRootPristine = Immutable.is(root, newState.root);

      if (newState.root && !isRootPristine) {
        this.props.onChange(generate(newState.root.toJS()).code);
      }
      return Immutable.is(selected, newState.selected) && isRootPristine
        ? undefined
        : {
            future: List(),
            history: history.unshift(newState).slice(0, MAX_HISTORY_LENGTH)
          };
    });
  }

  updateValue(updateFn: any => any) {
    this.addToHistory((root, selected) => ({
      root: root.updateIn(selected.push('value'), updateFn)
    }));
  }

  insert = (node: any) =>
    this.addToHistory((root, selected) => {
      const immutableNode = Immutable.fromJS(node);
      const collectionPath = this.getClosestCollectionPath(
        root,
        selected.last() === 'end' ? selected.slice(0, -3) : selected
      );
      const itemIndex =
        selected.last() === 'end'
          ? collectionPath.size
          : selected.get(collectionPath.size) + 1 || 0;

      const collectionNode = root.getIn(collectionPath.butLast());
      const isArray = isArrayExpression(collectionNode);
      const isObject = isObjectExpression(collectionNode);

      if (!isArray && !isObject) return;

      const newRoot = root.updateIn(collectionPath, list =>
        list.insert(
          itemIndex,
          isArray
            ? immutableNode
            : Immutable.fromJS(objectProperty(stringLiteral(''), node))
        )
      );
      let newSelected = collectionPath.push(itemIndex);
      if (!isArray) newSelected = newSelected.push('key');
      return {
        root: newRoot,
        selected: newSelected
      };
    });

  replace(node: ASTNodeData, subSelected: ASTPath = List.of()) {
    this.addToHistory((root, selected) => ({
      root: root.updateIn(selected, () => Immutable.fromJS(node)),
      selected: selected.concat(subSelected)
    }));
  }

  changeSelected = (
    changeFn: (
      root: any /*ASTNode*/,
      selected: ASTPath
    ) => { direction?: Direction, selected: ASTPath }
  ) => {
    return this.addToHistory((root, selected) => {
      const { direction, selected: newSelected } = changeFn(root, selected);
      this.lastDirection = direction;
      const selectedNode = root.getIn(selected);
      return {
        root:
          selectedNode && isNumericLiteral(selectedNode)
            ? root.updateIn(selected.push('value'), value => parseFloat(value))
            : root,
        selected: newSelected
      };
    });
  };

  deleteSelected() {
    return this.addToHistory((root, selected) => {
      const newRoot = root.deleteIn(
        selected.slice(
          0,
          1 + selected.findLastIndex(value => typeof value === 'number')
        )
      );
      const isRootDelete =
        selected.isEmpty() ||
        (selected.size === 2 && selected.last() === 'end');
      return {
        root: isRootDelete ? Immutable.fromJS(nullLiteral()) : newRoot,
        selected:
          isRootDelete || selected.last() === 'end'
            ? List()
            : navigate('DOWN', newRoot, navigate('UP', root, selected))
      };
    });
  }

  moveSelected = (direction: VerticalDirection) =>
    this.addToHistory((root, selected) => {
      const isMoveUp = direction === 'UP';

      const collectionPath = this.getClosestCollectionPath(root, selected);

      const itemIndex =
        selected.last() === 'end'
          ? collectionPath.size
          : selected.get(collectionPath.size) || 0;
      const itemPath = collectionPath.push(itemIndex);
      const item = root.getIn(itemPath);
      const isItemObjectProperty = isObjectProperty(item);

      const newItemIndex = parseInt(itemIndex, 10) + (isMoveUp ? -1 : 1);
      const newItemPath = collectionPath.push(newItemIndex);
      const targetItem = root.getIn(newItemPath);

      if (
        isItemObjectProperty &&
        isObjectProperty(targetItem) &&
        isObjectExpression(targetItem.value)
      ) {
        const targetObjectPath = newItemPath.push('value', 'properties');
        const targetIndex = isMoveUp ? root.getIn(targetObjectPath).size : 0;
        return {
          root: root
            .updateIn(targetObjectPath, collection =>
              collection.insert(targetIndex, item)
            )
            .updateIn(collectionPath, collection =>
              collection.delete(itemIndex)
            ),
          selected: collectionPath
            .push(
              newItemIndex + (isMoveUp ? 0 : -1),
              'value',
              'properties',
              targetIndex
            )
            .concat(selected.slice(collectionPath.size + 1))
        };
      }

      if (newItemIndex < 0 || !targetItem) {
        const collectionIndexPath = newItemPath.slice(0, -3);
        const parentCollectionPath = this.getClosestCollectionPath(
          root,
          collectionIndexPath
        );

        if (
          !isItemObjectProperty ||
          !isObjectExpression(root.getIn(parentCollectionPath.butLast()))
        ) {
          return;
        }

        const collectionIndex =
          collectionIndexPath.last() === 'end'
            ? parentCollectionPath.size
            : selected.get(parentCollectionPath.size) || 0;
        const newItemIndex = parseInt(collectionIndex, 10) + (isMoveUp ? 0 : 1);

        return {
          root: root
            .updateIn(collectionPath, collection =>
              collection.delete(itemIndex)
            )
            .updateIn(parentCollectionPath, collection =>
              collection.insert(newItemIndex, item)
            ),
          selected: parentCollectionPath
            .push(newItemIndex)
            .concat(selected.slice(itemPath.size))
        };
      }

      return {
        root: root
          .updateIn(itemPath, () => targetItem)
          .updateIn(newItemPath, () => item),
        selected: selected.update(collectionPath.size, () => newItemIndex)
      };
    });

  undo() {
    this.setState(({ future, history }) => ({
      future: future.unshift(history.first()),
      history: history.size > 1 ? history.shift() : history
    }));
  }

  redo() {
    this.setState(({ future, history }) => ({
      future: future.shift(),
      history: future.isEmpty() ? history : history.unshift(future.first())
    }));
  }

  handleCopy = (event: any) => {
    if (isEditable(this.getSelectedNode())) {
      return;
    }

    let { root, selected } = this.getCurrentEditorState();
    if (selected.last() === 'end') {
      selected = selected.slice(0, -2);
    }
    event.clipboardData.setData(
      'text/plain',
      generate(root.getIn(selected)).code
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
    this.insert(parseObject(data));
  };

  handleKeyDown = (event: any) => {
    const { altKey, ctrlKey, key } = event;

    const direction = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT'
    }[key];
    const selectedInput: any = this.rootRef.current.getSelectedInput();
    if (
      !altKey &&
      direction &&
      (direction === 'UP' ||
        direction === 'DOWN' ||
        !selectedInput ||
        !between(
          selectedInput.selectionStart + (direction === 'LEFT' ? -1 : 1),
          0,
          selectedInput.value.length
        ))
    ) {
      event.preventDefault();
      return this.changeSelected((root, selected) => ({
        direction,
        selected: navigate(direction, root, selected)
      }));
    }

    const increment = INCREMENTS[key];
    if (isNumericLiteral(this.getSelectedNode()) && increment !== undefined) {
      event.preventDefault();
      return this.updateValue(value => parseFloat(value) + increment);
    }

    if (key === 'd' && ctrlKey) {
      event.preventDefault();
      return this.deleteSelected();
    }

    const selectedIsNull = isNullLiteral(this.getSelectedNode());

    const enteredNumber = parseInt(key, 10);
    if (selectedIsNull && !isNaN(enteredNumber)) {
      event.preventDefault();
      return this.replace(numericLiteral(enteredNumber));
    }
    if (
      this.getCurrentEditorState().selected.last() !== 'key' &&
      (selectedIsNull || altKey || isBooleanLiteral(this.getSelectedNode()))
    ) {
      switch (key) {
        case 's':
        case "'":
          event.preventDefault();
          return this.replace(
            stringLiteral((this.getSelectedNode().value || '').toString())
          );

        case 'n':
          event.preventDefault();
          const value = this.getSelectedNode().value;
          return this.replace(
            numericLiteral(Number(value) || parseFloat(value) || 0)
          );

        case 't':
        case 'f':
          event.preventDefault();
          return this.replace(booleanLiteral(key === 't'));

        case 'a':
        case '[':
          event.preventDefault();
          return this.replace(arrayExpression([this.getSelectedNode()]));

        case 'o':
        case '{':
          event.preventDefault();
          return this.replace(
            Immutable.fromJS(
              objectExpression([
                objectProperty(stringLiteral(''), this.getSelectedNode())
              ])
            ),
            List.of('properties', 0, 'key')
          );

        case '.':
          event.preventDefault();
          return this.replace(nullLiteral());

        default:
      }
    }

    if (altKey && (direction === 'UP' || direction === 'DOWN')) {
      this.moveSelected(direction);
    }

    if (key === 'Enter') {
      event.preventDefault();
      return this.insert(nullLiteral());
    }

    if (ctrlKey && key.toLowerCase() === 'z') {
      event.preventDefault();
      return key === 'z' ? this.undo() : this.redo();
    }
  };

  handleChange = ({ target: { value } }: any) => {
    this.addToHistory((root, selected) => ({
      root: root.setIn(
        selected.push(selected.last() === 'id' ? 'name' : 'value'),
        value
      )
    }));
  };

  handleSelect = (selected: ASTPath) =>
    this.changeSelected(() => ({ selected }));

  render() {
    const { showKeymap } = this.state;
    const { root, selected } = this.getCurrentEditorState();
    const isInArray =
      (selected.last() === 'end'
        ? selected.slice(0, -2)
        : selected
      ).findLast(key => ['elements', 'properties'].includes(key)) ===
      'elements';
    return (
      <Container
        tabIndex="0"
        ref={el => this.retainFocus(el)}
        onKeyDown={this.handleKeyDown}
      >
        {window.location.host.startsWith('localhost') && (
          <div style={{ position: 'fixed', top: 0, left: 0 }}>
            {selected
              .toJS()
              .map((s, i, arr) => [s, i + 1 < arr.length && ' > '])}
          </div>
        )}

        <Button type="button" onClick={this.toggleShowKeymap}>
          {showKeymap ? 'x' : '?'}
        </Button>
        <Form onChange={this.handleChange} style={{ marginRight: 10 }}>
          <ASTNode
            lastDirection={this.lastDirection}
            node={root}
            selected={selected}
            onSelect={this.handleSelect}
            ref={this.rootRef}
          />
        </Form>
        {showKeymap && (
          <Keymap
            {...{ isInArray }}
            selected={selected}
            selectedNode={this.getSelectedNode()}
          />
        )}
      </Container>
    );
  }

  reset = () => {
    this.addToHistory(() => ({
      root: parse(this.props.defaultValue),
      selected: List()
    }));
  };
}
