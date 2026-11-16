const OPTIONS = [
  ["", "Default order"],
  ["L_SystemPrice:asc", "Price: low to high"],
  ["L_SystemPrice:desc", "Price: high to low"],
  ["ListingContractDate:desc", "Date listed: newest first"],
  ["ListingContractDate:asc", "Date listed: oldest first"],
  ["LM_Int2_3:desc", "Square footage: largest first"],
  ["LM_Int2_3:asc", "Square footage: smallest first"],
  ["L_Keyword2:desc", "Beds: most first"],
  ["L_Keyword2:asc", "Beds: fewest first"],
];

export default function SortControls({ sorting, onChange }) {
  const value = sorting.sortBy ? `${sorting.sortBy}:${sorting.sortOrder || "asc"}` : "";
  return (
    <label className="sort-control" htmlFor="property-sort">
      <span>Sort by</span>
      <select id="property-sort" value={value} onChange={(event) => {
        const [sortBy, sortOrder] = event.target.value.split(":");
        onChange(sortBy ? { sortBy, sortOrder } : {});
      }}>
        {OPTIONS.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
      </select>
    </label>
  );
}
