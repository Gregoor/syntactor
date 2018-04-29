// @flow
import React from 'react';
import Immutable, {List} from '../utils/proxy-immutable';
import type {ASTNodeProps} from '../types';

export default class ASTNode<T = void> extends React.Component<ASTNodeProps & T> {

  // eslint-disable-next-line
  selectedRef: {current: null | ASTNode<void>} = React.createRef();

  static defaultProps = {
    level: 0,
    path: new List()
  };

  shouldComponentUpdate(nextProps: ASTNodeProps) {
    return nextProps.level !== this.props.level
      || !Immutable.is(nextProps.node, this.props.node)
      || nextProps.onSelect !== this.props.onSelect
      || !Immutable.is(nextProps.path, this.props.path)
      || !Immutable.is(nextProps.selected, this.props.selected);
  }

  getSelectedInput() {
    const {current} = this.selectedRef;
    return current && current.getSelectedInput();
  }

  render() {
    const {node, path, selected} = this.props;

    if (node instanceof List) {
      return node.map((n, i) => [
        <ASTNode
          key={i}
          {...this.props}
          node={n}
          path={path.push(i)}
          selected={selected && selected.first() === i ? selected.rest() : null}
        />,
        i + 1 === node.size ? null : <br key={'br' + i}/>
      ]);
    }

    const ASTNodeImpl = (ASTNodes[node.type]: any);
    if (!ASTNodeImpl) {
      return console.warn('Unknown type', node.type);
    }
    return <ASTNodeImpl {...this.props} ref={this.selectedRef}/>;
  }

}

let ASTNodes: any = {};

export function injectASTNodeComponents(value: any) {
  ASTNodes = value;
}
