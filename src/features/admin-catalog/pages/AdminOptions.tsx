import { AdminOptionsView } from "../components/AdminOptionsView";
import { useAdminOptionsPage } from "../hooks/useAdminOptionsPage";

const AdminOptions = () => {
  const model = useAdminOptionsPage();
  return <AdminOptionsView model={model} />;
};

export default AdminOptions;
