import ListSubheaderOrigin from '@material-ui/core/ListSubheader';
import MenuItemOrigin from '@material-ui/core/MenuItem';
import SelectOrigin from '@material-ui/core/Select';
import styled from 'styled-components';

const Select = styled(SelectOrigin)`
  width: 100%;
  color: ${(props) => props.$color};
`;

const Group = styled(ListSubheaderOrigin)`
`;

const Option = styled(MenuItemOrigin)`
`;

export {
  Select as default,
  Option,
  Group,
};
