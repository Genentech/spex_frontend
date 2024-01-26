import React, { useMemo, Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import PathNames from '@/models/PathNames';
import Manager from 'components/Project/Pipeline_manager';
import Process from 'components/Project/Process';
import Results from 'components/Project/Results';
import Tabs, { Tab, TabPanel } from '+components/Tabs';

const tabMappings = {
    'build': 0,
    'execute': 1,
    'review': 2,
};

const TabContainer = ({ sidebarWidth, activeTab, projectId, processId, processReviewTabName, history }) => {
    useEffect(() => {
        if (!activeTab) {
            const url = `/${PathNames.projects}/${projectId}/${PathNames.processes}/${processId}/build`;
            history.push(url);
        }
    }, [activeTab, projectId, processId, history]);

    const processComponent = useMemo(() => <Process sidebarWidth={sidebarWidth} />, [sidebarWidth]);
    const managerComponent = useMemo(() => <Manager sidebarWidth={sidebarWidth} />, [sidebarWidth]);
    const processResultComponent = useMemo(() => <Results sidebarWidth={sidebarWidth} processReviewTabName={processReviewTabName} />, [sidebarWidth, processReviewTabName]);
    const handleChange = (event, newValue) => {
        const tabName = Object.keys(tabMappings).find((key) => tabMappings[key] === newValue);
        let url = `/${PathNames.projects}/${projectId}/${PathNames.processes}/${processId}/${tabName}`;

        if (newValue === 2 && processReviewTabName) {
            url += `/review/${processReviewTabName}`;
        }

        history.push(url);
    };


    return (
      <Fragment>
        <Tabs value={tabMappings[activeTab]} onChange={handleChange}>
          <Tab label="Build" />
          <Tab label="Execute" />
          <Tab label="Review" />
        </Tabs>
        {tabMappings[activeTab] === 0 && (
          <TabPanel value={tabMappings[activeTab]} index={0}>
            {processComponent}
          </TabPanel>
            )}
        {tabMappings[activeTab] === 1 && (
          <TabPanel value={tabMappings[activeTab]} index={1}>
            {managerComponent}
          </TabPanel>
            )}
        {tabMappings[activeTab] === 2 && (
          <TabPanel value={tabMappings[activeTab]} index={2}>
            {processResultComponent}
          </TabPanel>
            )}
      </Fragment>
    );
};

TabContainer.propTypes = {
    // eslint-disable-next-line react/require-default-props
    sidebarWidth: PropTypes.number,
    // eslint-disable-next-line react/require-default-props
    activeTab: PropTypes.oneOf(['build', 'execute', 'review']),
    projectId: PropTypes.string,
    // eslint-disable-next-line react/require-default-props
    processId: PropTypes.string,
    // eslint-disable-next-line react/require-default-props,react/no-unused-prop-types
    processReviewTabName: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types,react/require-default-props
    history: PropTypes.object,
};


export default withRouter(TabContainer);
