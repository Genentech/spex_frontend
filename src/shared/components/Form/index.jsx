import { FormControlLabel as Label } from '@material-ui/core';
import { TextField as TextFieldOrigin, Checkbox, Radio, Select } from 'final-form-material-ui';
import { Form, Field, FormSpy } from 'react-final-form';
import styled from 'styled-components';

import ImagePicker from '+components/ImagePicker';
import { Option as SelectOption } from '+components/Select';
import SelectJobs from '+components/SelectJobs';
import SelectOmeroChannels from '+components/SelectOmeroChannels';
import SelectOmeroImages from '+components/SelectOmeroImages';
import Slider from '+components/Slider';
import TransferList from '+components/TransferList';

import FormRenderer from './components/FormRenderer';
import WhenFieldChanges from './components/WhenFieldChanges';
import WhenValueChanges from './components/WhenValueChanges';
import Parsers from './utils/Parsers';
import Validators from './utils/Validators';

const TextField = styled(TextFieldOrigin).attrs((props) => ({
  variant: props.variant || 'outlined',
}))`
`;

const NumberField = styled(TextField).attrs((props) => ({
  type: props.type || 'number',
}))`
`;

const Controls = {
  Label,
  TextField,
  NumberField,
  Checkbox,
  Radio,
  Select,
  SelectOption,
  SelectOmeroImages,
  SelectJobs,
  SelectOmeroChannels,
  Slider,
  TransferList,
  ImagePicker,
};

export {
  Form as default,
  Field,
  FormRenderer,
  WhenFieldChanges,
  WhenValueChanges,
  FormSpy,
  Controls,
  Validators,
  Parsers,
};
