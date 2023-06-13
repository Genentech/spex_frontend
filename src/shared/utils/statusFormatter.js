export const statusFormatter = (status) => {
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

export const statusColor = (status) => {
  if (status == null) {
    return 'green';
  }

  switch (Math.round(status)) {
    case -4:
      return 'orange';
    case -3:
      return 'red';
    case -2:
      return 'yellow';
    case -1:
      return 'red';
    case 0:
      return 'rgba(144, 238, 144, 0.6)';
    case 100:
      return 'blue';
    default:
      return 'green';
  }
};
