// src/pages/admin/AdminApp.jsx
import { AdminProvider, useAdmin } from '../../context/AdminContext';

import Login            from './Login';
import Verification     from './Verification';
import Dashboard        from './Dashboard';
import Products         from './Products';
import Inventory        from './Inventory';
import Customers        from './Customers';
import Suppliers        from './Suppliers';
import Staff            from './Staff';
import Transaction      from './Transaction';
import PurchaseOrders   from './PurchaseOrders';
import Reports          from './Reports';
import Discounts        from './Discounts';
import Profile          from './Profile';
import AI               from './AI';
import TransactionHistory from './TransactionHistory';
import AddProduct       from './AddProduct';
import AddStock         from './AddStock';
import ViewPurchaseOrder from './ViewPurchaseOrder';
import AddSupplier      from './AddSupplier';
import ViewCustomer     from './ViewCustomer';
import AddStaff         from './AddStaff';
import AddDiscount      from './AddDiscount';
import AuditLogSnapshot from './AuditLogSnapshot';
import Chatbot          from './Chatbot';
import Notifications    from './Notifications';
import NewOrder         from './NewOrder';
import S1 from './S1';
import S2 from './S2';
import S3 from './S3';
import S4 from './S4';
import S5 from './S5';
import S6 from './S6';
import S7 from './S7';

const pageMap = {
  login:                 Login,
  verification:          Verification,
  dashboard:             Dashboard,
  products:              Products,
  inventory:             Inventory,
  customers:             Customers,
  suppliers:             Suppliers,
  staff:                 Staff,
  transactions:          Transaction,
  'purchase-orders':     PurchaseOrders,
  reports:               Reports,
  discounts:             Discounts,
  profile:               Profile,
  ai:                    AI,
  'transaction-history': TransactionHistory,
  'add-product':         AddProduct,
  'add-stock':           AddStock,
  'view-purchase-order': ViewPurchaseOrder,
  'add-supplier':        AddSupplier,
  'view-customer':       ViewCustomer,
  'add-staff':           AddStaff,
  'add-discount':        AddDiscount,
  'audit-log-snapshot':  AuditLogSnapshot,
  chatbot:               Chatbot,
  notifications:         Notifications,
  'new-order':           NewOrder,
  settings:              S1,
  S1, S2, S3, S4, S5, S6, S7,
};

function AdminRouter() {
  const { currentPage } = useAdmin();
  const Page = pageMap[currentPage] || Login;
  return <Page />;
}

export default function AdminApp() {
  return (
    <AdminProvider>
      <AdminRouter />
    </AdminProvider>
  );
}
