import { FormControlLabel as Label } from '@material-ui/core';
import { TextField as TextFieldOrigin, Checkbox, Radio, Select } from 'final-form-material-ui';
import { Form, Field, FormSpy } from 'react-final-form';
import styled from 'styled-components';

import Slider from '+components/Slider';
import TransferList from '+components/TransferList';

import FormRenderer from './components/FormRenderer';
import WhenFieldChanges from './components/WhenFieldChanges';
import Parsers from './utils/Parsers';
import Validators from './utils/Validators';

const TextField = styled(TextFieldOrigin).attrs((props) => ({
  variant: props.variant || 'outlined',
}))`
`;

const Controls = {
  Label,
  TextField,
  Checkbox,
  Radio,
  Select,
  Slider,
  TransferList,
};

export {
  Form as default,
  Field,
  FormRenderer,
  WhenFieldChanges,
  FormSpy,
  Controls,
  Validators,
  Parsers,
};
