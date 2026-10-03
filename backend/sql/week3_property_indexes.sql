-- Week 3 property search indexes.
-- Run this against the local `rets` database after importing `rets_property`.

SHOW INDEX FROM rets_property;

CREATE INDEX idx_rets_property_price
  ON rets_property (L_SystemPrice);

CREATE INDEX idx_rets_property_beds
  ON rets_property (L_Keyword2);

CREATE INDEX idx_rets_property_baths
  ON rets_property (LM_Dec_3);

CREATE INDEX idx_rets_property_city_price_beds
  ON rets_property (L_City, L_SystemPrice, L_Keyword2);

SHOW INDEX FROM rets_property;

-- If your local database is MySQL 8.0.13 or newer, this optional functional
-- index can help the normalized city comparison used by /api/properties.
-- CREATE INDEX idx_rets_property_city_normalized
--   ON rets_property ((LOWER(TRIM(L_City))));
