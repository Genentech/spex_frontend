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
    return 'rgba(0, 128, 0, 0.6)'; // green
  }

  switch (Math.round(status)) {
    case -4:
      return 'rgba(255, 165, 0, 0.6)'; // orange
    case -3:
      return 'rgba(255, 0, 0, 0.6)'; // red
    case -2:
      return 'rgba(255, 255, 0, 0.6)'; // yellow
    case -1:
      return 'rgba(255, 0, 0, 0.6)'; // red
    case 0:
      return 'rgba(144, 238, 144, 0.6)'; // light green
    case 100:
      return 'rgba(0, 0, 255, 0.6)'; // blue
    default:
      return 'rgba(0, 128, 0, 0.6)'; // green
  }
};
