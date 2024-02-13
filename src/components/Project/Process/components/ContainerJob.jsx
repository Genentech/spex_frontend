import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 55px;
    min-height: 55px;
    overflow-y: auto;
    margin: 20px 5px 5px 5px;
    border: 1px solid #ccc;
    padding: 10px;
    outline: 1px solid #ccc; 
    outline-offset: -1px;

    ${ScrollBarMixin};
`;
