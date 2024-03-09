const url = "http://127.0.0.1:3000/api/stations";
const stations = await (await fetch(url)).json();
console.log(stations);

export {};
