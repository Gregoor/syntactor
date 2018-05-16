// @flow
import React, { Fragment } from 'react';
import type { ASTNodeProps } from '../types';
import { is, List } from 'immutable';
import ASTNode from './ast-node';
import Editable from './editable';
import EditorContext from './editor-context';
import Highlightable from './highlightable';

export const Identifier = ({ node, path }: ASTNodeProps) => (
  <EditorContext.Consumer>
    {({ selected }) => (
      <Highlightable highlighted={is(path, selected.slice(0, path.size))}>
        <Editable path={path}>{node.get('name')}</Editable>
      </Highlightable>
    )}
  </EditorContext.Consumer>
);

export const VariableDeclaration = (props: ASTNodeProps) => {
  const { node, path } = props;
  const kind = (node.get('kind') || '').toString();
  const declarations = (node.get('declarations'): any) || List();
  return (
    <EditorContext.Consumer>
      {({ onSelect, selected }) => (
        <Highlightable highlighted={is(path, selected)}>
          <b onClick={() => onSelect(path)}>{kind}</b>{' '}
          {declarations.map((declarator, i) => [
            i > 0 && '\n ' + ' '.repeat(kind.length),
            <ASTNode {...props} key={i} path={path.push('declarations', i)} />,
            i + 1 < declarations.size && ','
          ])};
        </Highlightable>
      )}
    </EditorContext.Consumer>
  );
};

export const VariableDeclarator = ({ path, ...props }: ASTNodeProps) => (
  <Fragment>
    <ASTNode path={path.push('id')} {...props} />
    {' = '}
    <ASTNode path={path.push('init')} {...props} />
  </Fragment>
);
