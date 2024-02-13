import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex: 1;
  overflow: auto;
  justify-content: flex-end;
  flex-direction: column;

  ${ScrollBarMixin};
`;
