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

export const defaultGraphStyle: IGraphStyle = {
  backgroundStyle: {
    color: 'rgb(250, 250, 250)',
  },
  defaultLineStyle: {
    color: 'rgb(0, 0, 0)',
    fontColor: 'rgb(255, 255, 255)',
    width: 1,
  },
  defaultTextStyle: {
    color: 'rgb(14, 14, 14)',
    font: 'Serif',
    size: 14,
  },
  cursorLineStyle: {
    color: 'rgb(250, 30, 30)',
    fontColor: 'rgb(5, 5, 5)',
    width: 2,
  },
  borderLineStyle: {
    color: 'rgb(15, 15, 15)',
    fontColor: 'rgb(255, 255, 255)',
    width: 2,
  },
  xAxisLineStyle: {
    color: 'rgb(124, 124, 124)',
    fontColor: 'rgb(0, 0, 0)',
    width: 1,
  },
  yAxisLineStyle: {
    color: 'rgb(124, 124, 124)',
    fontColor: 'rgb(0, 0, 0)',
    width: 1,
  },
  yAxisLegendStyle: {
    color: 'rgb(20, 20, 20)',
    font: 'sans-serif',
    size: 12,
  },
  tooltipTopMargin: 10,
  tooltipHeight: 20,
  tooltipSeparation: 10,
  tooltipWidth: 60,
  tooltipDateWidth: 110,
  tooltipInnerPadding: 5,
  tooltipTurnaroundPx: 200,
  tooltipDistanceFromCursor: 20,
  tooltipDateColor: 'red',
  tooltipFont: '14px sans-serif',
  tooltipBackground: 'black',
};
