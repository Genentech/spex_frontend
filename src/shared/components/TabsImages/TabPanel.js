import React from 'react';
import BoxMui from '@material-ui/core/Box';
import styled from 'styled-components';

import { ScrollBarMixin } from '+components/ScrollBar';

const TabPanelContainer = styled((props) => {
    const {
        className,
        children,
        value,
        index,
        ...other
    } = props;

    return (
      <div
        className={className}
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        {...other}
      >
        {value === index && <BoxMui p={1}>{children}</BoxMui>}
      </div>
    );
})`
  overflow: auto;
  height: 110vh;
  width: 100%;
  border-radius: 0 0 4px 4px;
  outline: 1px solid #ccc;
  
  ${ScrollBarMixin}
`;

const TabPanel = (props) => {
    return <TabPanelContainer {...props} />;
};

export default TabPanel;
