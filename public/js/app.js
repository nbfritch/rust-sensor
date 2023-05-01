// Generic constants
const degreesF = '°F';

// DOM constants
const cursorElementId = 'cursor';
const currentTimeId = 'current-time';
const burgerId = 'burger';
const mainNavId = 'mainNavbar'
const graphElementId = 'graph';
const dataLookupElementId = 'data-lookup';
const hoveredDateId = 'current-time';
const xAxisLegend = 'x-axis-legend';
const xAxisTicks = 'x-axis-ticks';
const yAxisTicks = 'y-axis-ticks';
const xAxisPad = 40;
const yAxisPad = 40;

// Backend data
let sharedData = {};
let svgContext = null;

const colorLut = ["red", "green", "blue", "orange", "purple"];

// Keep track of the current width/height of the svg
class SvgContext {
  constructor(width, height, minTemp, maxTemp, minTime, maxTime) {
    this.width = width;
    this.height = height;
    this.minTemp = minTemp;
    this.maxTemp = maxTemp;
    this.minTime = minTime;
    this.maxTime = maxTime;
  }

  // Scale a temperature to an amount of px
  tempToPx(temp) {
    const tempRange = this.maxTemp - this.minTemp;
    return Math.floor(this.height - (((temp - this.minTemp) / tempRange) * this.height));
  }

  // Scale a time to an amount of px
  timeToPx(time) {
    const timeWidth = this.maxTime - this.minTime;
    const timeOffset = time - this.minTime;
    const percent = timeOffset / timeWidth;
    const px = percent * this.width;
    return (xAxisPad + px).toFixed(2);
  }

  // Convert px hover value on svg to a time
  pxToTime(px) {
    const timeWidth = this.maxTime - this.minTime;
    const percent = (px - xAxisPad) / this.width;
    const time = (timeWidth * percent) + this.minTime;
    return time;
  }
}

const renderSvgLine = (c, sensorId, data) => {
  let op = 'M'
  let firstInstructionDone = false;
  data.sort((a, b) => b.reading_date - a.reading_date);
  let instruction = ''
  for (let v of data) {
    const xpx = c.timeToPx(v.reading_date);
    const ypx = c.tempToPx(v.temperature);
    instruction = `${instruction}${op}${xpx},${ypx} `;
    if (!firstInstructionDone) {
      firstInstructionDone = true;
      op = 'L'
    }
  }
  return instruction;
};

const anHourAndOneMinute = (60 * 61) * 1000;
const twentyFourHours = (24 * 60 * 60) * 1000;
const aWeek = 7 * twentyFourHours;

const redrawCursor = c => {
  const existingCursor = document.getElementById(cursorElementId);
  const dataFragments = existingCursor.getAttribute('d').split(' ');
  const heightRemoved = dataFragments.slice(0, dataFragments.length - 1);
  existingCursor.setAttribute('d', [...heightRemoved, `${c.height}`].join(' '));
}

const redrawTemperatureLegend = (c) => {
  const existingLegendElements = document.getElementById(xAxisLegend);
  if (existingLegendElements != null && existingLegendElements.length != 0) {
    [...existingLegendElements.children].forEach(el => {
      if (el.hasAttribute('data-temperature')) {
        const temp = parseInt(el.getAttribute('data-temperature'));
        if (temp < c.minTemp || temp > c.maxTemp) {
          existingLegendElements.removeChild(el)
        } else {
          el.setAttribute('y', c.tempToPx(temp));
        }
      }
    });
  }
};

const reDrawAxisLines = (c) => {
  // Destroy current lines
  let xTicksContainer = document.getElementById(xAxisTicks);
  let yTicksContainer = document.getElementById(yAxisTicks);
  [...xTicksContainer.children].forEach(c => c.remove());
  [...yTicksContainer.children].forEach(c => c.remove());

  const start = Math.floor(c.minTemp);
  const end = Math.ceil(c.maxTemp);
  for (let i = start; i < end; i++) {
    // Make a horizontal line
    const px = c.tempToPx(i);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', `M ${yAxisPad} ${px} H ${c.width}`);
    line.setAttribute('fill', 'none');
    if (i === 68) {
      line.setAttribute('stroke', 'maroon');
      line.setAttribute('stroke-width', '2');
    } else {
      line.setAttribute('stroke', 'lightgray');
      line.setAttribute('stroke-width', '1');
    }

    xTicksContainer.appendChild(line);
  }


  const timeDiff = c.maxTime - c.minTime
  let timeStepSize = 0;
  if (timeDiff > 0 && timeDiff < anHourAndOneMinute) {
    timeStepSize = 5 * 60 * 1000 // 5 minutes
  } else if (timeDiff >= anHourAndOneMinute && timeDiff < twentyFourHours) {
    timeStepSize = 60 * 60 * 1000 // An hour
  } else if (timeDiff >= twentyFourHours && timeDiff < aWeek) {
    timeStepSize = 4 * 60 * 60 * 1000 // Four hours
  } else {
    timeStepSize = 24 * 60 * 60 * 1000
  }

  for (let i = c.minTime; i < c.maxTime; i = i + timeStepSize) {
    let px = c.timeToPx(i);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', `M ${px} 0 V ${c.height}`);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', 'lightgray');
    line.setAttribute('stroke-width', '1');
    yTicksContainer.appendChild(line);
  }
};

