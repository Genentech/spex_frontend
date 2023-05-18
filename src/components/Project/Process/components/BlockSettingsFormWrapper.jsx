import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
  display: flex;
  width: 70%;
  height: 100%;
  margin-left: 14px;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  border-radius: 4px;
  overflow-y: auto;
  padding: 14px;
  
  ${ScrollBarMixin};
`;
