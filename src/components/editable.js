// @flow
import React, {PureComponent} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import type {Direction} from '../types';
import styles from '../utils/styles';

const Input = styled.input`
  width: ${(props) => props.size ? 'auto' : '1px'};
  border: none;
  outline: none;
  white-space: normal;
  background: transparent;
  ${styles.text}
`;


function setCaretPosition(el: any, caretPos) {
  el.value = el.value;
  el.focus();
  el.setSelectionRange(caretPos, caretPos);
}

export default class Editable extends PureComponent<{
  children?: any,
  focused?: boolean,
  lastDirection?: Direction,
  selectedRange?: {
    anchor: number,
    focus: number
  },
  style?: any
}> {

  input: any;

  getInput() {
    return this.input;
  }

  retainFocus = (el: any) => {
    const input = this.input = ReactDOM.findDOMNode(el);
    const {children, focused, lastDirection} = this.props;
    if (document.activeElement === input) return;
    if (input instanceof HTMLElement) {
      focused ? input.focus() : input.blur();
      if (lastDirection) setCaretPosition(input,
        ['UP', 'LEFT'].includes(lastDirection) ? children && children.toString().length : 0
      );
    }
  };

  render() {
    const {children, style} = this.props;
    return (
      <Input
        onChange={() => 42}
        ref={(el) => this.retainFocus(el)}
        size={children !== undefined && children.toString().length}
        style={style}
        type="text"
        value={children}
      />
    );
  }

}