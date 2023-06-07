import styled from 'styled-components';

export default styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: ${(props) => props.$width || '100%'};
  max-width: ${(props) => props.$maxWidth};
  min-height: 100%;
`;
