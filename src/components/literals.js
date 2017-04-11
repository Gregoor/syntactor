// @flow
import React, {PureComponent} from 'react';

import type {ASTNode, ASTPath} from '../types';
import Highlightable from './highlightable';

class Editable extends PureComponent {
  render() {
    const {children, focused, style} = this.props;
    const textLength = children.toString().length;
    return (
      <input type="text"
             ref={(input) => input && (focused ? input.focus() : input.blur())}
             size={textLength}
             style={{
               ...style,
               width: textLength ? 'auto' : 1,
               background: 'transparent',
               border: 'none',
               whiteSpace: 'normal',
               outline: 'none'
             }}
             value={children}
             onChange={() => 42}
      />
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