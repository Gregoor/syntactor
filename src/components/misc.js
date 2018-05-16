// @flow
import React from 'react';
import type { ASTNodeProps } from '../types';
import ASTNode from './ast-node';

export const File = ({ path, ...props }: ASTNodeProps) => (
  <ASTNode {...props} path={path.push('program')} />
);

export const Program = ({ path, ...props }: ASTNodeProps) => (
  <ASTNode {...props} path={path.push('body')} />
);