const lineContainerId = "lines-container";
const getOrCreateLine = (id) => {
  const el = document.getElementById(`line-${id}`);
  if (el != null) {
    return el;
  }

  const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  newLine.setAttribute("id", `line-${id}`);
  newLine.setAttribute("fill", "none");
  newLine.setAttribute("stroke-width", "2");
  newLine.setAttribute("stroke", colorLut[id]);
  const container = document.getElementById(lineContainerId);
  container.appendChild(newLine);
  return newLine;
};

const redrawGraph = () => {
  reDrawAxisLines(svgContext);
  redrawTemperatureLegend(svgContext);
  redrawCursor(svgContext);
  for (let sensor of sharedData) {
    let el = getOrCreateLine(sensor.id);
    el.setAttribute('d', renderSvgLine(svgContext, sensor, sensor.points));
  }
};

const prettyDate = (fdate) => {
  let date = fdate;
  if (date < 2000000000) {
    date = date * 1000;
  }
  const d = typeof date === 'object' ? date : new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minutes = d.getMinutes();
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const displayHours = hour == 12 || hour == 0 ? 12 : hour % 12;
  const displayMinutes = minutes < 10 ? `0${minutes} ${amPm}` : `${minutes} ${amPm}`

  return `${month}/${day} ${displayHours}:${displayMinutes}`;
};

const handleCursorEnter = (_e) => {
  const cursorEl = document.getElementById(cursorElementId);
  if (cursorEl.hasAttribute('style')) {
    cursorEl.removeAttribute('style');
  }
};

const handleCursorLeave = (_e) => {
  const cursorEl = document.getElementById(cursorElementId);
  if (!cursorEl.hasAttribute('style')) {
    cursorEl.setAttribute('style', 'display: none;');
  }
};

const handleSvgTouchStart = (_e) => {
  const cursorEl = document.getElementById(cursorElementId);
  if (cursorEl.hasAttribute('style')) {
    cursorEl.removeAttribute('style');
  }
};

const handleSvgTouchEnd = (touchEv) => {
  const touch = touchEv.changedTouches[0];
  const x = touch.clientX;
  if (x > xAxisPad) {
    const cursorEl = document.getElementById(cursorElementId);
    cursorEl.setAttribute('d', `M ${x} 0 V ${svgContext.height || 800}`);
  }

  renderTempsForCursor(svgContext, x);
};

const handleTouchOnSvg = (touchEv) => {
  const touch = touchEv.touches[0];
  const x = touch.clientX;
  if (x > xAxisPad) {
    const cursorEl = document.getElementById(cursorElementId);
    cursorEl.setAttribute('d', `M ${x} 0 V ${svgContext.height || 800}`);
  }

  renderTempsForCursor(svgContext, x);
}

const handleCursorMoveOnSvg = (ev) => {
  const rect = ev.target.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  if (x > xAxisPad) {
    const cursorEl = document.getElementById(cursorElementId);
    cursorEl.setAttribute('d', `M ${x} 0 V ${svgContext.height || 800}`);
  }

  renderTempsForCursor(svgContext, x);
};

const calculateTempsForX = (c, x) => {
  const time = c.pxToTime(x);
  const temps = sharedData.map(k => {
    const dataForSensor = k.points;
    const closestTemp = dataForSensor.reduce((acc, i) => {
      const d = i.reading_date;
      if (acc.reading_date === -1 || Math.abs(d - time) < Math.abs(acc.reading_date - time)) {
        return i;
      }
      return acc;
    }, { temperature: -1, reading_date: -1 });

    return { id: k.id, temperature: Math.round(closestTemp.temperature * 100) / 100, reading_date: prettyDate(closestTemp.reading_date) };
  });

  return temps;
};

const renderTempsForCursor = (c, x) => {
  const temps = calculateTempsForX(c, x);
  for (const temp of temps) {
    const legendElement = document.getElementById(`temp-${temp.id}`);
    legendElement.innerText = `${temp.temperature}${degreesF}`;
  }

  const dateOutputElement = document.getElementById(currentTimeId);
  dateOutputElement.textContent = `${temps[0].reading_date}`;
};

