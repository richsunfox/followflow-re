import { getListingHistory } from './actions';
import ListingsForm from './ListingsForm';

export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  const history = await getListingHistory();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Listing Writer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter property details and generate MLS copy, an Instagram caption, and a just-listed email — all at once.
        </p>
      </div>
      <ListingsForm history={history} />
    </div>
  );
}
