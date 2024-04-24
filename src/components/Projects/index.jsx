import React, { Fragment, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';



import Button, { ButtonSizes, ButtonColors } from '+components/Button';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import { Field, Controls, Validators } from '+components/Form';
import FormModal from '+components/FormModal';
import Link from '+components/Link';
import Table, { ButtonsCell } from '+components/Table';
import PathNames from '@/models/PathNames';
import { actions as projectsActions, selectors as projectsSelectors } from '@/redux/modules/projects';

import ButtonsContainer from './components/ButtonsContainer';

const Projects = () => {
  const dispatch = useDispatch();

  const projects = useSelector(projectsSelectors.getProjects);

  const [ projectToManage, setProjectToManage ] = useState(null);
  const [ projectToDelete, setProjectToDelete ] = useState(null);

  const onManageProjectModalOpen = useCallback(
    (project) => { setProjectToManage(project); },
    [],
  );

  const onManageProjectModalClose = useCallback(
    () => { setProjectToManage(null); },
    [],
  );

  const onManageProjectModalSubmit = useCallback(
    (project) => {
      if (project.id) {
        dispatch(projectsActions.updateProject(project));
      } else {
        dispatch(projectsActions.createProject(project));
      }
      setProjectToManage(null);
    },
    [dispatch],
  );

  const onDeleteProjectModalOpen = useCallback(
    (project) => { setProjectToDelete(project); },
    [],
  );

  const onDeleteProjectModalClose = useCallback(
    () => { setProjectToDelete(null); },
    [],
  );

  const onDeleteProjectModalSubmit = useCallback(
    () => {
      dispatch(projectsActions.deleteProject(projectToDelete.id));
      setProjectToDelete(null);
    },
    [dispatch, projectToDelete],
  );

  const columns = useMemo(
    () => ([{
      id: 'name',
      accessor: 'name',
      Header: 'Name',
      Cell: ({ row: { original: { id, name } } }) => useMemo(
        () => (
          <Link
            to={`/${PathNames.projects}/${id}`}
            underline="always"
          >
            {name}
          </Link>
        ),
        [id, name],
      ),
    }, {
      id: 'description',
      accessor: 'description',
      Header: 'Description',
    }, {
      id: 'actions',
      Header: 'Actions',
      minWidth: 80,
      maxWidth: 80,
      Cell: ({ row: { original } }) => useMemo(
        () => (
          <ButtonsCell>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => onDeleteProjectModalOpen(original)}
            >
              Delete
            </Button>

            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => onManageProjectModalOpen(original)}
            >
              Edit
            </Button>
          </ButtonsCell>
        ),
        [original],
      ),
    }]),
  [onDeleteProjectModalOpen, onManageProjectModalOpen],
  );

  return (
    <Fragment>
      <ButtonsContainer>
        <Button onClick={() => onManageProjectModalOpen({})}>
          Add Project
        </Button>
      </ButtonsContainer>

      <Table
        columns={columns}
        data={Object.values(projects)}
      />

      {projectToManage ? <FormModal
        header={`${projectToManage.id ? 'Edit' : 'Add'} Project`}
        initialValues={projectToManage}
        onClose={onManageProjectModalClose}
        onSubmit={onManageProjectModalSubmit}
        open
                         >
        <Field
          name="name"
          label="Name"
          component={Controls.TextField}
          validate={Validators.required}
          required
        />

        <Field
          name="description"
          label="Description"
          component={Controls.TextField}
          multiline
          rows={6}
        />
      </FormModal> : null}

      {projectToDelete ? <ConfirmModal
        action={ConfirmActions.delete}
        item={projectToDelete.name}
        onClose={onDeleteProjectModalClose}
        onSubmit={onDeleteProjectModalSubmit}
        open
                         /> : null}
    </Fragment>
  );
};

export default Projects;
