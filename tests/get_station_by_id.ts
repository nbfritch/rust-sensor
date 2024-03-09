const url = (id: number) => `http://127.0.0.1:3000/api/stations/${id}`;

const existingStation = await (await fetch(url(1))).json();
console.log(existingStation);

const nonExistingStation = await (await fetch(url(100))).json();
console.log(nonExistingStation);

export {};
