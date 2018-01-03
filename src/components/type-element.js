import React from 'react';
import Immutable, {List} from 'immutable';

import {ASTNodeProps} from '../types';

let TypeElements = {};

export function injectTypeElements(value) {
  TypeElements = value;
}

export default class TypeElement extends React.Component {

  props: ASTNodeProps;

  static defaultProps = {
    level: 0,
    path: new List()
  };

  shouldComponentUpdate(nextProps) {
    return nextProps.level !== this.props.level
      || !Immutable.is(nextProps.node, this.props.node)
      || nextProps.onSelect !== this.props.onSelect
      || !Immutable.is(nextProps.path, this.props.path)
      || !Immutable.is(nextProps.selected, this.props.selected);
  }

  getSelectedInput() {
    return this.el.getSelectedInput();
  }

  bindElement = (el) => this.el = el;

  render() {
    const {node, level} = this.props;
    const TypeElement = TypeElements[node.get('type')];
    if (!TypeElement) {
      return console.warn('Unknown type', node.get('type'));
    }
    return <TypeElement {...this.props} level={level + 1} ref={this.bindElement}/>;
  }

}