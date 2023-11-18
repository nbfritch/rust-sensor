import { CanvasLineGraphRenderer, TemperatureTimePoint } from './graph';
import './style.css'
import './bulma.min.css'

type ApiResponse = Array<{id: string, points: Array<TemperatureTimePoint>}>

const fetchData = async (timespan: string): Promise<ApiResponse> => {
  const graphDataResponse = await fetch(`/api/graph?last=${timespan}`, {headers: {mode: 'no-cors'}});
    return (await graphDataResponse.json()) as ApiResponse;
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
    const d = await fetchData(hashValue);
    const stepSize = stepSizeForHash(hashValue);
    graphRenderer.setStepsize(stepSize);
    graphRenderer.ingestData(d);
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

  graphRenderer.ingestData(graphData);
};

document.addEventListener('DOMContentLoaded', async () => {
  await main();
});
