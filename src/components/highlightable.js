// @flow
import styled, {keyframes} from 'styled-components';

const blink = keyframes`
  from, to {
    outline-color: rgba(0, 0, 0, .2);
  }
  50% {
    outline-color: rgba(0, 0, 0, .5);
  }
`;

export default styled.span`
  ${(props) => props.highlighted && !props.light && 'outline: 1px solid grey;'}
  ${(props) => props.light && 'background: rgba(0, 0, 0, .05);'}
  animation: ${blink} 1s linear infinite;
`;