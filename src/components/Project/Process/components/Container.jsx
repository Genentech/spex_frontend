import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-y: auto;
  width: 100%;
  ${ScrollBarMixin};
`;
