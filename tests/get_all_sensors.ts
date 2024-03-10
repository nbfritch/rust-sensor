const url = "http://127.0.0.1:3000/api/sensors";

const allSensors = await (await fetch(url)).json();
console.log(allSensors);

export {};
