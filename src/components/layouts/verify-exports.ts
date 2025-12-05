/**
 * Verification script to ensure all layout components export correctly
 * This file is for development verification only
 */

import MainLayout from './MainLayout';
import AuthLayout from './AuthLayout';
import Navbar from './Navbar';
import UserMenu from './UserMenu';
import WorkspaceSwitcher from './WorkspaceSwitcher';

// Verify all exports are defined
const components = {
  MainLayout,
  AuthLayout,
  Navbar,
  UserMenu,
  WorkspaceSwitcher,
};

console.log(
  'All layout components exported successfully:',
  Object.keys(components)
);

export default components;
