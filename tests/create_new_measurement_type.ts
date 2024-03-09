const url = "http://127.0.0.1:3000/api/measurement_type";

const measurement_type = {
  name: "blonks_per_boink",
};

const createRes = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(measurement_type),
})).text();
console.log(createRes);

const invalidType = {
  name: "b",
};

const invalidRes = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(invalidType),
})).text();
console.log(invalidRes);

export {};
