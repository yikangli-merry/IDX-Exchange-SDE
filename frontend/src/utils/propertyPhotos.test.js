import { getFirstPropertyPhoto, getPropertyPhotos } from "./propertyPhotos";

test("parses all usable photo URLs in order and trims whitespace", () => {
  expect(getPropertyPhotos('[null,"bad"," https://example.com/one.jpg ",42,"javascript:alert(1)","http://example.com/two.jpg"]')).toEqual(["https://example.com/one.jpg", "http://example.com/two.jpg"]);
});

test("accepts an already parsed full photo array", () => {
  expect(getPropertyPhotos(["https://example.com/one.jpg", "https://example.com/two.jpg"])).toHaveLength(2);
});

test.each([undefined, null, "", "broken", "{}", "null", '"https://example.com/a.jpg"', "[]"])("full parser safely returns an empty array for %p", (value) => {
  expect(getPropertyPhotos(value)).toEqual([]);
});

test("returns the first URL from the database JSON string", () => {
  expect(getFirstPropertyPhoto('["https://example.com/first.jpg","https://example.com/second.jpg"]')).toBe("https://example.com/first.jpg");
});

test("accepts an already parsed array and trims the URL", () => {
  expect(getFirstPropertyPhoto([" https://example.com/home.jpg "])).toBe("https://example.com/home.jpg");
});

test.each([
  undefined, null, "", "   ", "not json", '["broken"', "null", "{}", '"https://example.com/home.jpg"',
  "[]", "[null]", "[42]", '[""]', '["not-a-url"]', '["javascript:alert(1)"]',
  '[null,"https://example.com/second.jpg"]',
])("safely returns no photo for %p", (value) => {
  expect(getFirstPropertyPhoto(value)).toBeNull();
});
