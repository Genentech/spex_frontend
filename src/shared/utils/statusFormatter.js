const statusFormatter = (status) => {
  if (status == null) {
    return 'N/A';
  }

  switch (Math.round(status)) {
    case -4:
      return 'Pending';
    case -3:
      return 'Failed';
    case -2:
      return 'Waiting for start';
    case -1:
      return 'Error';
    case 0:
      return 'Started';
    case 100:
      return 'Done';
    default:
      return 'In Progress';
  }
};

export default statusFormatter;
