// @flow
import React, {PureComponent} from 'react';
import styled from 'styled-components';
import {is, List} from 'immutable';

import type {ASTNodeProps} from '../types';
import Highlightable from './highlightable';
import TypeElement from './type-element';

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

class CollectionExpression extends PureComponent {

  props: ASTNodeProps & {
    children?: any,
    openString: string,
    closeString: string
  };

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

export class ArrayExpression extends TypeElement {

  selected: any;

  getSelectedInput() {
    return this.selected && this.selected.getSelectedInput();
  }

  render() {
    const {lastDirection, level, node, onSelect, selected} = this.props;
    const path = this.props.path.push('elements');
    return (
      <CollectionExpression openString="[" closeString="]" {...this.props} path={path}>
      {node.get('elements').map((node, i) => {
          const isSelected = selected && is(selected.slice(0, 2), List.of('elements', i));
          return (
            <span key={i}>
              <TypeElement
                {...{level, node, onSelect}}
                lastDirection={isSelected ? lastDirection : null}
                path={path.push(i)}
                ref={(el) => isSelected && (this.selected = el)}
                selected={selected && isSelected ? selected.slice(2) : null}
              />
            </span>
          );
        })}
      </CollectionExpression>
    );
  }

}

export class ObjectExpression extends TypeElement {

  selected: any;

  getSelectedInput() {
    return this.selected && this.selected.getSelectedInput();
  }

  render() {
    const {lastDirection, level, node, onSelect, selected} = this.props;
    const keyStyle = {color: '#d33682'};
    const path = this.props.path.push('properties');
    return (
      <CollectionExpression openString="{" closeString="}" {...this.props} path={path}>
        {node.get('properties').map((node, i) => {
          const isKeySelected = selected && is(List.of('properties', i, 'key'), selected);
          const isValueSelected = selected && is(selected.slice(0, 3), List.of('properties', i, 'value'));
          const propertyPath = path.push(i);
          return (
            <span key={i}>
              <TypeElement
                {...{level, onSelect}}
                lastDirection={isKeySelected ? lastDirection : null}
                node={node.get('key')}
                path={propertyPath.push('key')}
                ref={(el) => isKeySelected && (this.selected = el)}
                selected={isKeySelected}
                style={keyStyle}
              />
              <Symbol>:</Symbol>{' '}
              <TypeElement
                {...{level, onSelect}}
                lastDirection={isValueSelected ? lastDirection : null}
                node={node.get('value')}
                path={propertyPath.push('value')}
                ref={(el) => isValueSelected && (this.selected = el)}
                selected={selected && isValueSelected ? selected.slice(3) : null}
              />
            </span>
          );
        })}
      </CollectionExpression>
    );
  }

}