// @flow
import React from 'react';
import {List} from '../utils/proxy-immutable';
import ASTNode from './ast-node';
import Editable from './editable';
import Highlightable from './highlightable';

class Literal extends ASTNode<{style?: any, tabIndex?: string}> {
  render() {
    const {children, selected, style, tabIndex} = this.props;
    return (
      <Highlightable
        highlighted={selected}
        {...{style, tabIndex}}
      >
        {children}
      </Highlightable>
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
  render() {
    const {lastDirection, node} = this.props;
    return (
      <Literal {...this.props}>
        <Editable
          {...this.props}
          ref={this.selectedRef}
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

export class StringLiteral extends ASTNode {
  static defaultProps = {
    path: new List()
  };

  render() {
    const {lastDirection, node, style} = this.props;
    const mergedStyle = {color: '#b58900', display: 'inline-block', ...style};
    return (
      <Literal {...this.props} style={mergedStyle}>
        "
        <Editable
          {...this.props}
          ref={this.selectedRef}
          lastDirection={lastDirection}
          style={mergedStyle}
        >
          {node.value}
        </Editable>
        "
      </Literal>
    )
  }
}
