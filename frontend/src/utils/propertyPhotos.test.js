import { getFirstPropertyPhoto } from "./propertyPhotos";

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
