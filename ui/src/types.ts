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

export interface ReadingTimePoint {
  reading_value: number;
  reading_date: number;
}

export interface ILineStyle {
  color: string;
  fontColor: string;
  width: number;
}

export interface IFillStyle {
  color: string;
}

export interface ITextStyle {
  font: string;
  color: string;
  size: number;
}

export const defaultLineWidthPx = 2;

export interface IGraphStyle {
  backgroundStyle: IFillStyle;
  defaultLineStyle: ILineStyle;
  defaultTextStyle: ITextStyle;
  borderLineStyle?: ILineStyle;
  cursorLineStyle?: ILineStyle;
  xAxisLineStyle?: ILineStyle;
  yAxisLineStyle?: ILineStyle;
  yAxisLegendStyle: ITextStyle;
  tooltipTopMargin: number;
  tooltipHeight: number;
  tooltipSeparation: number;
  tooltipWidth: number;
  tooltipDateWidth: number;
  tooltipInnerPadding: number;
  tooltipTurnaroundPx: number;
  tooltipDistanceFromCursor: number;
  tooltipDateColor: string;
  tooltipFont: string;
  tooltipBackground: string;
}

interface ApiResponsePart {
  id: string;
  name: string;
  color_hex_code: string;
  font_hex_code: string;
  description: string;
  points: Array<ReadingTimePoint>;
}

export type ApiResponse = Array<ApiResponsePart>;
