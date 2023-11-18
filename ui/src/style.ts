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

export interface IGraphStyle {
  backgroundStyle: IFillStyle;
  defaultLineStyle: ILineStyle;
  defaultTextStyle: ITextStyle;
  borderLineStyle?: ILineStyle;
  cursorLineStyle?: ILineStyle;
  xAxisLineStyle?: ILineStyle;
  yAxisLineStyle?: ILineStyle;
  yAxisLegendStyle: ITextStyle;
  dataLineStyle: Record<string, ILineStyle>;
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
    size: 20,
  },
  dataLineStyle: {
    "1": {
      color: 'orange',
      fontColor: 'orange',
      width: 2,
    },
    "2": {
      color: 'cornflowerblue',
      fontColor: 'cyan',
      width: 2,
    },
    "3": {
      color: 'green',
      fontColor: 'lime',
      width: 2,
    },
    "9": {
      color: 'violet',
      fontColor: 'violet',
      width: 2,
    }
  },
};