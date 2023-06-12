import styled from 'styled-components';

export default styled.div`  
  flex-direction: row;
  width: 100%; 
  min-height: 100%;
  max-height: 100%;
  display: flex;
  justify-content: flex-end;
  
  .react-flow {
    width: 99%;
    height: 100%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    
    .react-flow__node {
      cursor: pointer;
      background-color: white;
      border: 1px solid rgba(0, 0, 0, 0.2) !important;
      border-radius: 4px;
      padding: 9px;

      &:hover {
        box-shadow: 2px 2px 2px rgba(0,0,0,0.2);
      }

      &.selected {
        border: 1px solid black;
        box-shadow: 2px 2px 2px rgba(0,0,0,0.25);
      }
      
      &.new {
        border: 1px dashed black;
      }
    }
    
    .react-flow__node-input {
      width: unset;
    }

    .react-flow__edge {
      pointer-events: none;
    }
  }
`;
