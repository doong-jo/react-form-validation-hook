import { RefObject, useEffect } from 'react';
import dayjs from 'dayjs';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

type ValidOptionsType = Partial<{
  minLength: number;
  maxLength: number;
  isTruthy: any;
  isDigit: boolean;
  isEmail: boolean;
  isName: boolean;
  isEnglish: boolean;
  isKorean: boolean;
  isValidBirth: boolean;
  equalsLength: number;
  minNumber: number;
  maxNumber: number;
}>;

interface RegisterOptionType extends ValidOptionsType {
  name: string;
  watchEvent?: string;
}

interface FieldType extends HTMLElement {
  value: string;
  name: string;
  selectedOptions?: HTMLCollectionOf<HTMLOptionElement>;
  checked?: boolean;
  currentValue?: string;
}

interface FieldRefs {
  ref: FieldType;
  validateOptions: ValidOptionsType;
  invalidCallback: (draftInvalidValue: boolean) => void;
  order: number;
}

interface ValidationResultType {
  [key: string]: { invalid: boolean; ref: RefObject<FieldType>; order: number };
}

export enum AFTER_ACTION {
  SCROLL_TO_FIELD_OR_LABEL = 'SCROLL_TO_FIELD_OR_LABEL',
}

class FormValidator {
  action: AFTER_ACTION = AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL;

  fieldRefMap: { [key: string]: FieldRefs } = {};

  validationResults: ValidationResultType = {};

  fieldOrderCount = 0;

  isConfigure = false;

  eventSubscriptions: Subscription[] = [];

  FormValidator() {
    this.isConfigure = false;
  }

  configure(afterAction: AFTER_ACTION) {
    this.action = afterAction;
    this.isConfigure = true;
  }

  clear() {
    this.eventSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.fieldRefMap = {};
    this.validationResults = {};
    this.fieldOrderCount = 0;
    this.isConfigure = true;
    this.eventSubscriptions = [];
  }

  private scrollToInvalidField(ref: FieldType | null) {
    if (ref) {
      const label = ref.parentElement?.querySelector('label');
      if (label) {
        label.scrollIntoView(true);
        ref.focus();

        return;
      }
      ref.scrollIntoView(true);
      ref.focus();
    }
  }

  validateForm() {
    const validationResults: {
      invalid: boolean;
      ref: FieldType;
      order: number;
    }[] = [];

    Object.values(this.fieldRefMap).forEach((fieldRef) => {
      if (fieldRef.ref !== null) {
        const { nodeName } = fieldRef.ref;

        const valid = this.validate(nodeName, fieldRef);
        fieldRef.invalidCallback(valid);
        validationResults.push({
          invalid: !valid,
          ref: fieldRef.ref,
          order: fieldRef.order,
        });
      }
    });

    const isValidForm = validationResults.every(
      (validResult) => !validResult.invalid
    );
    if (!isValidForm) {
      const firstInvalidRef: FieldType = validationResults
        .sort((a, b) => a.order - b.order)
        .filter(({ invalid }) => invalid)[0].ref;

      switch (this.action) {
        case AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL: {
          this.scrollToInvalidField(firstInvalidRef);
        }
      }
    }

    return isValidForm;
  }

  register(
    options: RegisterOptionType,
    invalidCallback: (draftInvalidValue: boolean) => void
  ) {
    const { name, watchEvent, ...validateOptions } = options;

    // any => Various HTML ELEMENT
    return (ref: any) => {
      if (
        this.isConfigure &&
        this.fieldRefMap[name] === undefined &&
        ref !== null
      ) {
        this.fieldRefMap[name] = {
          ref: (ref as unknown) as FieldType,
          validateOptions,
          invalidCallback,
          order: this.fieldOrderCount,
        };

        if (watchEvent) {
          const event = fromEvent(this.fieldRefMap[name].ref, watchEvent);
          const subscription = event.pipe(debounceTime(200)).subscribe(() => {
            this.watch(name);
          });
          this.eventSubscriptions.push(subscription);
        }

        this.fieldOrderCount = this.fieldOrderCount + 1;
      }
    };
  }

  getRef(name: string) {
    if (this.fieldRefMap.hasOwnProperty(name)) {
      return this.fieldRefMap[name].ref;
    }

    return null;
  }

  private validateSelect(target: string, validateOptions: ValidOptionsType) {
    return this.validateField(
      validateOptions,
      (validateType, validateValue) => {
        switch (validateType) {
          case 'isTruthy':
            return validateValue === this.isTruthy(target);
        }

        return false;
      }
    );
  }

