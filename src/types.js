import {List, Map} from 'immutable';

declare type ASTKey = string | number;
declare type ASTNode = Map<string, ASTNode>
declare type ASTPath = List<ASTKey>;

declare type VerticalDirection = 'UP' | 'DOWN';
declare type HorizontalDirection = 'LEFT' | 'RIGHT';
declare type Direction = VerticalDirection | HorizontalDirection;
