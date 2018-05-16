// @flow
import { List, Map } from 'immutable';

export type ASTKey = string | number;
export type ASTNodeData = Map<
  string,
  ASTNodeData | List<ASTNodeData> | string | boolean | number
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

export type ASTNodeProps = BaseASTNodeProps & { node: ASTNodeData };

export type EditorContextValue = {
  ast: ASTNodeData,
  lastDirection: Direction,
  onSelect: ASTPath => any,
  selected: ASTPath,
  selectedRef: { current: null | HTMLInputElement }
};
