import { CanvasLineGraphRenderer, ReadingTimePoint } from './graph';
import './style.css'
import './bulma.min.css'

let refreshHandle: (() => void) | null = null;

let readingType = 1;
const searchBarId = 'history-search';
const readingSelectId = 'readingTypeSelect';

const bindSelect = () => {
  const selectEl = "selel";
  const readingSelectEl = document.getElementById(selectEl);
  readingSelectEl?.addEventListener('input', (e) => {
    readingType = (e.target as HTMLSelectElement).value as unknown as number;
    if (refreshHandle != null) {
      refreshHandle();
    }
  });
};

type ApiResponse = Array<{id: string; name: string; description: string; points: Array<ReadingTimePoint>}>

const fetchData = async (timespan: string): Promise<ApiResponse> => {
  const graphDataResponse = await fetch(`/api/graph?last=${timespan}&reading_type=${readingType}`, {headers: {mode: 'no-cors'}});
  return (await graphDataResponse.json()) as ApiResponse;
};

const fetchHistory = async (year: string, month: string, day: string): Promise<ApiResponse> => {
  const graphDataResponse = await fetch(`/api/history?year=${year}&month=${month}&day=${day}&reading_type=${readingType}`, {headers: {mode: 'no-cors'}});
  return (await graphDataResponse.json()) as ApiResponse;
};

const setSearchbarStyle = () => {
  const hashValue = readHash();
  const searchBar = document.getElementById(searchBarId);
  const readingSelect = document.getElementById(readingSelectId);
  if (searchBar != null) {
    if (hashValue.includes('history')) {
      searchBar.setAttribute("style", '');
    } else {
      searchBar.setAttribute('style', 'display: none');
    }
  }

  if (readingSelect != null) {
    if (['day', 'hour', 'week', 'month', 'history'].includes(hashValue)) {
      readingSelect.setAttribute("style", '');
    } else {
      readingSelect.setAttribute('style', 'display: none');
    }
  }
};

const readHash = () => {
  return window.location.hash.replace('#', '');
};

const stepSizeForHash = (hash: string): number => {
  switch (hash) {
    case 'hour':
      return 3 * 60; // 3 minutes
    case 'day':
      return 60 * 60; // 1 hour
    case 'week':
      return 6 * 60 * 60; // 6 hours;
    case 'month':
      return 24 * 60 * 60; // 24 hours;
    default:
      return 60 * 60;
  }
};

const unitsForReadingType = (rt: number | string): string => {
  const r = typeof rt === 'string' ? parseInt(rt, 10) : rt;
  switch (r) {
    case 1: return '°F';
    case 2: return '%';
    case 3: return 'lm';
    default: return '!!';
  }
}

const main = async () => {
  setSearchbarStyle();
  bindSelect();

  const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement | null;
  if (mainCanvas == null) {
    throw new Error('Could not find #main-canvas');
  }

  const unitCanvas = document.getElementById('units-canvas') as HTMLCanvasElement | null;
  if (unitCanvas == null) {
    throw new Error('Could not find #units-canvas');
  }

  const hashValue = readHash();
  const stepSize = stepSizeForHash(hashValue);
  const graphData = await fetchData(hashValue);

  const graphRenderer = new CanvasLineGraphRenderer(
    mainCanvas, unitCanvas, stepSize, 1
  );

  refreshHandle = () => {
    const hashValue = readHash();
    const stepSize = stepSizeForHash(hashValue);
    fetchData(hashValue).then(data => {
      graphRenderer.setStepsize(stepSize);
      graphRenderer.ingestData(data, unitsForReadingType(readingType));
      graphRenderer.render();
      graphRenderer.drawLegend(data);
    });
  };

  window.addEventListener('hashchange', async () => {
    const hashValue = readHash();
    setSearchbarStyle();

    if (hashValue.includes('history=')) {
      const dateInput = document.getElementById('date-input') as HTMLInputElement | null;
      if (dateInput == null) {
        throw new Error('couldnt get date input');
      }
      const [year, month, day] = dateInput.value.split("-");
      const d = await fetchHistory(year, month, day);
      const stepSize = stepSizeForHash(hashValue);
      graphRenderer.setStepsize(stepSize);
      graphRenderer.ingestData(d, unitsForReadingType(readingType));
      graphRenderer.render();
    } else {
      const d = await fetchData(hashValue);
      const stepSize = stepSizeForHash(hashValue);
      graphRenderer.setStepsize(stepSize);
      graphRenderer.ingestData(d, unitsForReadingType(readingType));
      graphRenderer.render();
    }
  });

  graphRenderer.render();

  mainCanvas.addEventListener('touchend', (touchEv: TouchEvent) => {
    const touch = touchEv.changedTouches[0];
    const x = touch.clientX;
    graphRenderer.setCursorPosition(x);
    graphRenderer.render();
  });

  mainCanvas.addEventListener('touchmove', (touchEv: TouchEvent) => {
    const touch = touchEv.changedTouches[0];
    const x = touch.clientX;
    graphRenderer.setCursorPosition(x);
    graphRenderer.render();
  });

  mainCanvas.addEventListener('mouseenter', (mouseEv: MouseEvent) => {
    const x = mouseEv.clientX;
    graphRenderer.setCursorPosition(x);
    graphRenderer.render();
  });

  mainCanvas.addEventListener('mouseleave', (_mouseEv: MouseEvent) => {
    graphRenderer.setCursorPosition(null);
    graphRenderer.render();
  });

  mainCanvas.addEventListener('mousemove', (mouseEv: MouseEvent) => {
    const x = mouseEv.clientX;
    graphRenderer.setCursorPosition(x);
    graphRenderer.render();
  });

  let timeout: number | null = null;
  window.addEventListener('resize', (_e) => {
    if (timeout != null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      const mCanvas = document.getElementById('main-canvas') as HTMLCanvasElement | null;
      if (mCanvas == null) {
        throw new Error('Could not find #main-canvas');
      }

      const uCanvas = document.getElementById('units-canvas') as HTMLCanvasElement | null;
      if (uCanvas == null) {
        throw new Error('Could not find #units-canvas');
      }
      graphRenderer.handleResize(mCanvas, uCanvas);
    }, 50);
  });

  const searchButton = document.getElementById('search-button');
  if (searchButton != null) {
    searchButton.addEventListener('click', () => {
      const dateInput = document.getElementById('date-input') as HTMLInputElement | null;
      if (dateInput == null) {
        throw new Error("Couldn't find date-input");
      }

      const dateParts = dateInput.value.split("-");
      const [year, month, day] = dateParts;
      window.location.hash = `#history=${year}-${month}-${day}`;
    });
  }

  graphRenderer.ingestData(graphData, unitsForReadingType(readingType));
  graphRenderer.render();
  graphRenderer.drawLegend(graphData);
};

document.addEventListener('DOMContentLoaded', async () => {
  await main();
});
