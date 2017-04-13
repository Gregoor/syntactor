// @flow
import React, {PureComponent} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

import type {ASTNode, ASTPath} from '../types';
import styles from '../utils/styles';
import Highlightable from './highlightable';

const Input = styled.input`
  width: ${(props) => props.textLength ? 'auto' : 1};
  border: none;
  outline: normal;
  white-space: normal;
  background: transparent;
  ${styles.text}
`;

class Editable extends PureComponent {

  retainFocus = (el) => {
    const input = ReactDOM.findDOMNode(el);
    if (input instanceof HTMLElement) {
      this.props.focused ? input.focus() : input.blur();
    }
  };

  render() {
    const {children, style} = this.props;
    const textLength = children.toString().length;
    return (
      <Input type="text" ref={this.retainFocus} size={textLength} style={style} value={children}
             onChange={() => 42}/>
    );
  }

}

export class BooleanLiteral extends PureComponent {
  props: {
    inputMode: bool,
    node: ASTNode,
    selected?: ASTPath
  };
  render() {
    const {node, selected} = this.props;
    return (
      <Highlightable highlighted={selected}>
        <b>{node.get('value').toString()}</b>
      </Highlightable>
    );
  }
}

export class NumericLiteral extends PureComponent {
  props: {
    inputMode: bool,
    node: ASTNode,
    selected?: ASTPath
  };
  render() {
    const {inputMode, node, selected} = this.props;
    return (
      <Highlightable highlighted={selected}>
        <Editable focused={selected && inputMode} style={{color: '#268bd2'}}>
          {node.get('value')}
        </Editable>
      </Highlightable>
    );
  }
}
export class NullLiteral extends PureComponent {
  props: {
    selected?: ASTPath
  };
  render() {
    return <Highlightable highlighted={this.props.selected}><b>null</b></Highlightable>;
  }
}

export class StringLiteral extends PureComponent {
  props: {
    inputMode: bool,
    node: ASTNode,
    selected?: ASTPath,
    style?: any
  };
  render() {
    const {inputMode, node, selected, style} = this.props;
    const mergedStyle = {color: '#b58900', display: 'inline-block', ...style};
    return (
      <Highlightable highlighted={selected} style={mergedStyle}>
        "<Editable focused={selected && inputMode} style={mergedStyle}>{node.get('value')}</Editable>"
      </Highlightable>
    )
  }
}