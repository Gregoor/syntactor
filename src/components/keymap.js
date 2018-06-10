// @flow
import { isArrayExpression } from 'babel-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import type { KeyMapping, Modifier } from '../key-mappings';
import keyMappings from '../key-mappings';
import type { ASTPath } from '../types';

const Section = styled.section`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const Left = styled.div`
  width: 100%;
  ${props => props.indent && 'padding-left: 20px;'};
`;

const Right = styled.div`
  margin-left: 20px;
  width: 100%;
  text-align: right;
`;

const SectionTitle = styled.h2`
  color: #6d6d6d;
  border-bottom: 1px solid #6d6d6d;
  margin: 0;
  font-size: 14px;
  font-weight: normal;
`;

const ActionType = styled.span``;

const List = styled.ul`
  padding: 0;
  list-style: none;
`;

type Props = {
  isInArray: boolean,
  level: number,
  parentModifiers: Modifier[],
  selected: ASTPath,
  selectedNode: any
};

class KeyMap extends PureComponent<
  {
    children: KeyMapping
  } & Props
> {
  static defaultProps = { level: 0, parentModifiers: [] };

  render() {
    const {
      children: { type, name, mappings, keys, modifiers, test },
      isInArray,
      level,
      parentModifiers,
      selected,
      selectedNode
    } = this.props;

    if (test && !test(selectedNode, selected)) return null;

    const itemType = isInArray ? 'element' : 'property';

    const allModifiers = parentModifiers.concat(
      modifiers
        ? Array.isArray(modifiers)
          ? modifiers
          : modifiers(selectedNode, selected)
        : []
    );

    const combos =
      mappings || !keys
        ? []
        : keys.map(key => [
            ...allModifiers.map(modifier => modifier.slice(0, 1).toUpperCase() + modifier.slice(1)),
            { ArrowDown: '⬇', ArrowUp: '⬆' }[key] || key
          ]);

    return (
      <Section style={level === 1 ? { marginTop: 20 } : {}}>
        <Left indent={level === 3}>
          {name && <SectionTitle>{name}</SectionTitle>}
          {type !== undefined && (
            <ActionType>
              {{
                INSERT:
                  'Insert ' +
                  (isInArray || isArrayExpression(selectedNode)
                    ? 'element'
                    : 'property'),
                DELETE: 'Delete ' + itemType,
                MOVE: 'Move ' + itemType,
                UP: 'up',
                DOWN: 'down',

                ADD_TO_NUMBER: 'Add',
                SET_BOOLEAN: 'Set',
                true: <b>true</b>,
                false: <b>false</b>,
                TO_STRING: 'String',
                TO_NUMBER: 'Number',
                TO_ARRAY: 'Array',
                TO_OBJECT: 'Object',
                TO_NULL: <b>null</b>,

                UNDO: 'Undo',
                REDO: 'Redo',
                COPY: 'Copy',
                PASTE: 'Paste'
              }[type] || type}
            </ActionType>
          )}
          <List>
            {mappings &&
              mappings.map((mapping, i) => (
                <li key={i}>
                  <KeyMap
                    {...this.props}
                    level={level + 1}
                    parentModifiers={allModifiers}
                  >
                    {mapping}
                  </KeyMap>
                </li>
              ))}
          </List>
        </Left>
        {combos.length > 0 && (
          <Right>
            {combos.map((combo, i) => (
              <React.Fragment key={i}>
                {combo.map((key, i) => (
                  <React.Fragment key={key}>
                    <kbd>{key}</kbd>
                    {i + 1 < combo.length && ' + '}
                  </React.Fragment>
                ))}
                {i + 1 < combos.length && ' / '}
              </React.Fragment>
            ))}
          </Right>
        )}
      </Section>
    );
  }
}

export default (props: Props) => (
  <KeyMap {...props}>{{ mappings: keyMappings }}</KeyMap>
);
