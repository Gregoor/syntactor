import React, {PureComponent} from 'react';
import {List} from 'immutable';

import {TypeElementProps} from '../types';

let TypeElements = {};

export function injectTypeElements(value) {
  TypeElements = value;
}

export default class TypeElement extends PureComponent {

  props: TypeElementProps;

  static defaultProps = {
    level: 0,
    path: new List()
  };

  getSelectedInput() {
    return this.el.getSelectedInput();
  }

  bindElement = (el) => this.el = el;

  render() {
    const {node, level, ...props} = this.props;
    const TypeElement = TypeElements[node.get('type')];
    if (!TypeElement) {
      return console.warn('Unknown type', node.get('type'));
    }
    return <TypeElement node={node} level={level + 1} {...props} ref={this.bindElement}/>;
  }

}