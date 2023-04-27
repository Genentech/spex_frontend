import React from 'react';
import PropTypes from 'prop-types';

const ErrorMessage = ({ message }) => {
  const errorMessageStyles = {
    color: 'red',
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '8px',
    margin: '8px 0',
    border: '1px solid red',
    borderRadius: '4px',
    backgroundColor: '#ffe6e6',
  };

  return (
    <div style={errorMessageStyles}>
      {message}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ErrorMessage;
