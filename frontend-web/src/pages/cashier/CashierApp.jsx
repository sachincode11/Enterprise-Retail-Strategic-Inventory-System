// src/pages/cashier/CashierApp.jsx
import { CashierProvider, useCashier } from '../../context/CashierContext';

import Login          from './Login';
import Verification   from './Verification';
import Dashboard      from './Dashboard';
import POS            from './POS';
import Products       from './Products';
import Transactions   from './Transactions';
import Profile        from './Profile';
import Receipt        from './Receipt';
import S1General      from './S1General';
import S2BillingPOS   from './S2BillingPOS';
import S3IoTDevices   from './S3IoTDevices';
import S4Notifications from './S4Notifications';
import S5Security     from './S5Security';

const pageMap = {
  login:        Login,
  verification: Verification,
  dashboard:    Dashboard,
  pos:          POS,
  products:     Products,
  transactions: Transactions,
  profile:      Profile,
  receipt:      Receipt,
  s1:           S1General,
  s2:           S2BillingPOS,
  s3:           S3IoTDevices,
  s4:           S4Notifications,
  s5:           S5Security,
};

function CashierRouter() {
  const { currentPage } = useCashier();
  const Page = pageMap[currentPage] || Login;
  return <Page />;
}

export default function CashierApp() {
  return (
    <CashierProvider>
      <CashierRouter />
    </CashierProvider>
  );
}
