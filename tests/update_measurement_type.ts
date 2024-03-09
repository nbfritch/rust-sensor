const url = "http://127.0.0.1:3000/api/measurement_type";

const baseMt = {
  id: 1,
  name: "ambient_temperature",
};

const updatedMt = {
  ...baseMt,
  name: "scumbus"
};
const updatedMtResult = await (await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedMt),
})).text();
console.log(updatedMtResult);

const invalidMt = {
  ...baseMt,
  name: "s"
};
const invalidMtResult = await (await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(invalidMt),
})).text();
console.log(invalidMtResult);

const notExistMt = {
  ...baseMt,
  id: 128,
};
const notExistMtResult = await (await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(notExistMt),
})).text();
console.log(notExistMtResult);

export {};
