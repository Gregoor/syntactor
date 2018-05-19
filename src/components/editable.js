// @flow
import { is } from 'immutable';
import React from 'react';
import styled from 'styled-components';
import EditorContext from './editor-context';
import styles from '../utils/styles';
import type { ASTPath, EditorContextValue } from '../types';

const Input = styled.input`
  width: ${props => (props.size ? 'auto' : '1px')};
  border: none;
  outline: none;
  white-space: normal;
  background: transparent;
  ${styles.text};
`;

function setCaretPosition(el: any, caretPos) {
  el.value = el.value;
  el.setSelectionRange(caretPos, caretPos);
}

type EditableProps = {
  children: any,
  path: ASTPath,
  style?: any
};

class Editable extends React.PureComponent<
  EditableProps & {
    lastDirection: $PropertyType<EditorContextValue, 'lastDirection'>,
    onSelect: $PropertyType<EditorContextValue, 'onSelect'>,
    selected: $PropertyType<EditorContextValue, 'selected'>,
    selectedRef: $PropertyType<EditorContextValue, 'selectedRef'>
  }
> {
  input: { current: null | HTMLInputElement } = React.createRef();

  getSelectedInput() {
    return this.input.current;
  }

  componentDidMount() {
    const el = this.getSelectedInput();
    if (!el) return;
    el.addEventListener('focusin', this.handleFocus);
    this.initializeInput(true);
  }

  componentDidUpdate() {
    this.initializeInput(false);
  }

  componentWillUnmount() {
    const el = this.getSelectedInput();
    if (!el) return;
    el.removeEventListener('focusin', this.handleFocus);
  }

  handleFocus = () => {
    const { onSelect, path, selected } = this.props;
    if (!is(path, selected)) onSelect(path);
  };

  initializeInput = (justMounted: boolean) => {
    const { children, path, selected, selectedRef, lastDirection } = this.props;
    const input = this.getSelectedInput();
    if (!input || document.activeElement === input) return;

    if (is(path, selected)) {
      selectedRef.current = input;
      const childrenLength = children && children.toString().length;
      if (lastDirection)
        setCaretPosition(
          input,
          'LEFT' === lastDirection
            ? childrenLength
            : // when it just mounted but already has value, it means that that key was just entered
              justMounted ? childrenLength : 0
        );
      input.focus();
    } else {
      input.blur();
    }
  };

  render() {
    const { children, style } = this.props;
    return (
      <Input
        onChange={() => 42}
        innerRef={this.input}
        size={children !== undefined && children.toString().length}
        style={style}
        type="text"
        value={children}
      />
    );
  }
}

export default (props: EditableProps) => (
  <EditorContext.Consumer>
    {({ lastDirection, onSelect, selected, selectedRef }) => (
      <Editable
        {...{ lastDirection, onSelect, selected, selectedRef }}
        {...props}
      />
    )}
  </EditorContext.Consumer>
);
