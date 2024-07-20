const number = (value) => (isNaN(parseFloat(value)) ? null : parseFloat(value));

const integer = (value) => (isNaN(parseInt(value)) ? null : parseInt(value));

const numberBetween = (value, min, max) => Math.min(max, Math.max(min, number(value)));

const omeroIds = (value) => value.map((el) => el?.id ?? el);

const channel = (value) => value?.value ?? value;

const e_num = (value) => value?.value ?? value;
const file = (value) => value?.value ?? value;
const files = (value) => value.map(file);

const channels = (value) => value.map(channel);

const Parsers = {
  number,
  numberBetween,
  omeroIds,
  file,
  files,
  channels,
  channel,
  integer,
  e_num,
};

export default Parsers;
