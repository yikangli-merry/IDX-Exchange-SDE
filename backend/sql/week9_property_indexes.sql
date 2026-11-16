-- MySQL 8.0.13+: functional key parts match the API's normalized city expression.
-- Check SHOW INDEX first and skip any CREATE whose name already exists.
-- Apply once, after capturing a baseline with week9_explain.sql.
-- These indexes are additive; they do not change or normalize stored data.

SHOW INDEX FROM rets_property;

-- The imported legacy schema has a zero-date default on active_check.
-- Permit that existing default during DDL in this connection only. Keep strict
-- mode and every other validation setting, and restore the mode afterwards.
SET @week9_previous_sql_mode = @@SESSION.sql_mode;
SET SESSION sql_mode = TRIM(BOTH ',' FROM REPLACE(REPLACE(
  CONCAT(',', @@SESSION.sql_mode, ','), ',NO_ZERO_DATE,', ','), ',NO_ZERO_IN_DATE,', ','));

CREATE INDEX idx_rets_property_city_normalized_beds_price
  ON rets_property ((LOWER(TRIM(L_City))), L_Keyword2, L_SystemPrice);

CREATE INDEX idx_rets_property_zip_beds_price
  ON rets_property (L_Zip, L_Keyword2, L_SystemPrice);

SET SESSION sql_mode = @week9_previous_sql_mode;

SHOW INDEX FROM rets_property;

-- Optional rollback of ONLY the two Week 9 indexes:
-- DROP INDEX idx_rets_property_city_normalized_beds_price ON rets_property;
-- DROP INDEX idx_rets_property_zip_beds_price ON rets_property;
