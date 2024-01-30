import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TabsMui from '@material-ui/core/Tabs';

const useStyles = makeStyles({
    customTabsRoot: {
        display: 'flex',
        overflow: 'hidden',
        minHeight: '23px',
        WebkitOverflowScrolling: 'touch',
    },
});

// eslint-disable-next-line react/prop-types
const Tabs = ({ children, ...otherProps }) => {
    const classes = useStyles();
    return (
      <TabsMui {...otherProps} className={classes.customTabsRoot}>
        {children}
      </TabsMui>
    );
};

export default Tabs;
