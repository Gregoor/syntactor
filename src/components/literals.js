// @flow
import React, {PureComponent} from 'react';
import ReactDOM from 'react-dom';
import {List} from 'immutable';
import styled from 'styled-components';

import type {TypeElementProps} from '../types';
import styles from '../utils/styles';
import Highlightable from './highlightable';
import TypeElement from './type-element';

const Input = styled.input`
  width: ${(props) => props.size ? 'auto' : '1px'};
  border: none;
  outline: none;
  white-space: normal;
  background: transparent;
  ${styles.text}
`;

class Literal extends TypeElement {

  handleFocus = () => {
    const {onSelect, path} = this.props;
    onSelect(path);
  };

  render() {
    const {children, selected, tabIndex} = this.props;
    return (
      <Highlightable highlighted={selected} onFocus={this.handleFous} {...{tabIndex}}>
        {children}
      </Highlightable>
    );
  }

}

class Editable extends PureComponent {

  props: {
    children?: any,
    style?: any
  };

  input: any;

  getInput() {
    return this.input;
  }

  retainFocus = (el) => {
    const input = this.input = ReactDOM.findDOMNode(el);
    if (input instanceof HTMLElement) {
      this.props.focused ? input.focus() : input.blur();
    }
  };

  render() {
    const {children, style} = this.props;
    const textLength = children && children.toString().length;
    return (
      <Input
        onChange={() => 42}
        ref={this.retainFocus}
        size={textLength}
        style={style}
        type="text"
        value={children}
      />
    );
  }

}

export class BooleanLiteral extends TypeElement {

  getSelectedInput() {
    return null;
  }

  render() {
    return (
      <Literal tabIndex="0" {...this.props}>
        <b>{this.props.node.get('value').toString()}</b>
      </Literal>
    );
  }

}

export class NumericLiteral extends TypeElement {

  editable: any;

  getSelectedInput() {
    return this.editable.getInput();
  }

  bindElement = (el: any) => this.editable = el;

  render() {
    const {node, selected} = this.props;
    return (
      <Literal {...this.props}>
        <Editable ref={this.bindElement} focused={selected} style={{color: '#268bd2'}}>
          {node.get('value')}
        </Editable>
      </Literal>
    );
  }

}

export class NullLiteral extends TypeElement {

  getSelectedInput() {
    return null;
  }

  render() {
    return <Literal tabIndex="0" {...this.props}><b>null</b></Literal>;
  }

}

export class StringLiteral extends PureComponent {

  props: TypeElementProps & {
    style?: any
  };

  static defaultProps = {
    path: new List()
  };

  editable: any;

  getSelectedInput() {
    return this.editable.getInput();
  }

  bindElement = (el: any) => this.editable = el;

  render() {
    const {node, onSelect, path, selected, style} = this.props;
    const mergedStyle = {color: '#b58900', display: 'inline-block', ...style};
    return (
      <Highlightable highlighted={selected} style={mergedStyle} onFocus={() => onSelect(path)}>
        "<Editable ref={this.bindElement} focused={selected} style={mergedStyle}>
          {node.get('value')}
        </Editable>"
      </Highlightable>
    )
  }

}