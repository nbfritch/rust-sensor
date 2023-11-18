import { IGraphStyle, defaultGraphStyle } from "./style";

export interface IBounds {
  lower: number;
  upper: number;
}

export interface IGraphBounds {
  x: IBounds;
  y: IBounds;
}

export interface IDataPoint<T> {
  x: number;
  y: number;
  original: T;
}

export interface TemperatureTimePoint {
  temperature: number;
  reading_date: number;
}

const defaultYaxisStep = (3 * 60);
const now = new Date().getTime();
const defaultGraphBounds: IGraphBounds = {
  x: {
    lower: 60, upper: 80,
  },
  y: {
    lower: now - (3 * 60), upper: now,
  }
};

const prettyDate = (dateNumber: number): string => {
  const d = new Date(dateNumber * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minutes = d.getMinutes();
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const displayHours = hour == 12 || hour == 0 ? 12 : hour % 12;
  const displayMinutes = minutes < 10 ? `0${minutes} ${amPm}` : `${minutes} ${amPm}`

  return `${month}/${day} ${displayHours}:${displayMinutes}`;
};

const degrees360 = Math.PI + (Math.PI * 3) / 2

export class CanvasLineGraphRenderer {
  private bounds: IGraphBounds = defaultGraphBounds;
  private drawableWidth: number;
  private drawableHeight: number;
  private unitWidth: number;
  private unitHeight: number;
  private mainCtx: CanvasRenderingContext2D;
  private unitCtx: CanvasRenderingContext2D;
  private lineData: Record<string, Array<IDataPoint<TemperatureTimePoint>>> = {};
  private cursorPosition: number | null = null;

  constructor(
    private mainCanvas: HTMLCanvasElement,
    private yAxisCanvas: HTMLCanvasElement,
    private xAxisInterval: number,
    private yAxisInterval: number = defaultYaxisStep,
    private style: IGraphStyle = defaultGraphStyle
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

  public ingestData(data: Array<{ id: string, points: Array<TemperatureTimePoint> }>) {
    let g: Record<string, Array<TemperatureTimePoint>> = {};
    let minTime: number | null = null;
    let maxTime: number | null = null;
    let minTemp: number | null = null;
    let maxTemp: number | null = null;
    data.forEach(sensor => {
      g[sensor.id] = sensor.points
      sensor.points.forEach(point => {
        if (maxTime == null || point.reading_date > maxTime) {
          maxTime = point.reading_date;
        }

        if (minTime == null || point.reading_date < minTime) {
          minTime = point.reading_date;
        }

        if (maxTemp == null || point.temperature > maxTemp) {
          maxTemp = point.temperature;
        }

        if (minTemp == null || point.temperature < minTemp) {
          minTemp = point.temperature
        }
      })
    });

    if (minTemp == null || maxTemp == null || minTime == null || maxTime == null) {
      throw new Error('Did not get any data');
    }

    const graphBounds: IGraphBounds = {
      x: { lower: minTime, upper: maxTime },
      y: { lower: Math.floor(minTemp) - 2, upper: Math.ceil(maxTemp) + 2 },
    };

    this.bounds = graphBounds

    Object.keys(g).forEach(line => {
      this.lineData[line] = g[line].map(point => {
        return {
          original: point,
          x: this.projectX(point.reading_date),
          y: this.projectY(point.temperature),
        };
      }).sort((a, b) => a.x - b.x);
    });
  }

  private reprojectData() {
    Object.keys(this.lineData).forEach(line => {
      this.lineData[line] = this.lineData[line].map(point => {
        return {
          ...point,
          x: this.projectX(point.original.reading_date),
          y: this.projectY(point.original.temperature),
        }
      }).sort((a, b) => a.x - b.x);
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
    [this.mainCtx, this.unitCtx].forEach(c => {
      c.fillStyle = this.style.backgroundStyle.color;
      c.fillRect(0, 0, this.drawableWidth, this.drawableHeight);
    });
  }

  private drawOuterBorder(): void {
    const { color, width } = (this.style.borderLineStyle ?? this.style.defaultLineStyle);
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
    return Math.floor(this.drawableHeight - (this.drawableHeight * percentage));
  }

  private drawVerticalAxisLines() {
    const { color, width } = (this.style.xAxisLineStyle ?? this.style.defaultLineStyle);
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
    const { color, width } = (this.style.yAxisLineStyle ?? this.style.defaultLineStyle);
    const lineOffset = width / 2;
    this.mainCtx.strokeStyle = color;
    this.mainCtx.lineWidth = width;
    for (let i = this.bounds.y.lower; i < this.bounds.y.upper; i = i + this.yAxisInterval) {
      const px = this.projectY(i) + lineOffset;
      this.mainCtx.beginPath();
      this.mainCtx.moveTo(0, px);
      this.mainCtx.lineTo(this.drawableWidth, px);
      this.mainCtx.stroke();
    }
  }

  private drawYaxisLegend() {
    const { color, font, size } = (this.style.yAxisLegendStyle ?? this.style.defaultTextStyle);
    const offset = size / 4;
    this.unitCtx.fillStyle = color;
    this.unitCtx.font = `${size}px ${font}`;
    for (let i = this.bounds.y.lower + this.yAxisInterval; i < this.bounds.y.upper; i = i + this.yAxisInterval) {
      const px = this.projectY(i) + offset;
      this.unitCtx.fillText(`${i}°F`, 5, px);
    }
  }

  private drawLines() {
    Object.keys(this.lineData).forEach(line => {
      const { color, width } = (line in this.style.dataLineStyle ? this.style.dataLineStyle[line] : this.style.defaultLineStyle);
      const points = this.lineData[line];
      this.mainCtx.strokeStyle = color;
      this.mainCtx.lineWidth = width;
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
    const { color, width } = (this.style.cursorLineStyle ?? this.style.defaultLineStyle);
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
    const pos = this.cursorPosition
    let hoveredDate: number | null = null;
    let closestPointsToCursor: Record<string, IDataPoint<TemperatureTimePoint>> = {};
    Object.keys(this.lineData).forEach(line => {
      if (this.lineData[line].length > 0) {
        const point = this.lineData[line]
          .map(x => ({ ...x }))
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
      tooltipBackground
    } = this.style;

    if (pos < (this.drawableWidth - tooltipTurnaroundPx)) {
      this.mainCtx.fillStyle = tooltipBackground;
      this.mainCtx.fillRect(pos + tooltipDistanceFromCursor, topPadding, tooltipDateWidth, height);
      this.mainCtx.fillStyle = tooltipDateColor;
      this.mainCtx.font = tooltipFont;
      if (hoveredDate != null) {
        this.mainCtx.fillText(
          prettyDate(hoveredDate),
          pos + tooltipDistanceFromCursor + tooltipInnerPadding,
          topPadding + height - tooltipInnerPadding
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
          topPadding + height - tooltipInnerPadding
        );
      }
    }

    topPadding = topPadding + separationPadding + height;

    Object.keys(closestPointsToCursor)
      .sort((a, b) =>
        closestPointsToCursor[b].original.temperature - closestPointsToCursor[a].original.temperature)
      .forEach(line => {
        const { color, fontColor, width } = (this.style.dataLineStyle[line] ?? this.style.defaultLineStyle);
        const point = closestPointsToCursor[line];
        this.mainCtx.beginPath();
        this.mainCtx.strokeStyle = color;
        this.mainCtx.arc(point.x, point.y, 4, 0, degrees360);
        this.mainCtx.stroke();

        this.mainCtx.beginPath();
        this.mainCtx.lineWidth = width;
        if (pos < (this.drawableWidth - tooltipTurnaroundPx)) {
          this.mainCtx.fillStyle = tooltipBackground;
          this.mainCtx.fillRect(pos + tooltipDistanceFromCursor, topPadding, tooltipWidth, height);
          this.mainCtx.fillStyle = fontColor;
          this.mainCtx.font = tooltipFont;
          this.mainCtx.fillText(
            `${point.original.temperature.toFixed(2)}°F`,
            pos + tooltipDistanceFromCursor + tooltipInnerPadding,
            topPadding + height - tooltipInnerPadding
          );
        } else {
          this.mainCtx.fillStyle = tooltipBackground;
          this.mainCtx.fillRect(pos - (tooltipDistanceFromCursor + tooltipWidth), topPadding, tooltipWidth, height);
          this.mainCtx.fillStyle = fontColor;
          this.mainCtx.font = tooltipFont;
          this.mainCtx.fillText(
            `${point.original.temperature.toFixed(2)}°F`,
            pos - (tooltipDistanceFromCursor + tooltipWidth) + tooltipInnerPadding,
            topPadding + height - tooltipInnerPadding
          );
        }

        this.mainCtx.stroke();

        topPadding = topPadding + separationPadding + height;
      });
  }
}
