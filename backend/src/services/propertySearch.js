const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SORT_FIELDS = ["L_SystemPrice", "ListingContractDate", "LM_Int2_3", "L_Keyword2"];

const ALLOWED_QUERY_PARAMS = [
  "city",
  "zipcode",
  "minPrice",
  "maxPrice",
  "beds",
  "baths",
  "limit",
  "offset",
  "sortBy",
  "sortOrder",
];

const PROPERTY_SELECT_FIELDS = [
  "id",
  "L_ListingID",
  "L_DisplayId",
  "L_Address",
  "L_City",
  "L_State",
  "L_Zip",
  "L_SystemPrice",
  "L_Keyword2",
  "LM_Dec_3",
  "LM_Int2_3",
  "L_Photos",
  "PhotoCount",
  "L_Status",
  "ModificationTimestamp",
  "ListingContractDate",
];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function ensureAllowedParams(query) {
  const allowed = new Set(ALLOWED_QUERY_PARAMS);
  const unknownParam = Object.keys(query).find((key) => !allowed.has(key));

  if (unknownParam) {
    throw new ValidationError(
      `Unsupported query parameter "${unknownParam}". Allowed parameters: ${ALLOWED_QUERY_PARAMS.join(", ")}.`
    );
  }
}

function getSingleValue(query, name) {
  const value = query[name];

  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw new ValidationError(`"${name}" must be provided only once.`);
  }

  return String(value);
}

function parseTextParam(query, name) {
  const value = getSingleValue(query, name);

  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ValidationError(`"${name}" cannot be empty.`);
  }

  return trimmed;
}

function parseIntegerParam(query, name, options = {}) {
  const value = getSingleValue(query, name);

  if (value === undefined) {
    return options.defaultValue;
  }

  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    throw new ValidationError(`"${name}" must be a non-negative integer.`);
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    throw new ValidationError(`"${name}" is too large.`);
  }

  if (options.min !== undefined && parsed < options.min) {
    throw new ValidationError(`"${name}" must be at least ${options.min}.`);
  }

  if (options.max !== undefined && parsed > options.max) {
    throw new ValidationError(`"${name}" must be at most ${options.max}.`);
  }

  return parsed;
}

function parseNumberParam(query, name) {
  const value = getSingleValue(query, name);

  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new ValidationError(`"${name}" must be a non-negative number.`);
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`"${name}" must be a finite number.`);
  }

  return parsed;
}

function parsePropertySearchQuery(query) {
  ensureAllowedParams(query);

  const sortBy = parseTextParam(query, "sortBy");
  const sortOrder = parseTextParam(query, "sortOrder");
  if (sortBy !== undefined && !SORT_FIELDS.includes(sortBy)) {
    throw new ValidationError(`"sortBy" must be one of: ${SORT_FIELDS.join(", ")}.`);
  }
  if (sortOrder !== undefined && !["asc", "desc"].includes(sortOrder)) {
    throw new ValidationError('"sortOrder" must be "asc" or "desc".');
  }
  if (sortOrder !== undefined && sortBy === undefined) {
    throw new ValidationError('"sortOrder" requires "sortBy".');
  }

  const parsed = {
    city: parseTextParam(query, "city"),
    zipcode: parseTextParam(query, "zipcode"),
    minPrice: parseNumberParam(query, "minPrice"),
    maxPrice: parseNumberParam(query, "maxPrice"),
    beds: parseIntegerParam(query, "beds"),
    baths: parseNumberParam(query, "baths"),
    sortBy,
    sortOrder: sortBy === undefined ? undefined : sortOrder || "asc",
    limit: parseIntegerParam(query, "limit", {
      defaultValue: DEFAULT_LIMIT,
      min: 1,
      max: MAX_LIMIT,
    }),
    offset: parseIntegerParam(query, "offset", {
      defaultValue: 0,
      min: 0,
    }),
  };

  if (
    parsed.minPrice !== undefined &&
    parsed.maxPrice !== undefined &&
    parsed.minPrice > parsed.maxPrice
  ) {
    throw new ValidationError('"minPrice" must be less than or equal to "maxPrice".');
  }

  return parsed;
}

function buildPropertyWhereClause(filters) {
  const conditions = [];
  const values = [];

  if (filters.city !== undefined) {
    conditions.push("LOWER(TRIM(L_City)) = LOWER(TRIM(?))");
    values.push(filters.city);
  }

  if (filters.zipcode !== undefined) {
    conditions.push("L_Zip = ?");
    values.push(filters.zipcode);
  }

  if (filters.minPrice !== undefined) {
    conditions.push("L_SystemPrice >= ?");
    values.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push("L_SystemPrice <= ?");
    values.push(filters.maxPrice);
  }

  if (filters.beds !== undefined) {
    conditions.push("L_Keyword2 = ?");
    values.push(filters.beds);
  }

  if (filters.baths !== undefined) {
    conditions.push("LM_Dec_3 = ?");
    values.push(filters.baths);
  }

  return {
    conditions,
    values,
    whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
  };
}

function buildPropertySearchSql(filters) {
  const { whereClause, values } = buildPropertyWhereClause(filters);
  const selectedFields = PROPERTY_SELECT_FIELDS.join(", ");
  // SQL identifiers cannot use value placeholders. Only interpolate validated constants.
  if (filters.sortBy !== undefined && !SORT_FIELDS.includes(filters.sortBy)) {
    throw new ValidationError("Invalid sort field.");
  }
  if (filters.sortBy !== undefined && !["asc", "desc"].includes(filters.sortOrder)) {
    throw new ValidationError("Invalid sort order.");
  }
  const orderBy = filters.sortBy === undefined
    ? "id ASC"
    : `${filters.sortBy} ${filters.sortOrder.toUpperCase()}, id ASC`;

  return {
    countSql: `SELECT COUNT(*) AS total FROM rets_property ${whereClause}`.trim(),
    countValues: values,
    resultsSql: `SELECT ${selectedFields} FROM rets_property ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`.trim(),
    resultsValues: [...values, filters.limit, filters.offset],
  };
}

async function searchProperties(db, query) {
  const filters = parsePropertySearchQuery(query);
  const { countSql, countValues, resultsSql, resultsValues } =
    buildPropertySearchSql(filters);

  const [countRows] = await db.query(countSql, countValues);
  const [rows] = await db.query(resultsSql, resultsValues);

  return {
    total: Number(countRows[0]?.total || 0),
    limit: filters.limit,
    offset: filters.offset,
    results: rows,
  };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  ValidationError,
  buildPropertySearchSql,
  buildPropertyWhereClause,
  parsePropertySearchQuery,
  searchProperties,
};
