import React from 'react';
import Immutable, {List} from 'immutable';

import {ASTNodeProps} from '../types';

let ASTNodes = {};

export function injectASTNodeComponents(value) {
  ASTNodes = value;
}

export default class ASTNode extends React.Component {

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
    const ASTNodeImpl = ASTNodes[node.get('type')];
    if (!ASTNodeImpl) {
      return console.warn('Unknown type', node.get('type'));
    }
    return <ASTNodeImpl {...this.props} level={level + 1} ref={this.bindElement}/>;
  }

}