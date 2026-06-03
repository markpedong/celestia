import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import { getSessionUser } from '@/lib/auth';

type Props = {};

const Home = async (props: Props) => {
  const sessionUser = await getSessionUser();
  const rows = await listPostSorted();

  return (
    <div>
      <div>
        <FeedSortTabs />
        <div></div>
      </div>
    </div>
  );
};

export default Home;
