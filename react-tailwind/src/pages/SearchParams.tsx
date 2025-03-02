import useSearchParam from '@/hooks/useSearchParam';

function SearchParams() {
  const [query, setQuery] = useSearchParam('query');
  const [tag, setTag] = useSearchParam('tag');
  const [category, setCategory] = useSearchParam('category');
  const [sort, setSort] = useSearchParam('sort');

  return (
    <div>
      <h1>Search Params</h1>
      <form className="flex flex-col gap-3">
        <div>
          <label htmlFor="query">Query: </label>
          <input
            id="query"
            type="text"
            className="border"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label htmlFor="tag">Tag: </label>
          <input
            id="tag"
            type="text"
            className="border"
            value={tag}
            onChange={e => setTag(e.target.value)}
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label htmlFor="category">Category: </label>
          <select id="category" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="energy-drink">Energy Drink</option>
            <option value="coffee">Coffee</option>
            <option value="water">Water</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="select-none">
            Sort Descending:{' '}
          </label>
          <input
            type="checkbox"
            id="sort"
            checked={sort === 'on'}
            onChange={e => {
              setSort(e.currentTarget.checked ? 'on' : 'off');
            }}
          />
        </div>
      </form>
    </div>
  );
}

export default SearchParams;
