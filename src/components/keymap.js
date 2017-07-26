// @flow
import React, {PureComponent} from 'react';
import {
  isBooleanLiteral,
  isNullLiteral,
  isNumericLiteral,
  isStringLiteral,
  isArrayExpression,
  isObjectExpression
} from '../utils/checks';

class KeyInfo extends PureComponent {

  render() {
    const {children, keys} = this.props;
    return (
      <div>
        <span style={{display: 'inline-block', width: 100}}>
          {keys.map((key, i) => [
            <kbd style={{fontWeight: 'bold'}}>{key}</kbd>,
            i + 1 < keys.length ? ' | ' : ''
          ])}
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

class NavigateSection extends PureComponent {

  render() {
    return (
      <KeySection title="Navigate">
        <KeyInfo keys={['Left']}>Left</KeyInfo>
        <KeyInfo keys={['Right']}>Right</KeyInfo>
        <KeyInfo keys={['Up']}>Up</KeyInfo>
        <KeyInfo keys={['Down']}>Down</KeyInfo>
        <KeyInfo keys={['Tab']}>To next editable</KeyInfo>
        <KeyInfo keys={['+ Shift']}>To previous editable</KeyInfo>
      </KeySection>
    )
  }

}

class GeneralSection extends PureComponent {

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

export default class Keymap extends PureComponent {
  
  render() {
    const {isInArray, selected, selectedNode} = this.props;
    const itemType = isInArray ? 'element' : 'property';
    return (
      <div>
        <NavigateSection/>
        <GeneralSection/>
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
          {selectedNode && (
            <div>
              {isBooleanLiteral(selectedNode) && (
                <KeyInfo keys={['t', 'f']}>Set to true/false</KeyInfo>
              )}
              {isNumericLiteral(selectedNode) && (
                <KeyInfo keys={['Alt + +', '-']}>Increment/Decrement</KeyInfo>
              )}
            </div>
          )}
        </KeySection>

        {selected.last() !== 'key' && (
          <KeySection title={'Change type to' + (isNullLiteral(selectedNode) ? '' : ' (Alt +) ')}>
            {[
              [isStringLiteral, ['s', '\''], 'String'],
              [isNumericLiteral, ['n'], 'Number'],
              [isBooleanLiteral, ['t'], 'true (Boolean)'],
              [isBooleanLiteral, ['f'], 'false (Boolean)'],
              [isArrayExpression, ['a', '['], 'Array'],
              [isObjectExpression, ['o', String.fromCharCode(123)], 'Object'],
              [isNullLiteral, ['.'], 'Null']
            ].map(([checkFn, keys, label]) => (
              !checkFn(selectedNode) && <KeyInfo key={label} keys={keys}>{label}</KeyInfo>
            ))}
          </KeySection>
        )}
      </div>
    );
  }

}