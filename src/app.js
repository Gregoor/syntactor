import React, {Component} from 'react';
import Immutable from 'immutable';
import hash from 'object-hash';

import navigate, {UP, DOWN} from './navigate';
import parse from './parse';
import example from './example.json';


let TypeElements = {};
const renderTypeElement = (node, {level, ...props}) => {
  const TypeElement = TypeElements[node.type] || 'span';
  return <TypeElement node={node} level={level + 1} {...props}/>;
};


const indent = (level) => {
  const indents = [];
  for (let i = 0; i < level; i++) {
    indents.push(<span style={{borderLeft: '1px solid lightgrey'}}>{'  '}</span>)
  }
  return indents;
};

const Symbol = ({children}) => <span style={{color: 'grey'}}>{children}</span>;

const Editable = ({children, style}) => (
  <span contentEditable suppressContentEditableWarning
        style={{whiteSpace: 'normal', outline: 'none', ...style}}>
    {children}
  </span>
);

const NumericLiteral = ({node}) => (
  <Editable style={{color: '#268bd2'}}>
    {node.get('value')}
  </Editable>
);
const StringLiteral = ({node}) => (
  <span style={{color: '#b58900'}}>
    "<Editable>{node.get('value')}</Editable>"
  </span>
);

const CollectionExpression = ({children, openString, closeString, level}) => (
  <span>
    <Symbol>{openString + '\n'}</Symbol>
    {React.Children.map(children, (element, i) => (
      <span key={element.key}>
        {indent(level)}
        {element}
        {i + 1 < children.length && <Symbol>,</Symbol>}
        {'\n'}
      </span>
    ))}
    {indent(level - 1)}
    <Symbol>{closeString}</Symbol>
  </span>
);

const ArrayExpression = ({node, level = 1, selected, ...props}) => (
  <CollectionExpression openString="[" closeString="]" {...{level, ...props}}>
    {node.elements.map((node, i) => (
      <span key={i + hash(node)}>
        {renderTypeElement(node, {level, selected: selected})}
      </span>
    ))}
  </CollectionExpression>
);

const ObjectExpression = ({node, level = 1, selected, ...props}) => (
  <CollectionExpression openString="{" closeString="}" {...{level, ...props}}>
    {node.properties.map((node, i) => (
      <span key={i + hash(node)}>
        <span style={{color: '#d33682'}}>
          "<Editable>{node.get('key').get('value')}</Editable>"
        </span>
        <Symbol>:</Symbol>{' '}
        {renderTypeElement(node.get('value'), {level, selected})}
      </span>
    ))}
  </CollectionExpression>
);


TypeElements = {
  NumericLiteral,
  StringLiteral,
  ArrayExpression,
  ObjectExpression
};

export default class App extends Component {

  state = {
    root: parse(example),
    selected: new Immutable.List()
  };

  handleKeyDown = (event) => {
    const direction = {
      ArrowUp: UP,
      ArrowDown: DOWN
    }[event.key];
    this.setState(({root, selected}) => ({
      selected: navigate(root, selected, direction)
    }));
  };

  render() {
    const {root, selected} = this.state;
    return (
      <div style={{whiteSpace: 'pre', outline: 'none', fontFamily: 'Lucida Console'}}
           tabIndex="0" onKeyDown={this.handleKeyDown}>
        <ObjectExpression node={root} selected={selected}/>
      </div>
    );
  }

}