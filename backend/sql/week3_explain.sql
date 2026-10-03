-- Week 3 EXPLAIN checks for /api/properties.
-- Run before and after backend/sql/week3_property_indexes.sql.

EXPLAIN
SELECT id, L_ListingID, L_Address, L_City, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3
FROM rets_property
ORDER BY id ASC
LIMIT 20 OFFSET 0;

EXPLAIN
SELECT id, L_ListingID, L_Address, L_City, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3
FROM rets_property
WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine'))
ORDER BY id ASC
LIMIT 20 OFFSET 0;

EXPLAIN
SELECT id, L_ListingID, L_Address, L_City, L_Zip, L_SystemPrice, L_Keyword2, LM_Dec_3, LM_Int2_3
FROM rets_property
WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine'))
  AND L_SystemPrice >= 300000
  AND L_Keyword2 = 3
ORDER BY id ASC
LIMIT 20 OFFSET 0;

EXPLAIN
SELECT COUNT(*) AS total
FROM rets_property
WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Irvine'))
  AND L_SystemPrice >= 300000
  AND L_Keyword2 = 3;
