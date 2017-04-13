// @flow
import React, {PureComponent} from 'react';

import Editor from './editor';

const links = [
  ['Reasoning', 'https://medium.com/@grgtwt/code-is-not-just-text-1082981ae27f'],
  ['Roadmap', 'https://github.com/Gregoor/syntactor/milestones?with_issues=no'],
  ['GitHub', 'https://github.com/gregoor/syntactor'],
  ['Issues', 'https://github.com/Gregoor/syntactor/issues']
];

const cardStyle = {
  padding: 20,
  background: 'white',
  boxShadow: '0 2px 2px 0 rgba(0,0,0,.14), 0 3px 1px -2px rgba(0,0,0,.2), 0 1px 5px 0 rgba(0,0,0,.12)'
};

export default class Demo extends PureComponent {

  render() {
    return (
        <div style={{maxWidth: 800, margin: '0 auto'}}>
          <h1>Syntactor</h1>

          <div style={{marginBottom: 10, ...cardStyle}}>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              |
              {links.map(([label, link], i) => [
                <a key={label} href={link}>{label}</a>,
                '|'
              ])}
            </div>
            <div style={{marginTop: 20, whiteSpace: 'pre-line'}}>
              An editor with two basic goals:
              <ol>
                <li>Manage syntax and code style (no syntax errors, no bikeshedding)</li>
                <li>At least as fast at making changes as regular editors</li>
              </ol>
              For now, it's only a JSON editor.
            </div>
          </div>

          <div style={cardStyle}><Editor showKeymap/></div>
      </div>
    );
  }

}