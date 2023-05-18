import styled from 'styled-components';

export default styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-grow: 0;
  flex-shrink: 0;
  min-height: 30%;
  max-height: 30%;
  
  .react-flow {
    width: 30%;
    height: 100%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    
    .react-flow__node {
      cursor: pointer;
      background-color: white;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      padding: 4px 6px;

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
