import styled, { css } from 'styled-components';

export default styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${(props) => props.$height || undefined};
  padding: 14px;
  border: 1px solid rgba(0, 0, 0, 0.27);
  border-radius: 4px;
  
  :hover {
    border-color: rgba(0, 0, 0, 0.87);
  }

  ${(props) => props.$label && css`
    :after {
      content: ${(props) => `'${props.$label}'`};
      position: absolute;
      top: -2px;
      left: 6px;
      transform: translateY(-50%);
      font-size: 0.85em;
      background-color: white;
      padding: 0 8px;
    }
  `};

  ${(props) => props.$disabled && css`
    pointer-events: none;
    opacity: 0.5;
    :hover {
      border-color: rgba(0, 0, 0, 0.27);
    }
  `}; 
  
  .MuiFormControl-root + .MuiFormControl-root {
    margin-top: 20px;
  }
`;
