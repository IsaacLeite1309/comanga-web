import { EditMangasView } from "../components/EditMangasView";
import { useEditMangasPage } from "../hooks/useEditMangasPage";

const EditMangas = () => {
  const model = useEditMangasPage();
  return <EditMangasView model={model} />;
};

export default EditMangas;