const createLegend = (data) => {
  const legendContainer = document.getElementById("legend");
  if (legendContainer == null) {
    throw new Error("Cannot find legend container");
  }

  data.forEach(sensor => {
    const legendId = `legend-${sensor.id}`;
    if (document.getElementById(legendId) != null) {
      return;
    }
    const legendEl = document.createElement("div");
    legendEl.setAttribute("id", legendId);
    legendEl.classList.add("graph-legend");
    legendContainer.appendChild(legendEl);

    const swatch = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    swatch.setAttribute("id", `legend-swatch-${sensor.id}`);
    swatch.setAttribute("height", "16");
    swatch.setAttribute("width", "26");
    legendEl.appendChild(swatch);

    const swatchRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    swatchRect.setAttribute("x", "0");
    swatchRect.setAttribute("y", "0");
    swatchRect.setAttribute("height", "16");
    swatchRect.setAttribute("width", "16");
    swatchRect.setAttribute("fill", colorLut[sensor.id]);
    swatchRect.setAttribute("stroke", "black");
    swatchRect.setAttribute("stroke-width", "1");

    swatch.appendChild(swatchRect);

    const sensorNameEl = document.createElement("span");
    sensorNameEl.innerText = `${sensor.description} `;
    legendEl.appendChild(sensorNameEl);

    const sensorTempEl = document.createElement("span");
    sensorTempEl.setAttribute("id", `temp-${sensor.id}`);
    sensorTempEl.innerText = "69";
    legendEl.appendChild(sensorTempEl);
  });
};

const parseMetadata = (data) => {
  let minTemp = 1000;
  let maxTemp = -1;
  let minTime = null;
  let maxTime = -1;
  data.forEach(d => {
    d.points.forEach(y => {
      if (y.temperature < minTemp) {
        minTemp = y.temperature;
      }

      if (y.temperature > maxTemp) {
        maxTemp = y.temperature;
      }

      if (minTime == null || y.reading_date < minTime) {
        minTime = y.reading_date;
      }

      if (y.reading_date > maxTemp) {
        maxTime = y.reading_date;
      }
    });
  });

  const minDateEl = document.getElementById("min-time");
  const maxDateEl = document.getElementById("max-time");

  minDateEl.innerText = prettyDate(minTime);
  maxDateEl.innerHTML = prettyDate(maxTime);

  return {
    minTemp: minTemp - 1,
    maxTemp: maxTemp + 1,
    minTime,
    maxTime,
  };
};

const fetchData = async (timespan) => {
  const rawData = await (await fetch(`${window.location.origin}/api/graph?last=${timespan}`)).json()

  const data = rawData.map(line => ({
    ...line,
    points: line.points.map(p =>
      ({ ...p, reading_date: p.reading_date * 1000 })
    )
  }));

  sharedData = data;
  sharedData.meta = parseMetadata(data);
};

const parseHash = () => {
  const filter = (window.location.hash || "").replace("#", "");
  if (!["hour", "day", "week", "month"].includes(filter)) {
    return "hour";
  }

  return filter;
};

const parseAndFetch = async () => {
  const search = parseHash();
  await fetchData(search);
}

const main = async () => {
  await parseAndFetch()
  createLegend(sharedData);

  const cursorReader = document.getElementById(graphElementId);
  svgContext = new SvgContext(
    Math.floor(cursorReader.clientWidth),
    Math.floor(cursorReader.clientHeight),
    sharedData.meta.minTemp,
    sharedData.meta.maxTemp,
    sharedData.meta.minTime,
    sharedData.meta.maxTime
  );

  redrawGraph();
};

document.addEventListener('DOMContentLoaded', (_e) => {
  const burgerElement = document.getElementById(burgerId);
  burgerElement.addEventListener('click', (_ev) => {
    const target = document.getElementById(mainNavId);
    target.classList.toggle('is-active');
    burgerElement.classList.toggle('is-active');
  });

  const dropdown = document.getElementById("nav-dropdown");

  const graph = document.getElementById(graphElementId);
  if (graph != null) {
    window.addEventListener('hashchange', async () => {
      main();

      burgerElement.classList.remove("is-active");
      dropdown.classList.remove("is-active");
    });

    let timeout = null;
    window.addEventListener('resize', (_e) => {
      if (timeout != null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        const cursorReader = document.getElementById(graphElementId);
        svgContext.width = Math.floor(cursorReader.clientWidth);
        svgContext.height = Math.floor(cursorReader.clientHeight);
        redrawGraph();
      }, 250);
    });

    graph.addEventListener('touchend', handleSvgTouchEnd);
    graph.addEventListener('touchmove', handleTouchOnSvg);
    graph.addEventListener('mouseenter', handleCursorEnter);
    graph.addEventListener('mouseleave', handleCursorLeave);
    graph.addEventListener('mousemove', handleCursorMoveOnSvg);

    main();
  }
});
