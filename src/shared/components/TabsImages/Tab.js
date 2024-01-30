import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TabMui from '@material-ui/core/Tab';
import styled from 'styled-components';

const useStyles = makeStyles({
  customTabRoot: {
    minWidth: '110px',
    minHeight: '20px',
  },
});

const TabImage = styled.div`
    border: 1px solid #ccc;
    border-bottom: none;
    margin-right: 8px;
    border-radius: 4px 4px 0 0;
`;

const Tab = (props) => {
  const classes = useStyles();
  return (
    <TabImage>
      <TabMui {...props} className={classes.customTabRoot} />
    </TabImage>
  );
};

export default Tab;
