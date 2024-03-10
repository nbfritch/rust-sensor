const url = "http://127.0.0.1:3000/api/sensors";
const validSesnsor = {
  sensor_name: 'phototransistor',
  measurement_type_id:  1,
};

const nullSesnsor = {
  sensor_name: null,
  measurement_type_id: null,
};

const invalidSesnsor = {
  sensor_name: 'a',
  measurement_type_id: 1,
};

const duplicateNameSesnsor = {
  sensor_name: 'phototransistor',
  measurement_type_id: 1,
};

const validSesnsorResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(validSesnsor),
})).json();

console.log(validSesnsorResult);

const nullSesnsorResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(nullSesnsor),
})).text();

console.log(nullSesnsorResult);

const invalidSesnsorResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(invalidSesnsor),
})).text();

console.log(invalidSesnsorResult);

const duplicateNameSesnsorResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(duplicateNameSesnsor),
})).text();
console.log(duplicateNameSesnsorResult);

export {};
