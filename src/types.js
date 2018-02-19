// @flow
import {List, Map} from './utils/proxy-immutable';

export type ASTKey = string | number;
export type ASTNode = Map<string, ASTNode | List<ASTNode> | string | boolean | number>;
export type ASTPath = List<ASTKey>;

export type VerticalDirection = 'UP' | 'DOWN';
export type HorizontalDirection = 'LEFT' | 'RIGHT';
export type Direction = VerticalDirection | HorizontalDirection;

export type ASTNodeProps = {
  lastDirection?: Direction,
  level: number,
  node: ASTNode,
  onSelect: (ASTPath) => ASTPath,
  path: ASTPath,
  selected?: ASTPath,
};