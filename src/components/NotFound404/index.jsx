import React from 'react';

import Link from '+components/Link';
import Typography from '+components/Typography';

import Container from './components/Container';

const NotFound404 = () => (
  <Container>
    <Typography variant="h6">OOPS! Looks like we lost you somewhere.</Typography>

    <Typography variant="h6"><Link to="/">Go home</Link></Typography>
  </Container>
);

export default NotFound404;
