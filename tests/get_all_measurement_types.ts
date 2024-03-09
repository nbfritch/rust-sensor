const url = "http://127.0.0.1:3000/api/measurement_type"

const getResult = await (await fetch(url)).text()
console.log(getResult);

export {};
