import React from 'react';
import { RouteObject } from 'react-router-dom';
import InvoicesPage from '../pages/invoices/InvoicesPage';
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage';
import NewInvoicePage from '../pages/invoices/NewInvoicePage';
import FilesPage from '../pages/files/FilesPage';
// TODO: wrap with RBAC guards in your app
export const invoicesFilesRoutes: RouteObject[] = [
  { path: '/invoices', element: <InvoicesPage/> },
  { path: '/invoices/new', element: <NewInvoicePage/> },
  { path: '/invoices/:id', element: <InvoiceDetailPage/> },
  { path: '/files', element: <FilesPage/> },
];
