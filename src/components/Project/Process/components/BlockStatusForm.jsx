import styled from 'styled-components';
import { ScrollBarMixin } from '+components/ScrollBar';

export default styled.div`
    display: flex;
    flex-direction: column; /* Изменение на flex-колонку */
    width: 100%;
    max-height: 60vh;
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    border-radius: 4px;
    overflow: auto;

    ${ScrollBarMixin};
`;
