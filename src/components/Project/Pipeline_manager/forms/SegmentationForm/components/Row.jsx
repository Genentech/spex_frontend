import styled from 'styled-components';

export default styled.div`
  display: flex;
  width: 100%;
  
  > div {
    margin-top: unset !important;
    width: 100%;
  }
  
  > :not(:last-child) {
    margin-right: 7px !important;
  }
  
  > div + div,
  > div + label,
  > label + div {
    margin-left: 7px !important;
  }
`;
