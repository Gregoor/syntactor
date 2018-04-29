// @flow
import React, {PureComponent} from 'react';
import type {ASTPath} from '../types';

export default class Focusable extends PureComponent<{
  children: any;
  path: ASTPath;
  onSelect: (ASTPath) => ASTPath;
  selected: ASTPath;
}> {
  containerRef = React.createRef();

  componentDidMount() {
    const el = this.containerRef.current;
    if (!el) return;
    el.addEventListener('focusin', this.handleFocus);
  }

  componentWillUnmount() {
    const el = this.containerRef.current;
    if (!el) return;
    el.removeEventListener('focusin', this.handleFocus);
  }

  handleFocus = () => {
    const {onSelect, path, selected} = this.props;
    if (!selected) onSelect(path);
  };

  render() {
    return <span ref={this.containerRef}>{this.props.children}</span>;
  }
}
