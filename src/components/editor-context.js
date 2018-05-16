// @flow
import { List, Map } from 'immutable';
import { createContext, createRef } from 'react';
import type { EditorContextValue } from '../types';

export default (createContext({
  ast: Map(),
  lastDirection: 'DOWN',
  onSelect: () => List(),
  selected: List.of(-1),
  selectedRef: createRef()
}): createContext<EditorContextValue>);
