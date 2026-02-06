import ShopClient from '../../components/ShopClient';
import { fetchIconProducts, fetchKeypadProducts } from '../../lib/vendure.server';

type SearchParams = {
  q?: string | string[];
  cat?: string | string[];
};

export default async function ShopPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [icons, keypads] = await Promise.all([
    fetchIconProducts(),
    fetchKeypadProducts()
  ]);

  const query = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : '';
  const category = typeof resolvedSearchParams?.cat === 'string' ? resolvedSearchParams.cat : '';

  return (
    <ShopClient
      icons={icons}
      keypads={keypads}
      initialQuery={query}
      initialCategory={category}
    />
  );
}
