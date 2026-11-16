-- Week 9: use the exact API projection, normalized filters, and price ordering.
-- Run before and after week9_property_indexes.sql.
-- EXPLAIN ANALYZE executes the SELECT and requires MySQL 8.0.18+.

-- City + beds + price
EXPLAIN SELECT COUNT(*) AS total FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3;
EXPLAIN ANALYZE SELECT COUNT(*) AS total FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3;

EXPLAIN SELECT id, L_ListingID, L_DisplayId, L_Address, L_City, L_State, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3, L_Photos, PhotoCount, L_Status, ModificationTimestamp, ListingContractDate FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 ORDER BY L_SystemPrice ASC, id ASC LIMIT 20 OFFSET 0;
EXPLAIN ANALYZE SELECT id, L_ListingID, L_DisplayId, L_Address, L_City, L_State, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3, L_Photos, PhotoCount, L_Status, ModificationTimestamp, ListingContractDate FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 ORDER BY L_SystemPrice ASC, id ASC LIMIT 20 OFFSET 0;

-- ZIP + beds + price
EXPLAIN SELECT COUNT(*) AS total FROM rets_property WHERE L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3;
EXPLAIN ANALYZE SELECT COUNT(*) AS total FROM rets_property WHERE L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3;

EXPLAIN SELECT id, L_ListingID, L_DisplayId, L_Address, L_City, L_State, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3, L_Photos, PhotoCount, L_Status, ModificationTimestamp, ListingContractDate FROM rets_property WHERE L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 ORDER BY L_SystemPrice ASC, id ASC LIMIT 20 OFFSET 0;
EXPLAIN ANALYZE SELECT id, L_ListingID, L_DisplayId, L_Address, L_City, L_State, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3, L_Photos, PhotoCount, L_Status, ModificationTimestamp, ListingContractDate FROM rets_property WHERE L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 ORDER BY L_SystemPrice ASC, id ASC LIMIT 20 OFFSET 0;

-- All six filters
EXPLAIN SELECT COUNT(*) AS total FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 AND LM_Dec_3 = 3;
EXPLAIN ANALYZE SELECT COUNT(*) AS total FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 AND LM_Dec_3 = 3;

EXPLAIN SELECT id, L_ListingID, L_DisplayId, L_Address, L_City, L_State, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3, L_Photos, PhotoCount, L_Status, ModificationTimestamp, ListingContractDate FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 AND LM_Dec_3 = 3 ORDER BY L_SystemPrice ASC, id ASC LIMIT 20 OFFSET 0;
EXPLAIN ANALYZE SELECT id, L_ListingID, L_DisplayId, L_Address, L_City, L_State, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3, L_Photos, PhotoCount, L_Status, ModificationTimestamp, ListingContractDate FROM rets_property WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine')) AND L_Zip = '92618' AND L_SystemPrice >= 300000 AND L_SystemPrice <= 1500000 AND L_Keyword2 = 3 AND LM_Dec_3 = 3 ORDER BY L_SystemPrice ASC, id ASC LIMIT 20 OFFSET 0;
