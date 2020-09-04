export enum AFTER_ACTION {
  NONE = 'NONE',
  SCROLL_TO_FIELD_OR_LABEL = 'SCROLL_TO_FIELD_OR_LABEL',
}

export interface ConfigureOptionType {
  afterAction?: AFTER_ACTION;
  defaultDebounceTime?: number;
}
