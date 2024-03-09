const url = "http://127.0.0.1:3000/api/stations";
const validStation = {
  station_name: 'basement-rpi-2',
  station_display_name: 'Basement Raspberry Pi 2',
  station_description: null
};

const nullStation = {
  station_name: null,
  station_display_name: null,
  station_description: null,
};

const invalidStation = {
  station_name: 'a',
  station_display_name: 'A cool station',
  station_description: 'Such a cool station',
};

const duplicateNameStation = {
  station_name: 'bedroom',
  station_display_name: 'Bed Boye',
  staiton_description: 'Bedroom Boye',
};

const validStationResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(validStation),
})).json();

console.log(validStationResult);

const nullStationResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(nullStation),
})).text();

console.log(nullStationResult);

const invalidStationResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(invalidStation),
})).text();

console.log(invalidStationResult);

const duplicateNameStationResult = await (await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(duplicateNameStation),
})).text();
console.log(duplicateNameStationResult);

export {};
