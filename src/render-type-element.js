// @flow
import React from 'react';

import {ASTNode} from './types';

let TypeElements = {};

export function injectTypeElements(value: any) {
  TypeElements = value;
}

export default function renderTypeElement(node: ASTNode, {level, ...props}: any) {
  const TypeElement = TypeElements[node.get('type')];
  if (!TypeElement) {
    return console.warn('Unknown type', node.get('type'));
  }
  return <TypeElement node={node} level={level + 1} {...props}/>;
}