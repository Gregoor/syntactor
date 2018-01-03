// @flow
import {List, Map} from 'immutable';

export type ASTKey = string | number;
export type ASTNode = Map<string, ASTNode>
export type ASTPath = List<ASTKey>;

export type VerticalDirection = 'UP' | 'DOWN';
export type HorizontalDirection = 'LEFT' | 'RIGHT';
export type Direction = VerticalDirection | HorizontalDirection;

export type ASTNodeProps = {
  lastDirection?: Direction,
  level: number,
  node: ASTNode,
  onSelect: () => ASTPath,
  path: ASTPath,
  selected?: ASTPath,
};