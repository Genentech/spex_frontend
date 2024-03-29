import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
  display: flex;
  width: 100%;
  max-height: 60vh;
  overflow: auto;

  ${ScrollBarMixin};
`;
