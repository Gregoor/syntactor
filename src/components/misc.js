// @flow
import React from 'react';
import ASTNode from './ast-node';

export class File extends ASTNode {
  render() {
    const { node, path, selected, ...props } = this.props;
    return (
      <ASTNode
        {...props}
        node={node.program}
        path={path.push('program')}
        selected={selected.rest()}
        ref={this.selectedRef}
      />
    );
  }
}

export class Program extends ASTNode {
  render() {
    const { node, path, selected, ...props } = this.props;
    return (
      <ASTNode
        {...props}
        node={node.body}
        path={path.push('body')}
        selected={selected.rest()}
        ref={this.selectedRef}
      />
    );
  }
}
