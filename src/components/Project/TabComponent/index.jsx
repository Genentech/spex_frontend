import React from 'react';
import PropTypes from 'prop-types';
import Container from 'components/Project/components/Container';
import Process from 'components/Project/Process';
import Manager from 'components/Project/Pipeline_manager';
import Tabs, { Tab, TabPanel } from '+components/Tabs';

const TabContainer = ( { sidebarWidth } ) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container>
      <Tabs
        value={value}
        onChange={handleChange}
      >
        <Tab label="Builder" />
        <Tab label="Pipeline" />
      </Tabs>
      <TabPanel value={value} index={0}>
        <Process sidebarWidth={sidebarWidth} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Manager sidebarWidth={sidebarWidth} />
      </TabPanel>
    </Container>
  );
};

TabContainer.propTypes = {
  // eslint-disable-next-line react/require-default-props
  sidebarWidth: PropTypes.number,
};

export default TabContainer;
