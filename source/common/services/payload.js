export function destructPayload(values, payload) {
  const obj = {};

  values.forEach(value => {
    obj[value] = payload[value];
  });

  return obj;
}
