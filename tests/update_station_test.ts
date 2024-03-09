const url = "http://127.0.0.1:3000/api/stations";

const testStation = await (await fetch(`${url}/6`)).json();

const baseStation = {
  id: testStation.id,
  station_name: testStation.station_name,
  station_display_name: testStation.station_display_name,
  station_description: testStation.station_description,
};

const updatedStation = {
  ...baseStation,
  station_display_name: "Test",
  station_description: "Test",
};
const updatedStationResult = await (await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedStation),
})).text();
console.log(updatedStationResult);

const overlappingNameStation = {
  ...baseStation,
  station_name: "bedroom",
};

const overlappingNameStationResult = await (await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(overlappingNameStation),
})).text();
console.log(overlappingNameStationResult);

const invalidIdStation = {
  ...baseStation,
  id: 23,
};

const invalidIdStationResult = await (await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(invalidIdStation),
})).text();
console.log(invalidIdStationResult);


export { };
