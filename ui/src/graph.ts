import { ApiResponse, IGraphStyle, IGraphBounds, IDataPoint, ReadingTimePoint } from './types';
import { defaultGraphStyle, defaultLineWidthPx } from './style';

const defaultYaxisStep = 3 * 60;
const now = new Date().getTime();
const defaultGraphBounds: IGraphBounds = {
  x: {
    lower: 60,
    upper: 80,
  },
  y: {
    lower: now - 3 * 60,
    upper: now,
  },
};

const prettyDate = (dateNumber: number): string => {
  const d = new Date(dateNumber * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minutes = d.getMinutes();
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const displayHours = hour == 12 || hour == 0 ? 12 : hour % 12;
  const displayMinutes = minutes < 10 ? `0${minutes} ${amPm}` : `${minutes} ${amPm}`;

  return `${month}/${day} ${displayHours}:${displayMinutes}`;
};

const degrees360 = Math.PI + (Math.PI * 3) / 2;

export class CanvasLineGraphRenderer {
  private bounds: IGraphBounds = defaultGraphBounds;
  private drawableWidth: number;
  private drawableHeight: number;
  private unitWidth: number;
  private unitHeight: number;
  private mainCtx: CanvasRenderingContext2D;
  private unitCtx: CanvasRenderingContext2D;
  private lineData: Record<string, Array<IDataPoint<ReadingTimePoint>>> = {};
  private cursorPosition: number | null = null;
  private unitLabel: string = '°F';
  private lineColorIdx: Record<string, string> = {};
  private fontColorIdx: Record<string, string> = {};

  constructor(
    private mainCanvas: HTMLCanvasElement,
    private yAxisCanvas: HTMLCanvasElement,
    private xAxisInterval: number,
    private yAxisInterval: number = defaultYaxisStep,
    private style: IGraphStyle = defaultGraphStyle,
  ) {
    const mainCanvasDim = mainCanvas.getClientRects()[0];
    this.drawableWidth = mainCanvasDim.width;
    this.drawableHeight = mainCanvasDim.height;
    this.mainCanvas.setAttribute('height', this.drawableHeight.toString());
    this.mainCanvas.setAttribute('width', this.drawableWidth.toString());
    const mainCanvasCtx = mainCanvas.getContext('2d');
    if (mainCanvasCtx == null) {
      throw new Error('Failed to get 2d context for main canvas');
    }
    this.mainCtx = mainCanvasCtx;

    const unitCanvasDim = yAxisCanvas.getClientRects()[0];
    this.unitWidth = unitCanvasDim.width;
    this.unitHeight = unitCanvasDim.height;
    this.yAxisCanvas.setAttribute('height', this.unitHeight.toString());
    this.yAxisCanvas.setAttribute('width', this.unitWidth.toString());
    const unitCanvasCtx = yAxisCanvas.getContext('2d');
    if (unitCanvasCtx == null) {
      throw new Error('Failed to get 2d context for util canvas');
    }
    this.unitCtx = unitCanvasCtx;
  }

  public render() {
    this.clear();
    this.drawOuterBorder();
    this.drawHorizontalAxisLines();
    this.drawVerticalAxisLines();
    this.drawYaxisLegend();
    this.drawLines();
    this.drawHiglightedPoints();
    this.drawCursor();
  }

  public setStepsize(stepSize: number): void {
    this.xAxisInterval = stepSize;
  }

  public ingestData(data: ApiResponse, label: string) {
    this.unitLabel = label;
    this.lineData = {};
    this.fontColorIdx = {};
    this.lineColorIdx = {};
    let g: Record<string, Array<ReadingTimePoint>> = {};
    let minTime: number | null = null;
    let maxTime: number | null = null;
    let minValue: number | null = null;
    let maxValue: number | null = null;
    data.forEach((sensor) => {
      g[sensor.id] = sensor.points;
      this.fontColorIdx[sensor.id] = sensor.font_hex_code;
      this.lineColorIdx[sensor.id] = sensor.color_hex_code;
      sensor.points.forEach((point) => {
        if (maxTime == null || point.reading_date > maxTime) {
          maxTime = point.reading_date;
        }

        if (minTime == null || point.reading_date < minTime) {
          minTime = point.reading_date;
        }

        if (maxValue == null || point.reading_value > maxValue) {
          maxValue = point.reading_value;
        }

        if (minValue == null || point.reading_value < minValue) {
          minValue = point.reading_value;
        }
      });
    });

    if (minValue == null || maxValue == null || minTime == null || maxTime == null) {
      throw new Error('Did not get any data');
    }

    const graphBounds: IGraphBounds = {
      x: { lower: minTime, upper: maxTime },
      y: { lower: Math.floor(minValue) - 2, upper: Math.ceil(maxValue) + 2 },
    };

    this.bounds = graphBounds;

    Object.keys(g).forEach((line) => {
      this.lineData[line] = g[line]
        .map((point) => {
          return {
            original: point,
            x: this.projectX(point.reading_date),
            y: this.projectY(point.reading_value),
          };
        })
        .sort((a, b) => a.x - b.x);
    });
  }

  private reprojectData() {
    Object.keys(this.lineData).forEach((line) => {
      this.lineData[line] = this.lineData[line]
        .map((point) => {
          return {
            ...point,
            x: this.projectX(point.original.reading_date),
            y: this.projectY(point.original.reading_value),
          };
        })
        .sort((a, b) => a.x - b.x);
    });
  }

  public setCursorPosition(position: number | null): void {
    this.cursorPosition = position != null ? position - this.unitWidth : position;
  }

  public handleResize(mainCanvas: HTMLCanvasElement, yAxisCanvas: HTMLCanvasElement) {
    this.mainCanvas = mainCanvas;
    this.yAxisCanvas = yAxisCanvas;
    const mainCanvasDim = mainCanvas.getClientRects()[0];
    this.drawableWidth = mainCanvasDim.width;
    this.drawableHeight = mainCanvasDim.height;
    this.mainCanvas.setAttribute('height', this.drawableHeight.toString());
    this.mainCanvas.setAttribute('width', this.drawableWidth.toString());
    const mainCanvasCtx = mainCanvas.getContext('2d');
    if (mainCanvasCtx == null) {
      throw new Error('Failed to get 2d context for main canvas');
    }
    this.mainCtx = mainCanvasCtx;

    const unitCanvasDim = yAxisCanvas.getClientRects()[0];
    this.unitWidth = unitCanvasDim.width;
    this.unitHeight = unitCanvasDim.height;
    this.yAxisCanvas.setAttribute('height', this.unitHeight.toString());
    this.yAxisCanvas.setAttribute('width', this.unitWidth.toString());
    const unitCanvasCtx = yAxisCanvas.getContext('2d');
    if (unitCanvasCtx == null) {
      throw new Error('Failed to get 2d context for util canvas');
    }
    this.unitCtx = unitCanvasCtx;
    this.reprojectData();
  }

  private clear() {
    [this.mainCtx, this.unitCtx].forEach((c) => {
      c.fillStyle = this.style.backgroundStyle.color;
      c.fillRect(0, 0, this.drawableWidth, this.drawableHeight);
    });
  }

  private drawOuterBorder(): void {
    const { color, width } = this.style.borderLineStyle ?? this.style.defaultLineStyle;
    const lineOffset = width / 2;
    const w = this.drawableWidth - lineOffset;
    const h = this.drawableHeight - lineOffset;
    const ctx = this.mainCtx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(lineOffset, lineOffset);
    ctx.lineTo(lineOffset, h);
    ctx.moveTo(lineOffset, lineOffset);
    ctx.lineTo(w, lineOffset);
    ctx.moveTo(w, h);
    ctx.lineTo(w, lineOffset);
    ctx.moveTo(w, h);
    ctx.lineTo(lineOffset, h);
    ctx.stroke();
  }

  // Convert a value within the x bounds to canvas px
  private projectX(x: number): number {
    const range = this.bounds.x.upper - this.bounds.x.lower;
    const percentage = (x - this.bounds.x.lower) / range;
    return Math.floor(percentage * this.drawableWidth);
  }

  // Convert a value within the y bounds to canvas px
  private projectY(y: number): number {
    const range = this.bounds.y.upper - this.bounds.y.lower;
    const percentage = (y - this.bounds.y.lower) / range;
    return Math.floor(this.drawableHeight - this.drawableHeight * percentage);
  }

  private drawVerticalAxisLines() {
    const { color, width } = this.style.xAxisLineStyle ?? this.style.defaultLineStyle;
    const lineOffset = width / 2;
    this.mainCtx.strokeStyle = color;
    this.mainCtx.lineWidth = width;
    for (let i = this.bounds.x.lower; i < this.bounds.x.upper; i = i + this.xAxisInterval) {
      const px = this.projectX(i) + lineOffset;
      this.mainCtx.beginPath();
      this.mainCtx.moveTo(px, 0);
      this.mainCtx.lineTo(px, this.drawableHeight);
      this.mainCtx.stroke();
    }
  }

  private drawHorizontalAxisLines() {
    const { color, width } = this.style.yAxisLineStyle ?? this.style.defaultLineStyle;
    const lineOffset = width / 2;
    this.mainCtx.strokeStyle = color;
    this.mainCtx.lineWidth = width;
    let d = this.yAxisInterval;
    if (this.bounds.y.upper - this.bounds.y.lower > 50) {
      d = 5000;
    }
    for (let i = this.bounds.y.lower; i < this.bounds.y.upper; i = i + d) {
      const px = this.projectY(i) + lineOffset;
      this.mainCtx.beginPath();
      this.mainCtx.moveTo(0, px);
      this.mainCtx.lineTo(this.drawableWidth, px);
      this.mainCtx.stroke();
    }
  }

  private drawYaxisLegend() {
    const { color, font, size } = this.style.yAxisLegendStyle ?? this.style.defaultTextStyle;
    const offset = size / 4;
    this.unitCtx.fillStyle = color;
    this.unitCtx.font = `${size}px ${font}`;
    let d = this.yAxisInterval;
    if (this.bounds.y.upper - this.bounds.y.lower > 50) {
      d = 5000;
    }
    for (let i = this.bounds.y.lower + this.yAxisInterval; i < this.bounds.y.upper; i = i + d) {
      const px = this.projectY(i) + offset;
      this.unitCtx.fillText(`${i}${this.unitLabel}`, 5, px);
    }
  }

  private drawLines() {
    Object.keys(this.lineData).forEach((line) => {
      const color = this.lineColorIdx[line];
      const points = this.lineData[line];
      this.mainCtx.strokeStyle = color;
      this.mainCtx.lineWidth = defaultLineWidthPx;
      this.mainCtx.beginPath();
      const { x: initX, y: initY } = points[0];
      this.mainCtx.moveTo(initX, initY);
      for (let i = 1; i < points.length; i++) {
        const { x, y } = points[i];
        this.mainCtx.lineTo(x, y);
      }
      this.mainCtx.stroke();
    });
  }

  private drawCursor() {
    if (this.cursorPosition == null) {
      return;
    }
    const { color, width } = this.style.cursorLineStyle ?? this.style.defaultLineStyle;
    this.mainCtx.strokeStyle = color;
    this.mainCtx.lineWidth = width;
    this.mainCtx.beginPath();
    this.mainCtx.moveTo(this.cursorPosition, 0);
    this.mainCtx.lineTo(this.cursorPosition, this.drawableHeight);
    this.mainCtx.stroke();
  }

  private drawHiglightedPoints() {
    if (this.cursorPosition == null) {
      return;
    }
    const pos = this.cursorPosition;
    let hoveredDate: number | null = null;
    let closestPointsToCursor: Record<string, IDataPoint<ReadingTimePoint>> = {};
    Object.keys(this.lineData).forEach((line) => {
      if (this.lineData[line].length > 0) {
        const point = this.lineData[line]
          .map((x) => ({ ...x }))
          .sort((a, b) => Math.abs(a.x - pos) - Math.abs(b.x - pos))[0];
        hoveredDate = point.original.reading_date;
        closestPointsToCursor[line] = point;
      }
    });

    let topPadding = this.style.tooltipTopMargin;
    const separationPadding = this.style.tooltipSeparation;
    const height = this.style.tooltipHeight;
    const {
      tooltipInnerPadding,
      tooltipDateWidth,
      tooltipTurnaroundPx,
      tooltipWidth,
      tooltipDistanceFromCursor,
      tooltipDateColor,
      tooltipFont,
      tooltipBackground,
    } = this.style;

    if (pos < this.drawableWidth - tooltipTurnaroundPx) {
      this.mainCtx.fillStyle = tooltipBackground;
      this.mainCtx.fillRect(pos + tooltipDistanceFromCursor, topPadding, tooltipDateWidth, height);
      this.mainCtx.fillStyle = tooltipDateColor;
      this.mainCtx.font = tooltipFont;
      if (hoveredDate != null) {
        this.mainCtx.fillText(
          prettyDate(hoveredDate),
          pos + tooltipDistanceFromCursor + tooltipInnerPadding,
          topPadding + height - tooltipInnerPadding,
        );
      }
    } else {
      this.mainCtx.fillStyle = tooltipBackground;
      this.mainCtx.fillRect(pos - (tooltipDistanceFromCursor + tooltipDateWidth), topPadding, tooltipDateWidth, height);
      this.mainCtx.fillStyle = tooltipDateColor;
      this.mainCtx.font = tooltipFont;
      if (hoveredDate != null) {
        this.mainCtx.fillText(
          prettyDate(hoveredDate),
          pos - (tooltipDistanceFromCursor + tooltipDateWidth - tooltipInnerPadding),
          topPadding + height - tooltipInnerPadding,
        );
      }
    }

    topPadding = topPadding + separationPadding + height;

    Object.keys(closestPointsToCursor)
      .sort((a, b) => closestPointsToCursor[b].original.reading_value - closestPointsToCursor[a].original.reading_value)
      .forEach((line) => {
        const color = this.lineColorIdx[line];
        const fontColor = this.fontColorIdx[line];
        const point = closestPointsToCursor[line];
        this.mainCtx.beginPath();
        this.mainCtx.strokeStyle = color;
        this.mainCtx.arc(point.x, point.y, 4, 0, degrees360);
        this.mainCtx.stroke();

        this.mainCtx.beginPath();
        this.mainCtx.lineWidth = defaultLineWidthPx;
        if (pos < this.drawableWidth - tooltipTurnaroundPx) {
          this.mainCtx.fillStyle = tooltipBackground;
          this.mainCtx.fillRect(pos + tooltipDistanceFromCursor, topPadding, tooltipWidth, height);
          this.mainCtx.fillStyle = fontColor;
          this.mainCtx.font = tooltipFont;
          this.mainCtx.fillText(
            `${point.original.reading_value.toFixed(2)}${this.unitLabel}`,
            pos + tooltipDistanceFromCursor + tooltipInnerPadding,
            topPadding + height - tooltipInnerPadding,
          );
        } else {
          this.mainCtx.fillStyle = tooltipBackground;
          this.mainCtx.fillRect(pos - (tooltipDistanceFromCursor + tooltipWidth), topPadding, tooltipWidth, height);
          this.mainCtx.fillStyle = fontColor;
          this.mainCtx.font = tooltipFont;
          this.mainCtx.fillText(
            `${point.original.reading_value.toFixed(2)}${this.unitLabel}`,
            pos - (tooltipDistanceFromCursor + tooltipWidth) + tooltipInnerPadding,
            topPadding + height - tooltipInnerPadding,
          );
        }

        this.mainCtx.stroke();

        topPadding = topPadding + separationPadding + height;
      });
  }

  public drawLegend(data: Array<{ id: string; name: string; description: string }>) {
    const legendContainer = document.getElementById('app-footer');
    if (legendContainer == null) {
      throw new Error('Cannot find legend container');
    }
    legendContainer.innerHTML = '';

    data.forEach((sensor) => {
      const color = this.lineColorIdx[sensor.id];
      const legendId = `legend-${sensor.id}`;
      const legendEl = document.createElement('div');
      legendEl.setAttribute('id', legendId);
      legendEl.classList.add('graph-legend');
      legendContainer.appendChild(legendEl);

      const swatch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      swatch.setAttribute('id', `legend-swatch-${sensor.id}`);
      swatch.setAttribute('height', '16');
      swatch.setAttribute('width', '26');
      legendEl.appendChild(swatch);

      const swatchRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      swatchRect.setAttribute('x', '0');
      swatchRect.setAttribute('y', '0');
      swatchRect.setAttribute('height', '16');
      swatchRect.setAttribute('width', '16');
      swatchRect.setAttribute('fill', color);
      swatchRect.setAttribute('stroke', 'black');
      swatchRect.setAttribute('stroke-width', '1');
      swatch.appendChild(swatchRect);

      const sensorNameEl = document.createElement('span');
      sensorNameEl.innerText = `${sensor.description} `;
      legendEl.appendChild(sensorNameEl);
    });
  }
}
