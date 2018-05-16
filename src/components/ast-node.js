// @flow
import * as React from 'react';
import { is, List, Map } from 'immutable';
import type {
  ASTNodeData,
  ASTNodeProps,
  BaseASTNodeProps,
  EditorContextValue
} from '../types';
import EditorContext from './editor-context';

type State = {
  node: ASTNodeData
};

class ASTNode extends React.Component<
  BaseASTNodeProps & EditorContextValue,
  State
> {
  static getDerivedStateFromProps({ ast, path }) {
    return { node: (ast.getIn((path: any)): any) };
  }

  state = {
    node: Map()
  };

  shouldComponentUpdate(nextProps: BaseASTNodeProps, nextState: State) {
    return (
      !is(nextProps.path, this.props.path) ||
      !is(nextState.node, this.state.node)
    );
  }

  render() {
    const { level, path, style } = this.props;
    const node = (this.state.node: any);

    if (node instanceof List) {
      return node.map((n, i) => [
        <ASTNode {...this.props} key={i} path={path.push(i)} />,
        i + 1 === node.size ? null : <br key={'br' + i} />
      ]);
    }

    const ASTNodeImpl = (ASTNodes[node.get('type')]: React.ComponentType<
      ASTNodeProps
    >);
    if (!ASTNodeImpl) {
      return console.warn('Unknown type', node.get('type'), node.toJS());
    }
    return <ASTNodeImpl {...{ level, node, path, style }} />;
  }
}

export default (props: BaseASTNodeProps) => (
  <EditorContext.Consumer>
    {editorContextProps => <ASTNode {...editorContextProps} {...props} />}
  </EditorContext.Consumer>
);

let ASTNodes: any = {};

export function injectASTNodeComponents(value: any) {
  ASTNodes = value;
}
