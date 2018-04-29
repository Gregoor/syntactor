// @flow
import React, {PureComponent} from 'react';
import styled from 'styled-components';
import {is, List} from '../utils/proxy-immutable';
import type {ASTNodeProps} from '../types';
import ASTNode from './ast-node';
import Highlightable from './highlightable';

const IndentContainer = styled.span`
  border-left: 1px solid rgba(0, 0, 0, .1);
  background: white;
`;

const indent = (level) => {
  const indents = [];
  for (let i = 0; i < level; i++) {
    indents.push(<IndentContainer key={i}>  </IndentContainer>);
  }
  return indents;
};

const Symbol = styled.span`
  color: grey;
`;

class CollectionExpression extends PureComponent<ASTNodeProps & {
  children?: any,
  openString: string,
  closeString: string
}> {
  handleSelect = () => {
    const {onSelect, path} = this.props;
    onSelect(path.butLast());
  };

  handleSelectEnd = () => {
    const {onSelect, path} = this.props;
    onSelect(path.push('end'));
  };

  render() {
    const {children, openString, closeString, level, selected} = this.props;
    const startSelected = selected && selected.isEmpty();
    const endSelected = selected && selected.get(1) === 'end';
    const highlighted = startSelected || endSelected;
    return !children || !children.size
      ? (
        <Highlightable {...{highlighted}} onClick={this.handleSelect}>
          <Symbol>{openString}{closeString}</Symbol>
        </Highlightable>
      )
      : (
        <Highlightable {...{highlighted}} light={highlighted}>
          <Highlightable {...{highlighted}} light={endSelected} onClick={this.handleSelect}>
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
          <Highlightable {...{highlighted}} light={startSelected} onClick={this.handleSelectEnd}>
            <Symbol>{closeString}</Symbol>
          </Highlightable>
        </Highlightable>
      );
  }
}

export class ArrayExpression extends ASTNode {
  render() {
    const {lastDirection, node, onSelect, selected} = this.props;
    const level = this.props.level + 1;
    const path = this.props.path.push('elements');
    return (
      <CollectionExpression openString="[" closeString="]" {...this.props} level={level} path={path}>
      {node.elements.map((node, i) => {
          const isSelected = selected && is(selected.slice(0, 2), List.of('elements', i));
          return (
            <span key={i}>
              <ASTNode
                {...{level, node, onSelect}}
                {...(isSelected ? {ref: this.selectedRef} : {})}
                lastDirection={isSelected ? lastDirection : null}
                path={path.push(i)}
                selected={selected && isSelected ? selected.slice(2) : null}
              />
            </span>
          );
        })}
      </CollectionExpression>
    );
  }
}

export class ObjectExpression extends ASTNode {
  render() {
    const {lastDirection, node, onSelect, selected} = this.props;
    const level = this.props.level + 1;
    const keyStyle = {color: '#d33682'};
    const path = this.props.path.push('properties');
    return (
      <CollectionExpression openString="{" closeString="}" {...this.props} level={level} path={path}>
        {node.properties.map((node, i) => {
          const isPropertySelected = selected && is(selected.slice(0, 2), List.of('properties', i));
          const isKeySelected = selected && isPropertySelected && selected.get(2) === 'key';
          const isValueSelected = selected && isPropertySelected && selected.get(2) === 'value';
          const propertyPath = path.push(i);
          return (
            <span key={i}>
              <ASTNode
                {...{level, onSelect}}
                {...(isKeySelected ? {ref: this.selectedRef} : {})}
                lastDirection={isKeySelected ? lastDirection : null}
                node={node.key}
                path={propertyPath.push('key')}
                selected={isKeySelected}
                style={keyStyle}
              />
              <Symbol>:</Symbol>{' '}
              <ASTNode
                {...{level, onSelect}}
                {...(isValueSelected ? {ref: this.selectedRef} : {})}
                lastDirection={isValueSelected ? lastDirection : null}
                node={node.value}
                path={propertyPath.push('value')}
                selected={selected && isValueSelected ? selected.slice(3) : null}
              />
            </span>
          );
        })}
      </CollectionExpression>
    );
  }
}
