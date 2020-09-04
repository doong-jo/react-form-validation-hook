import { RefObject } from 'react';
import dayjs from 'dayjs';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { AFTER_ACTION, ConfigureOptionType } from './types';

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
  debounceTime?: number;
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

class FormValidator {
  action: AFTER_ACTION = AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL;

  fieldRefMap: { [key: string]: FieldRefs } = {};

  validationResults: ValidationResultType = {};

  fieldOrderCount = 0;

  isConfigure = false;

  eventSubscriptions: Subscription[] = [];

  defaultDebounceTime = 200;

  FormValidator() {
    this.isConfigure = false;
  }

  // 초기 설정
  configure({
    afterAction = AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL,
    defaultDebounceTime = this.defaultDebounceTime,
  }: ConfigureOptionType) {
    this.action = afterAction;
    this.defaultDebounceTime = defaultDebounceTime;
    this.isConfigure = true;
  }

  // (컴포넌트 umonut) 제거 시 필수로 호출 필요
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

  // invalid field로 스크롤 이동
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

  // 저장된 field를 모두 validation 수행
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

    // 모든 유효성 검사를 통과했는지 여부
    const isValidForm = validationResults.every(
      (validResult) => !validResult.invalid
    );
    if (!isValidForm) {
      // invalid된 첫번째 필드 탐색
      const firstInvalidRef: FieldType = validationResults
        .filter(({ invalid }) => invalid)
        .sort((a, b) => a.order - b.order)[0].ref;

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
    const {
      name,
      watchEvent,
      debounceTime: draftDebounceTime,
      ...validateOptions
    } = options;

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

        let targetDebounceTime = this.defaultDebounceTime;

        if (draftDebounceTime !== undefined) {
          targetDebounceTime = draftDebounceTime;
        }

        // 지정한 이벤트 리스너 삽입하고 이를 구독
        if (watchEvent) {
          const event = fromEvent(this.fieldRefMap[name].ref, watchEvent);
          const subscription = event
            .pipe(debounceTime(targetDebounceTime))
            .subscribe(() => {
              // 이벤트가 발생하면 validation 검사 수행
              this.watch(name);
            });
          this.eventSubscriptions.push(subscription);
        }

        this.fieldOrderCount = this.fieldOrderCount + 1;
      }
    };
  }

  // 이름으로 ref(Field DOM) 을 반환
  getRef(name: string) {
    if (this.fieldRefMap.hasOwnProperty(name)) {
      return this.fieldRefMap[name].ref;
    }

    return null;
  }

  // <Select> 태그에 대한 validate
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

  // string을 가지는 필드(input, textarea)에 대한 validate
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

  // 필드 validate 수행
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

  // validate 수행을 시작하며 각 Field의 특성에 따라 분기하여 처리한다
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

  // name으로 해당 field를 찾고 validation 결과를 반환
  private validateByName(name: string) {
    const findField = this.fieldRefMap[name];

    if (findField && findField.ref) {
      const { nodeName } = findField.ref;

      return this.validate(nodeName, findField);
    }

    return false;
  }

  // validation 결과로 invalid 표시를 할 수 있도록 diaptch 콜백을 호출
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

export const getRef = validator.getRef.bind(validator);

export const watch = validator.watch.bind(validator);

export const register = validator.register.bind(validator);

export const validateForm = validator.validateForm.bind(validator);

export default {
  getRef,
  watch,
  register,
  validateForm,
  useFormValidator,
  validator,
  AFTER_ACTION,
};
