// @flow
import React, {PureComponent} from 'react';
import styled from 'styled-components';
import type {ASTNodeProps} from '../types';
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
  el.setSelectionRange(caretPos, caretPos);
}

export default class Editable extends PureComponent<ASTNodeProps> {

  input = React.createRef();

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
    const {onSelect, path, selected} = this.props;
    if (!selected) onSelect(path);
  };

  initializeInput = (justMounted: boolean) => {
    const {children, selected, lastDirection} = this.props;
    const input = this.input.current;
    if (document.activeElement === input) return;

    if (selected) {
      const childrenLength = children && children.toString().length;
      if (lastDirection) setCaretPosition(input,
        ['UP', 'LEFT'].includes(lastDirection)
          ? childrenLength :
          // when it just mounted but already has value, it means that that key was just entered
          (justMounted ? childrenLength : 0)
      );
      input.focus();
    } else {
      input.blur();
    }
  };

  render() {
    const {children, style} = this.props;
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