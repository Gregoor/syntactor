// @flow
import { List, Map } from 'immutable';

export type ASTKey = string | number;
export type AST = Map<
  string,
  AST | List<AST> | string | boolean | number
>;
export type ASTPath = List<ASTKey>;

export type VerticalDirection = 'UP' | 'DOWN';
export type HorizontalDirection = 'LEFT' | 'RIGHT';
export type Direction = VerticalDirection | HorizontalDirection;

export type BaseASTNodeProps = {
  level: number,
  path: ASTPath,
  style?: any
};

export type ASTNodeProps = BaseASTNodeProps & { node: AST };

export type EditorContextValue = {
  ast: AST,
  lastDirection: Direction,
  onSelect: ASTPath => any,
  selected: ASTPath,
  selectedRef: { current: null | HTMLInputElement }
};
