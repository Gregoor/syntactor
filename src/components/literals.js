// @flow
import React, {PureComponent} from 'react';
import {List} from '../utils/proxy-immutable';
import type {ASTNodeProps} from '../types';
import ASTNode from './ast-node';
import Editable from './editable';
import Highlightable from './highlightable';
import Focusable from './focusable';

class Literal extends ASTNode<{style?: any, tabIndex?: string}> {
  render() {
    const {children, onSelect, path, selected, style, tabIndex} = this.props;
    return (
      <Focusable {...{onSelect, path, selected}}>
        <Highlightable
          highlighted={selected}
          {...{style, tabIndex}}
        >
          {children}
        </Highlightable>
      </Focusable>
    );
  }
}

export class BooleanLiteral extends ASTNode {
  getSelectedInput() {
    return null;
  }

  render() {
    return (
      <Literal tabIndex="0" {...this.props}>
        <b>{this.props.node.value.toString()}</b>
      </Literal>
    );
  }
}

export class NumericLiteral extends ASTNode {
  editable: any;

  getSelectedInput() {
    return this.editable.getInput();
  }

  bindElement = (el: any) => this.editable = el;

  render() {
    const {lastDirection, node, selected} = this.props;
    return (
      <Literal {...this.props}>
        <Editable
          ref={this.bindElement}
          focused={selected}
          lastDirection={lastDirection}
          style={{color: '#268bd2'}}
        >
          {node.value}
        </Editable>
      </Literal>
    );
  }
}

export class NullLiteral extends ASTNode {
  getSelectedInput() {
    return null;
  }

  render() {
    return <Literal tabIndex="0" {...this.props}><b>null</b></Literal>;
  }
}

export class StringLiteral extends PureComponent<ASTNodeProps & {
  style?: any
}> {
  static defaultProps = {
    path: new List()
  };

  editable: any;

  getSelectedInput() {
    return this.editable.getInput();
  }

  bindElement = (el: any) => this.editable = el;

  render() {
    const {lastDirection, node, selected, style} = this.props;
    const mergedStyle = {color: '#b58900', display: 'inline-block', ...style};
    return (
      <Literal {...this.props} style={mergedStyle}>
        "
        <Editable
          ref={this.bindElement}
          lastDirection={lastDirection}
          focused={!!selected}
          style={mergedStyle}
        >
          {node.value}
        </Editable>
        "
      </Literal>
    )
  }
}
