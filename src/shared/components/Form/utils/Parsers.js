const number = (value) => (isNaN(parseFloat(value)) ? null : parseFloat(value));

const numberBetween = (value, min, max) => Math.min(max, Math.max(min, number(value)));

const omeroIds = (value) => value.map((el) => el?.id ?? el);

const channel = (value) => value?.value ?? value;

const file = (value) => value?.value ?? value;
const channels = (value) => value.map(channel);

const Parsers = {
  number,
  numberBetween,
  omeroIds,
  file,
  channels,
  channel,
};

export default Parsers;
