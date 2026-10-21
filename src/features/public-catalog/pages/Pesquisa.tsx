import { usePesquisaCatalog } from '../hooks/usePesquisaCatalog';

import { TabSelector, SearchInput, PrimaryFilters, AdvancedFilters } from '../components/PesquisaFilters';
import { ResultsSummary, CatalogResults } from '../components/PesquisaResults';

const Pesquisa = () => {
  const catalog = usePesquisaCatalog();
  return (
    <div className="min-w-0 flex-1 px-4 pb-7 pt-7 sm:px-6 sm:pb-9 xl:px-10">
      <div className="mx-auto w-full max-w-[100rem]">
        <div className="relative z-30">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <TabSelector catalog={catalog} />
            <fieldset disabled={catalog.loading} className="flex min-w-0 flex-1 flex-col gap-3 border-0 p-0 xl:flex-row xl:items-end">
              <SearchInput catalog={catalog} />
              <PrimaryFilters catalog={catalog} />
            </fieldset>
          </div>
          <fieldset disabled={catalog.loading} className="min-w-0 border-0 p-0">
            <AdvancedFilters catalog={catalog} />
          </fieldset>
        </div>
        <ResultsSummary catalog={catalog} />
        <div className="mt-6">
          <CatalogResults catalog={catalog} />
        </div>
      </div>
    </div>
  );
};

export default Pesquisa;
