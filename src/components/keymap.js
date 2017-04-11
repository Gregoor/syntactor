// @flow
import React, {PureComponent} from 'react';
import {isBooleanLiteral, isNumericLiteral, isObjectExpression, isEditable} from '../checks';

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

export default class Keymap extends PureComponent {

  render() {
    const {inputMode, isInArray, selectedNode} = this.props;
    return (
      <div>
        <KeySection title="Navigate">
          <KeyInfo keys={['Left']}>Left</KeyInfo>
          <KeyInfo keys={['Right']}>Right</KeyInfo>
          <KeyInfo keys={['Up']}>Up</KeyInfo>
          <KeyInfo keys={['Down']}>Down</KeyInfo>
          <KeyInfo keys={['Tab']}>To next editable</KeyInfo>
          <KeyInfo keys={['+ Shift']}>To previous editable</KeyInfo>
        </KeySection>
        <KeySection title="General">
          <KeyInfo keys={['Ctrl + z']}>Undo</KeyInfo>
          <KeyInfo keys={['+ Shift']}>Redo</KeyInfo>
          <KeyInfo keys={['Ctrl + c']}>Copy selected</KeyInfo>
        </KeySection>
        {inputMode
          ? (
            <KeySection title="Modify">
              <KeyInfo keys={['Esc', 'Enter']}>Leave Input Mode</KeyInfo>
            </KeySection>
          )
          : (
            <div>
              <KeySection title="Modify">
                <KeyInfo keys={['d', 'Del']}>
                  Delete {isInArray ? 'element' : 'property'}
                </KeyInfo>
                {selectedNode && (
                  <div>
                    {isEditable(selectedNode) && (
                      <KeyInfo keys={['i', 'Enter']}>
                        Enter Input Mode
                      </KeyInfo>
                    )}
                    {isBooleanLiteral(selectedNode) && (
                      <KeyInfo keys={['t', 'f']}>Set to true/false</KeyInfo>
                    )}
                    {isNumericLiteral(selectedNode) && (
                      <KeyInfo keys={['+', '-']}>Increment/Decrement</KeyInfo>
                    )}
                  </div>
                )}
              </KeySection>

              <KeySection title={
                'Insert into '
                + (isInArray && selectedNode && !isObjectExpression(selectedNode) ? 'array' : 'object')
              }>
                <KeyInfo keys={['s', '\'']}>String</KeyInfo>
                <KeyInfo keys={['n']}>Number</KeyInfo>
                <KeyInfo keys={['b']}>Boolean</KeyInfo>
                <KeyInfo keys={['a', '[']}>Array</KeyInfo>
                <KeyInfo keys={['o', String.fromCharCode(123)]}>Object</KeyInfo>
                <KeyInfo keys={['.']}>Null</KeyInfo>
              </KeySection>

            </div>
          )
        }
      </div>
    );
  }

}