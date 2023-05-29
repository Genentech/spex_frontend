import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
  display: flex;
  width: 97%;
  height: 100%;
  margin-left: 14px;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  border-radius: 4px;
  overflow: auto;
  padding: 14px;
  
  ${ScrollBarMixin};
`;