  private validateString(target: string, validateOptions: ValidOptionsType) {
    return this.validateField(
      validateOptions,
      (validateType, validateValue) => {
        switch (validateType) {
          case 'minLength':
            return this.minLength(target, validateValue);

          case 'maxLength':
            return this.maxLength(target, validateValue);

          case 'equalsLength':
            return this.equalLength(target, validateValue);

          case 'minNumber':
            return (
              !isNaN(Number(target)) &&
              this.minNumber(Number(target), validateValue)
            );

          case 'maxNumber':
            return (
              !isNaN(Number(target)) &&
              this.maxNumber(Number(target), validateValue)
            );

          case 'isDigit':
            return validateValue === this.isDigit(target);

          case 'isEmail':
            return validateValue === this.isEmail(target);

          case 'isName':
            return validateValue === this.isName(target);

          case 'isEnglish':
            return validateValue === this.isEnglish(target);

          case 'isKorean':
            return validateValue === this.isKorean(target);

          case 'isTruthy':
            return validateValue === this.isTruthy(target);

          case 'isValidBirth':
            return validateValue === this.isValidBirth(target);
        }

        return false;
      }
    );
  }

  private validateField(
    validateOptions: ValidOptionsType,
    validateCallback: (validateType: string, validateValue: any) => boolean
  ) {
    const validations: boolean[] = [];
    for (const [validateType, validateValue] of Object.entries(
      validateOptions
    )) {
      const validResult = validateCallback(validateType, validateValue);
      validations.push(validResult);
    }

    return validations.every((v) => v);
  }

  validate(nodeName: string, fieldRef: FieldRefs) {
    function getValueFromFormElement(nodeName: string, fieldRef: FieldRefs) {
      let targetValue = '';
      if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
        const { value } = fieldRef.ref;
        targetValue = value;
      }
      if (nodeName === 'SELECT') {
        const { selectedOptions } = fieldRef.ref;

        if (selectedOptions) {
          const [{ value }] = selectedOptions;
          targetValue = value;
        }
      }

      fieldRef.ref.currentValue = targetValue;

      return targetValue;
    }

    const value = getValueFromFormElement(nodeName, fieldRef);
    if (fieldRef.ref === null || !value) {
      return false;
    }

    if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
      return this.validateString(value, fieldRef.validateOptions);
    }
    if (nodeName === 'SELECT') {
      return this.validateSelect(value, fieldRef.validateOptions);
    }

    return false;
  }

  private validateByName(name: string) {
    const findField = this.fieldRefMap[name];

    if (findField && findField.ref) {
      const { nodeName } = findField.ref;

      return this.validate(nodeName, findField);
    }

    return false;
  }

  watch(name: string) {
    const isValidField = this.validateByName(name);
    this.fieldRefMap[name].invalidCallback(isValidField);
  }

  minLength({ length }: string | any[], beLength: number) {
    return length >= beLength;
  }

  maxLength({ length }: string | any[], beLength: number) {
    return length <= beLength;
  }

  isTruthy(target: any) {
    return Boolean(target);
  }

  equalLength({ length }: string | any[], beLength: number) {
    return length === beLength;
  }

  minNumber(target: number, min: number) {
    return target >= min;
  }

  maxNumber(target: number, max: number) {
    return target <= max;
  }

  isDigit(target: string) {
    return /^[0-9]+$/.test(target);
  }

  isEmail(target: string) {
    // reference: https://stackoverflow.com/a/46181/10486818
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      target
    );
  }

  isName(target: string) {
    return !/[^A-Za-z가-힣 ]/g.test(target);
  }

  isEnglish(target: string) {
    return !/[^A-Za-z ]/g.test(target);
  }

  isKorean(target: string) {
    return !/[^가-힣]/g.test(target);
  }

  isValidBirth(target: string) {
    return (
      dayjs(target).isValid() &&
      dayjs(target).isBefore(dayjs()) &&
      dayjs(target).isAfter(dayjs('19000101'))
    );
  }
}

export const validator = new FormValidator();

export function useFormValidator(afterAction: AFTER_ACTION) {
  useEffect(() => {
    validator.configure(afterAction);

    return () => {
      validator.clear();
    };
  }, [afterAction]);
}

export const getRef = validator.getRef.bind(validator);

export const watch = validator.watch.bind(validator);
1;
