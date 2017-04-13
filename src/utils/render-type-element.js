import React from 'react';

let TypeElements = {};

export function injectTypeElements(value) {
  TypeElements = value;
}

export default function renderTypeElement(node, {level, ...props}: any) {
  const TypeElement = TypeElements[node.get('type')];
  if (!TypeElement) {
    return console.warn('Unknown type', node.get('type'));
  }
  return <TypeElement node={node} level={level + 1} {...props}/>;
}