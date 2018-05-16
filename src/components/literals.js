// @flow
import { is, List } from 'immutable';
import React from 'react';
import type { ASTNodeProps } from '../types';
import Editable from './editable';
import EditorContext from './editor-context';
import Highlightable from './highlightable';

const Literal = ({
  children,
  path,
  style,
  tabIndex
}: ASTNodeProps & { children: any, tabIndex?: string }) => (
  <EditorContext.Consumer>
    {({ selected }) => (
      <Highlightable
        highlighted={is(path, selected.slice(0, path.size))}
        {...{ style, tabIndex }}
      >
        {children}
      </Highlightable>
    )}
  </EditorContext.Consumer>
);

export const BooleanLiteral = (props: ASTNodeProps) => (
  <Literal tabIndex="0" {...props}>
    <b>{(props.node.get('value') || false).toString()}</b>
  </Literal>
);

export const NumericLiteral = (props: ASTNodeProps) => {
  const { node } = props;
  return (
    <Literal {...props}>
      <Editable {...props} style={{ color: '#268bd2' }}>
        {node.get('value')}
      </Editable>
    </Literal>
  );
};

export const NullLiteral = (props: ASTNodeProps) => (
  <Literal tabIndex="0" {...props}>
    <b>null</b>
  </Literal>
);

export const StringLiteral = (props: ASTNodeProps) => {
  const { node, style } = props;
  const mergedStyle = { color: '#b58900', display: 'inline-block', ...style };
  return (
    <Literal {...props} style={mergedStyle}>
      "
      <Editable {...props} style={mergedStyle}>
        {node.get('value')}
      </Editable>
      "
    </Literal>
  );
};

StringLiteral.defaultProps = {
  path: new List()
};
