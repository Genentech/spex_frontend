/* eslint-disable react/no-array-index-key */
import React, { useCallback, useState, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Button, { ButtonColors } from '+components/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '+components/Modal';
import { ScrollBarMixin } from '+components/ScrollBar';
import Tabs, { Tab, TabPanel } from '+components/Tabs';

const AddBlockForm = styled((props) => {
  const {
    className,
    header,
    jobTypes,
    selectedBlock,
    open,
    onSubmit,
    onClose,
  } = props;

  const jobTypesKeys = useMemo(
    () => Object.keys(jobTypes) || [],
    [jobTypes],
  );

  const [activeDataTab, setActiveDataTab] = useState(selectedBlock?.folder || jobTypesKeys[0]);

  const selectedReturn = useMemo(
  () => (Object.keys(selectedBlock.return || {})),
  [selectedBlock],
  );

  const onDataTabChange = useCallback(
    (_, id) => {
      setActiveDataTab(id);
    },
    [],
  );

  return (
    <Modal
      className={className}
      open={open}
      onClose={onClose}
    >
      <ModalHeader>{header}</ModalHeader>

      <ModalBody>
        <Tabs
          value={activeDataTab}
          onChange={onDataTabChange}
        >
          {Object.values(jobTypes).map((type) => (
            <Tab
              key={type.key}
              label={type.name}
              value={type.key}
            />
          ))}
        </Tabs>

        {Object.values(jobTypes).map((jobType) => (
          <TabPanel
            key={jobType.key}
            value={activeDataTab}
            index={jobType.key}
          >
            <Grid container>
              {Object.values(jobType.stages).map((stage, stageIndex) => (
                <Grid container key={`${stage.name}_${stageIndex}`}>
                  <Grid className="stage" item>
                    <div className="stage__name">
                      {stageIndex === 0 ? 'Start' : stage.name}
                    </div>
                  </Grid>
                  {(stage.scripts || []).map((block, blockIndex) => {
                    let enabled = !block.depends_and_script.length && !block.depends_or_script?.length;
                    if (selectedBlock.type !== 'start') {
                      enabled = block.depends_and_script?.includes(selectedBlock.script_path)
                        || block.depends_or_script?.includes(selectedBlock.script_path);
                      if (!enabled && selectedBlock.stage === block.stage) {
                        const blockReturn = Object.values(block.params_meta).reduce((acc, item) => item.hidden ? [...acc, item.name] : acc, []);
                        enabled = isEqual(selectedReturn, blockReturn);
                      }
                    }

                    return (
                      <Grid
                        key={`${block.name}_${blockIndex}`}
                        className={classNames('block', { disabled: !enabled })}
                        onClick={enabled ? () => onSubmit({
                          ...block,
                          folder: jobType.key,
                          script: jobType.key,
                        }) : undefined}
                        item
                      >
                        <div className="block__body">
                          <div className="block__name">
                            {block.name}
                          </div>
                          <div className="block__description">
                            {block.description}
                          </div>
                          <ul className="block__input">
                            Input:
                            {Object.values(block.params_meta || {})
                              .filter((param) => !param.hidden)
                              .map((el, i) => (
                                <li key={i}>
                                  {el.name}: {el.description}
                                </li>
                              ))}
                          </ul>
                          <ul className="block__output">
                            Output:
                            {Object.values(block.return)
                              .map((el, i) => (
                                <li key={i}>
                                  {el.name}: {el.description}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </Grid>
                    );
                  })}
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        ))}
      </ModalBody>

      <ModalFooter>
        <Button
          color={ButtonColors.secondary}
          onClick={onClose}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
})`
  .modal-content {
    width: 100%;
    max-width: 960px;
  }
  
  .stage {
    display: flex;
    align-items: center;
    width: 100%;
    margin: 8px 0 4px 0;
    font-weight: bold;
    text-transform: uppercase;
    overflow: hidden;
    :after {
      content: '';
      flex: 1;
      margin-left: 1rem;
      height: 1px;
      background-color: #000;
    }
  }
  
  .block {
    width: calc((100% / 4) - 15px);
    height: 150px;
    max-height: 150px;
    margin-right: 15px;
    margin-bottom: 15px;
    
    border: 1px solid lightgrey;
    border-radius: 4px;
    background-color: lightgrey;
    cursor: pointer;
    overflow-x: hidden;

    :hover {
      transform: scale(1.04);
    }
    
    &__body {
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      width: 100%;
      height: 100%;
      padding: 10px;
      ${ScrollBarMixin};
    }
    
    &__name {
      font-weight: bold;
    }

    &__description {
      margin: 8px 0;
      font-size: 0.8em;
      width: 100%;
    }

    &__input {
      margin-top: auto;
    }

    &__output {
      margin-top: 8px;
    }

    &__input, &__output {
      padding: unset;
      font-size: 0.8em;
      opacity: 0.8;
      
      li {
        margin-left: 6px;
        &::marker {
          content: '-';
        }
      }
    }
    
    &.disabled {
      cursor: not-allowed;
      background-color: transparent;
      .block__body {
        overflow: hidden;
        opacity: 0.4;
      }
      :hover {
        transform: unset;
      }
    }
  }
`;

AddBlockForm.propTypes = {
  className: PropTypes.string,
  header: PropTypes.string,
  jobTypes: PropTypes.shape({}),
  selectedBlock: PropTypes.shape({}),
  open: PropTypes.bool,
  onBlockClick: PropTypes.func,
  onClose: PropTypes.func,
};

AddBlockForm.defaultProps = {
  className: '',
  header: '',
  jobTypes: {},
  selectedBlock: {},
  open: false,
  onSubmit: () => {},
  onClose: () => {},
};

export default AddBlockForm;
