// @flow
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import type { ASTNodeProps } from '../types';
import ASTNode from './ast-node';
import EditorContext from './editor-context';
import Highlightable from './highlightable';
import { is } from 'immutable';

const IndentContainer = styled.span`
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
`;

const indent = level => {
  const indents = [];
  for (let i = 0; i < level; i++) {
    indents.push(<IndentContainer key={i}>{'  '}</IndentContainer>);
  }
  return indents;
};

const Symbol = styled.span`
  color: grey;
`;

type CollectionExpressionProps = ASTNodeProps & {
  children?: any,
  closeString: string,
  openString: string
};

const InnerCollectionExpression = ({
  children,
  closeString,
  endSelected,
  onSelect,
  openString,
  level,
  path,
  startSelected
}: CollectionExpressionProps & {
  endSelected: boolean,
  openString: string,
  closeString: string,
  onSelect: any,
  startSelected: boolean
}) => {
  const highlighted = startSelected || endSelected;
  return !children || !children.size ? (
    <Highlightable
      {...{ highlighted }}
      onClick={() => onSelect(path.butLast())}
    >
      <Symbol>
        {openString}
        {closeString}
      </Symbol>
    </Highlightable>
  ) : (
    <Highlightable {...{ highlighted }} light={highlighted}>
      <Highlightable
        {...{ highlighted }}
        light={endSelected}
        onClick={() => onSelect(path.butLast())}
      >
        <Symbol>{openString}</Symbol>
      </Highlightable>
      {'\n'}
      {React.Children.map(children, (element, i) => (
        <span key={i}>
          {indent(level)}
          {element}
          {children && i + 1 < children.size && <Symbol>,</Symbol>}
          {'\n'}
        </span>
      ))}
      {indent(level - 1)}
      <Highlightable
        {...{ highlighted }}
        light={startSelected}
        onClick={() => onSelect(path.push('end'))}
      >
        <Symbol>{closeString}</Symbol>
      </Highlightable>
    </Highlightable>
  );
};

const CollectionExpression = (props: CollectionExpressionProps) => {
  const { path } = props;
  return (
    <EditorContext.Consumer>
      {({ onSelect, selected }) => (
        <InnerCollectionExpression
          {...(props: any)}
          onSelect={onSelect}
          startSelected={is(path.slice(0, -1), selected)}
          endSelected={is(path.push('end'), selected.slice(0, path.size + 1))}
        />
      )}
    </EditorContext.Consumer>
  );
};

export class ArrayExpression extends PureComponent<ASTNodeProps> {
  render() {
    const { node } = this.props;
    const level = this.props.level + 1;
    const path = this.props.path.push('elements');
    return (
      <CollectionExpression
        openString="["
        closeString="]"
        {...this.props}
        level={level}
        path={path}
      >
        {(node.get('elements'): any).map((node, i) => (
          <span key={i}>
            <ASTNode level={level} path={path.push(i)} />
          </span>
        ))}
      </CollectionExpression>
    );
  }
}

export class ObjectExpression extends PureComponent<ASTNodeProps> {
  render() {
    const { node } = this.props;
    const level = this.props.level + 1;
    const keyStyle = { color: '#d33682' };
    const path = this.props.path.push('properties');
    return (
      <CollectionExpression
        openString="{"
        closeString="}"
        {...this.props}
        level={level}
        path={path}
      >
        {(node.get('properties'): any).map((node, i) => {
          const propertyPath = path.push(i);
          return (
            <span key={i}>
              <ASTNode
                level={level}
                path={propertyPath.push('key')}
                style={keyStyle}
              />
              <Symbol>:</Symbol>{' '}
              <ASTNode level={level} path={propertyPath.push('value')} />
            </span>
          );
        })}
      </CollectionExpression>
    );
  }
}
