import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px - 24px * 2);
  overflow: hidden;
  overflow-y: auto;

  ${ScrollBarMixin};
`;
