// @flow
import React, {PureComponent} from 'react';
import {is, List} from 'immutable';

import renderTypeElement from '../render-type-element';
import type {ASTNode, ASTPath} from '../types';
import Highlightable from './highlightable';

const indent = (level) => {
  const indents = [];
  for (let i = 0; i < level; i++) {
    indents.push(
      <span style={{borderLeft: '1px solid rgba(0, 0, 0, .1)', background: 'white'}}>{'  '}</span>
    );
  }
  return indents;
};

class Symbol extends PureComponent {
  props: {
    children?: any
  };
  render() {
    const {children} = this.props;
    return <span style={{color: 'grey'}}>{children}</span>;
  }
}

class CollectionExpression extends PureComponent {
  props: {
    children?: any,
    openString: string,
    closeString: string,
    level: number,
    selected?: ASTPath
  };
  render() {
    const {children, openString, closeString, level, selected} = this.props;
    const startSelected = selected && selected.isEmpty();
    const endSelected = selected && selected.get(1) === 'end';
    const highlighted = startSelected || endSelected;
    return !children || !children.size
      ? (
        <Highlightable {...{highlighted}}>
          <Symbol>{openString}{closeString}</Symbol>
        </Highlightable>
      )
      : (
        <Highlightable {...{highlighted}} light={highlighted}>
          <Highlightable {...{highlighted}} light={endSelected}>
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
          <Highlightable {...{highlighted}} light={startSelected}>
            <Symbol>{closeString}</Symbol>
          </Highlightable>
        </Highlightable>
      );
  }
}

export class ArrayExpression extends PureComponent {
  props: {
    inputMode: bool,
    node: ASTNode,
    selected?: ASTPath,
    level?: number
  };
  render() {
    const {inputMode, node, level = 1, selected} = this.props;

    return (
      <CollectionExpression openString="[" closeString="]" {...{level, selected}}>
        {node.get('elements').map((node, i) => (
          <span key={i}>
            {renderTypeElement(node, {inputMode, level,
              selected: selected && is(selected.slice(0, 2), List.of('elements', i))
                ? selected.slice(2)
                : null
            })}
          </span>
        ))}
      </CollectionExpression>
    );
  }
}

export class ObjectExpression extends PureComponent {
  props: {
    inputMode: bool,
    level?: number,
    node: ASTNode,
    selected?: ASTPath
  };
  render() {
    const {inputMode, node, level = 1, selected} = this.props;
    const keyStyle = {color: '#d33682'};
    return (
      <CollectionExpression openString="{" closeString="}" {...{level, selected}}>
        {node.get('properties').map((node, i) => {
          const isKeySelected = selected && is(List.of('properties', i, 'key'), selected);
          return (
            <span key={i}>
              {renderTypeElement(node.get('key'), {
                inputMode, level, selected: isKeySelected, style: keyStyle
              })}
              <Symbol>:</Symbol>{' '}
              {renderTypeElement(node.get('value'), {
                inputMode,
                level,
                selected: selected && is(selected.slice(0, 3), List.of('properties', i, 'value'))
                  ? selected.slice(3)
                  : null
              })}
            </span>
          );
        })}
      </CollectionExpression>
    );
  }
}