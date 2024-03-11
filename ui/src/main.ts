import { CanvasLineGraphRenderer, ReadingTimePoint } from './graph';
import './style.css'
import './bulma.min.css'

const searchBarId = 'history-search';

type ApiResponse = Array<{id: string; name: string; description: string; points: Array<ReadingTimePoint>}>

const fetchData = async (timespan: string): Promise<ApiResponse> => {
  const graphDataResponse = await fetch(`/api/graph?last=${timespan}`, {headers: {mode: 'no-cors'}});
  return (await graphDataResponse.json()) as ApiResponse;
};

const fetchHistory = async (year: string, month: string, day: string): Promise<ApiResponse> => {
  const graphDataResponse = await fetch(`/api/history?year=${year}&month=${month}&day=${day}`, {headers: {mode: 'no-cors'}});
  return (await graphDataResponse.json()) as ApiResponse;
};

const setSearchbarStyle = () => {
  const hashValue = readHash();
  const searchBar = document.getElementById(searchBarId);
  if (searchBar != null) {
    hashValue.includes('history') ? searchBar.setAttribute("style", '') : searchBar.setAttribute('style', 'display: none');
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

const main = async () => {
  setSearchbarStyle();

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
      graphRenderer.ingestData(d);
      graphRenderer.render();
    } else {
      const d = await fetchData(hashValue);
      const stepSize = stepSizeForHash(hashValue);
      graphRenderer.setStepsize(stepSize);
      graphRenderer.ingestData(d);
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

  graphRenderer.ingestData(graphData);
  graphRenderer.render();
  graphRenderer.drawLegend(graphData);
};

document.addEventListener('DOMContentLoaded', async () => {
  await main();
});
