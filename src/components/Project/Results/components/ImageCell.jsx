import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const ImageCell = styled(({ className, id, img }) => (<img className={className} src={img} alt={id} />))`
  margin: 3px 0;
`;

ImageCell.propTypes = {
  id: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
};

export default ImageCell;
