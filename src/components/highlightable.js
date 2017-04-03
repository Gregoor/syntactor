// @flow
import React, {PureComponent} from 'react';

export default class Highlightable extends PureComponent {
  render() {
    const {children, highlighted, light, style} = this.props;
    return (
      <span style={{
        outline: highlighted && !light ? '1px solid grey' : 'none',
        background: light ? 'rgba(0, 0, 0, .05)' : 'none',
        ...style
      }}>
        {children}
      </span>
    );
  }
}