const url = "http://127.0.0.1:3000/api/sensors/1";

const sensor = await (await fetch(url)).json();
console.log(sensor);

export {};
