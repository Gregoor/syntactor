// @flow
import React, {PureComponent} from 'react';
import styled from 'styled-components';

import example from '../example.json';
import styles from '../utils/styles';
import Editor from './editor';

const links = [
  ['Usage', 'https://github.com/Gregoor/syntactor#usage'],
  ['Reasoning', 'https://medium.com/@grgtwt/code-is-not-just-text-1082981ae27f'],
  ['Roadmap', 'https://github.com/Gregoor/syntactor/milestones?with_issues=no'],
  ['GitHub', 'https://github.com/gregoor/syntactor'],
  ['Issues', 'https://github.com/Gregoor/syntactor/issues']
];

const Head = styled.h1`
  ${styles.text}
  font-size: 2em;
  text-align: center;
`;

const Symbol = styled.span`
  color: #B7B7B7;
`;

const Brace = ({charCode}) => <Symbol>{String.fromCharCode(charCode)}</Symbol>;

const Card = styled.div`
  padding: 20px;
  background: white;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14),
    0 3px 1px -2px rgba(0, 0, 0, .2),
    0 1px 5px 0 rgba(0, 0, 0, .12);
`;

const Nav = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export default class Demo extends PureComponent {

  render() {
    return (
      <div style={{maxWidth: 800, margin: '0 auto'}}>
        <Head><Brace charCode={123}/>Syntactor<Brace charCode={125}/></Head>

        <Card style={{marginBottom: 10}}>
          <Nav>
            <Symbol>[</Symbol>
            {links.map(([label, link], i) => (
              <span key={label}>
                  <a href={link}>{label}</a>
                {i + 1 < links.length && <Symbol>,</Symbol>}
                </span>
            ))}
            <Symbol>]</Symbol>
          </Nav>
          <div>
            An editor with two basic goals:
            <ol>
              <li>Manage syntax and code style (no syntax errors, no bikeshedding)</li>
              <li>
                Common code transformations in just as many or less keystrokes,
                compared to other editors
              </li>
            </ol>
            For now, it's only a JSON editor.
          </div>
        </Card>

        <Card><Editor initiallyShowKeymap defaultValue={example}/></Card>
      </div>
    );
  }

}