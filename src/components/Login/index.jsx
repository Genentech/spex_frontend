import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { actions as authActions, selectors as authSelectors } from '@/redux/modules/users/auth';

import Button, { ButtonColors } from '+components/Button';
import Form, { Field, FormRenderer, Controls, Validators } from '+components/Form';
import Progress from '+components/Progress';

import Alert from './components/Alert';
import Container from './components/Container';
import spex from './components/spex.png';

const Auth = () => {
  const dispatch = useDispatch();

  const {
    isAuthenticated,
    isFetching,
    error,
  } = useSelector(authSelectors.getState);

  const onLogin = useCallback(
    (values) => {
      dispatch(authActions.login(values));
    },
    [dispatch],
  );

  const render = useCallback(
    ({ handleSubmit, submitting, pristine }) => (
      <FormRenderer onSubmit={handleSubmit}>
        {!!error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <img src={spex} alt="spex" />

        <Field
          name="username"
          label="Username"
          component={Controls.TextField}
          type="username"
          validate={Validators.required}
          required
        />

        <Field
          name="password"
          label="Password"
          component={Controls.TextField}
          type="password"
          validate={Validators.required}
          required
        />

        <Button
          color={ButtonColors.primary}
          type="submit"
          disabled={submitting || pristine || isFetching}
        >
          Sign In
        </Button>
      </FormRenderer>
    ),
    [isFetching, error],
  );

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <Container>
      <Progress />
      <Form
        onSubmit={onLogin}
        render={render}
      />
    </Container>
  );
};

export default Auth;
