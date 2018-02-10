// @flow
import {
  isBooleanLiteral,
  isNullLiteral,
  isNumericLiteral,
  isStringLiteral,
  isArrayExpression,
  isObjectExpression
} from 'babel-types'
import React, {PureComponent} from 'react';

const {Fragment} = (React: any);

class KeyInfo extends PureComponent<any> {

  render() {
    const {children, keys} = this.props;
    return (
      <div>
        <span style={{display: 'inline-flex', alignItems: 'center', width: 120, height: 20}}>
          {keys.map((key, i) => (
            <Fragment key={key}>
              <kbd style={{fontWeight: 'bold'}}>{key}</kbd>
              {i + 1 < keys.length ? ' | ' : ''}
            </Fragment>
          ))}
        </span>
        <span>{children}</span>
      </div>
    )
  }

}

const KeySection = ({children, title}) => (
  <div style={{marginBottom: 20}}>
    <h3 style={{textAlign: 'center', margin: 0}}>{title}</h3>
    <hr/>
    {children}
  </div>
);

class GeneralSection extends PureComponent<{}> {

  render() {
    return (
      <KeySection title="General">
        <KeyInfo keys={['Ctrl + z']}>Undo</KeyInfo>
        <KeyInfo keys={['+ Shift']}>Redo</KeyInfo>
        <KeyInfo keys={['Ctrl + c']}>Copy selected</KeyInfo>
        <KeyInfo keys={['Ctrl + v']}>Paste into selected</KeyInfo>
      </KeySection>
    )
  }

}

export default class Keymap extends PureComponent<any> {

  render() {
    const {isInArray, selected, selectedNode} = this.props;
    const itemType = isInArray ? 'element' : 'property';
    const isKeySelected = selected.last() === 'key';
    const selectedIsNullLiteral = !isKeySelected && isNullLiteral(selectedNode.toJS());
    const selectedIsNumericLiteral = selectedNode && isNumericLiteral(selectedNode.toJS());
    return (
      <div>
        <KeySection title="Modify">
          <KeyInfo keys={['Enter']}>
            Insert {isInArray || isArrayExpression(selectedNode) ? 'element' : 'property'}
          </KeyInfo>
          <KeyInfo keys={['Ctrl + d']}>
            Delete {itemType}
          </KeyInfo>
          <KeyInfo keys={['Alt + ⬆']}>
            Move {itemType} up
          </KeyInfo>
          <KeyInfo keys={['Alt + ⬇']}>
            Move {itemType} down
          </KeyInfo>
          {selectedNode && isBooleanLiteral(selectedNode.toJS()) && (
            <KeyInfo keys={['t', 'f']}>Set to true/false</KeyInfo>
          )}
          {selectedIsNumericLiteral && (
            <Fragment>
              <KeyInfo keys={['i', 'd']}>Inc-/Decrement</KeyInfo>
              <KeyInfo keys={['Shift + i', 'd']}>Inc-/Decrement by 10</KeyInfo>
            </Fragment>
          )}
        </KeySection>

        {!isKeySelected && (
          <KeySection title="Change type">
            {[
              [isStringLiteral, ['s', '\''], 'String'],
              [isNumericLiteral, ['n'], 'Number'],
              [isBooleanLiteral, ['t'], 'true (Boolean)'],
              [isBooleanLiteral, ['f'], 'false (Boolean)'],
              [isArrayExpression, ['a', '['], 'Array'],
              [isObjectExpression, ['o', String.fromCharCode(123)], 'Object'],
              [isNullLiteral, ['.'], 'Null']
            ].map(([checkFn, keys, label]) => (
              !checkFn(selectedNode.toJS()) && (
                <KeyInfo
                  key={label}
                  keys={selectedIsNullLiteral || isBooleanLiteral(selectedNode.toJS()) ? keys : ['Alt + ' + keys[0]]}>
                  {label}
                </KeyInfo>
              )
            ))}
          </KeySection>
        )}

        <GeneralSection/>
      </div>
    );
  }

}