// @flow
import React, {Fragment} from 'react';
import {is, List} from '../utils/proxy-immutable';
import ASTNode from './ast-node';
import Editable from './editable';
import Focusable from './focusable';
import Highlightable from './highlightable';

export class Kind extends ASTNode {
  render() {
    const {node, onSelect, path, selected} = this.props;
    return (
      <Highlightable highlighted={selected} onClick={() => onSelect(path)}>
        <b>{node}</b>
      </Highlightable>
    )
  }
}

export class Identifier extends ASTNode {
  render() {
    const {lastDirection, node, onSelect, path, selected} = this.props;

    return (
      <Focusable {...{onSelect, path, selected}}>
        <Highlightable highlighted={selected}>
          <Editable focused lastDirection={lastDirection} onClick>{node.name}</Editable>
        </Highlightable>
      </Focusable>
    )
  }
}

export class VariableDeclaration extends ASTNode {
  render() {
    const {node: {kind, declarations}, path, selected} = this.props;
    const isSelected = selected && selected.first() === 'declarations';

    return (
      <Fragment>
        <Kind
          {...this.props}
          node={kind}
          path={path.push('kind')}
          selected={is(selected, List.of('kind'))}
        />
        {' '}
        {declarations.map((declarator, i) => [
          i > 0 && '\n ' + ' '.repeat(kind.length),
          <ASTNode
            key={i}
            {...this.props}
            node={declarator}
            path={path.push('declarations', i)}
            selected={selected && isSelected && selected.get(1) === i ? selected.slice(2) : null }
          />,
          i + 1 < declarations.size && ','
        ])};
      </Fragment>
    );
  }
}

export class VariableDeclarator extends ASTNode {
  render() {
    const {node: {id, init}, path, selected} = this.props;
    const isIdSelected = selected && selected.first() === 'id';
    const isInitSelected = selected && selected.first() === 'init';
    return (
      <Fragment>
        <ASTNode
          {...this.props}
          node={id}
          path={path.push('id')}
          selected={isIdSelected}
          {...(isIdSelected ? {ref: this.selectedRef} : {})}
        />
        {' = '}
        <ASTNode
          {...this.props}
          node={init}
          path={path.push('init')}
          selected={selected && isInitSelected ? selected.rest() : null}
          {...(isInitSelected ? {ref: this.selectedRef} : {})}
        />
      </Fragment>
    )
  }
}
