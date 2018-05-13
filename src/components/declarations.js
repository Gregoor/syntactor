// @flow
import React, { Fragment } from 'react';
import ASTNode from './ast-node';
import Editable from './editable';
import Highlightable from './highlightable';

export class Identifier extends ASTNode {
  render() {
    const { node, selected } = this.props;
    return (
      <Highlightable highlighted={selected}>
        <Editable {...this.props} ref={this.selectedRef}>
          {node.name}
        </Editable>
      </Highlightable>
    );
  }
}

export class VariableDeclaration extends ASTNode {
  render() {
    const {
      node: { kind, declarations },
      onSelect,
      path,
      selected
    } = this.props;
    return (
      <Highlightable highlighted={selected && selected.isEmpty()}>
        <b onClick={() => onSelect(path)}>{kind}</b>{' '}
        {declarations.map((declarator, i) => {
          const isDeclarationSelected = selected && selected.get(1) === i;
          return [
            i > 0 && '\n ' + ' '.repeat(kind.length),
            <ASTNode
              key={i}
              {...this.props}
              {...(isDeclarationSelected ? { ref: this.selectedRef } : {})}
              node={declarator}
              path={path.push('declarations', i)}
              selected={isDeclarationSelected ? selected.slice(2) : null}
            />,
            i + 1 < declarations.size && ','
          ];
        })};
      </Highlightable>
    );
  }
}

export class VariableDeclarator extends ASTNode {
  render() {
    const { node: { id, init }, path, selected } = this.props;
    const isIdSelected = selected && selected.first() === 'id';
    const isInitSelected = selected && selected.first() === 'init';
    return (
      <Fragment>
        <ASTNode
          {...this.props}
          node={id}
          path={path.push('id')}
          selected={isIdSelected}
          {...(isIdSelected ? { ref: this.selectedRef } : {})}
        />
        {' = '}
        <ASTNode
          {...this.props}
          node={init}
          path={path.push('init')}
          selected={selected && isInitSelected ? selected.rest() : null}
          {...(isInitSelected ? { ref: this.selectedRef } : {})}
        />
      </Fragment>
    );
  }
}
