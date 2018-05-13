// @flow
import {List, Map} from './utils/proxy-immutable';

export type ASTKey = string | number;
export type ASTNodeData = Map<string, ASTNodeData | List<ASTNodeData> | string | boolean | number>;
export type ASTPath = List<ASTKey>;

export type VerticalDirection = 'UP' | 'DOWN';
export type HorizontalDirection = 'LEFT' | 'RIGHT';
export type Direction = VerticalDirection | HorizontalDirection;

export type ASTNodeProps = {
  children?: any,
  lastDirection?: Direction,
  // Indentation level
  level: number,
  node: ASTNodeData,
  onSelect: (ASTPath) => ASTPath,
  path: ASTPath,
  selected?: ASTPath,
  style?: any
};