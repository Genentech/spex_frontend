import styled from 'styled-components';
import Button from '+components/Button';

export default styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 14px;
  
  ${Button} + ${Button} {
    margin-left: 14px;
  }
`;
