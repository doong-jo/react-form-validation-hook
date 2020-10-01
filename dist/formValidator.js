"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateForm = exports.register = exports.watch = exports.getRef = exports.validator = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const types_1 = require("./types");
class FormValidator {
    constructor() {
        this.action = types_1.AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL;
        this.fieldRefMap = {};
        this.validationResults = {};
        this.fieldOrderCount = 0;
        this.isConfigure = false;
        this.eventSubscriptions = [];
        this.defaultDebounceTime = 200;
    }
    FormValidator() {
        this.isConfigure = false;
    }
    // 초기 설정
    configure({ afterAction = types_1.AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL, defaultDebounceTime = this.defaultDebounceTime, }) {
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
    scrollToInvalidField(ref) {
        var _a;
        if (ref) {
            const label = (_a = ref.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('label');
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
        const validationResults = [];
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
        const isValidForm = validationResults.every((validResult) => !validResult.invalid);
        if (!isValidForm) {
            // invalid된 첫번째 필드 탐색
            const firstInvalidRef = validationResults
                .filter(({ invalid }) => invalid)
                .sort((a, b) => a.order - b.order)[0].ref;
            switch (this.action) {
                case types_1.AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL: {
                    this.scrollToInvalidField(firstInvalidRef);
                }
            }
        }
        return isValidForm;
    }
    register(options, invalidCallback) {
        const { name, watchEvent, debounceTime: draftDebounceTime } = options, validateOptions = __rest(options, ["name", "watchEvent", "debounceTime"]);
        // any => Various HTML ELEMENT
        return (ref) => {
            if (this.isConfigure &&
                this.fieldRefMap[name] === undefined &&
                ref !== null) {
                this.fieldRefMap[name] = {
                    ref: ref,
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
                    const event = rxjs_1.fromEvent(this.fieldRefMap[name].ref, watchEvent);
                    const subscription = event
                        .pipe(operators_1.debounceTime(targetDebounceTime))
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
    getRef(name) {
        if (this.fieldRefMap.hasOwnProperty(name)) {
            return this.fieldRefMap[name].ref;
        }
        return null;
    }
    // <Select> 태그에 대한 validate
    validateSelect(target, validateOptions) {
        return this.validateField(validateOptions, (validateType, validateValue) => {
            switch (validateType) {
                case 'isTruthy':
                    return validateValue === this.isTruthy(target);
            }
            return false;
        });
    }
    // string을 가지는 필드(input, textarea)에 대한 validate
    validateString(target, validateOptions) {
        return this.validateField(validateOptions, (validateType, validateValue) => {
            switch (validateType) {
                case 'minLength':
                    return this.minLength(target, validateValue);
                case 'maxLength':
                    return this.maxLength(target, validateValue);
                case 'equalsLength':
                    return this.equalLength(target, validateValue);
                case 'minNumber':
                    return (!isNaN(Number(target)) &&
                        this.minNumber(Number(target), validateValue));
                case 'maxNumber':
                    return (!isNaN(Number(target)) &&
                        this.maxNumber(Number(target), validateValue));
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
        });
    }
    // 필드 validate 수행
    validateField(validateOptions, validateCallback) {
        const validations = [];
        for (const [validateType, validateValue] of Object.entries(validateOptions)) {
            const validResult = validateCallback(validateType, validateValue);
            validations.push(validResult);
        }
        return validations.every((v) => v);
    }
    // validate 수행을 시작하며 각 Field의 특성에 따라 분기하여 처리한다
    validate(nodeName, fieldRef) {
        function getValueFromFormElement(nodeName, fieldRef) {
            let targetValue = '';
            if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
                const { value } = fieldRef.ref;
                targetValue = value;
            }
            if (nodeName === 'SELECT') {
                const { selectedOptions } = fieldRef.ref;
                if (selectedOptions) {
                    targetValue = selectedOptions[0].value;
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
    validateByName(name) {
        const findField = this.fieldRefMap[name];
        if (findField && findField.ref) {
            const { nodeName } = findField.ref;
            return this.validate(nodeName, findField);
        }
        return false;
    }
    // validation 결과로 invalid 표시를 할 수 있도록 diaptch 콜백을 호출
    watch(name) {
        const isValidField = this.validateByName(name);
        this.fieldRefMap[name].invalidCallback(isValidField);
    }
    minLength({ length }, beLength) {
        return length >= beLength;
    }
    maxLength({ length }, beLength) {
        return length <= beLength;
    }
    isTruthy(target) {
        return Boolean(target);
    }
    equalLength({ length }, beLength) {
        return length === beLength;
    }
    minNumber(target, min) {
        return target >= min;
    }
    maxNumber(target, max) {
        return target <= max;
    }
    isDigit(target) {
        return /^[0-9]+$/.test(target);
    }
    isEmail(target) {
        // reference: https://stackoverflow.com/a/46181/10486818
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(target);
    }
    isName(target) {
        return !/[^A-Za-z가-힣 ]/g.test(target);
    }
    isEnglish(target) {
        return !/[^A-Za-z ]/g.test(target);
    }
    isKorean(target) {
        return !/[^가-힣]/g.test(target);
    }
    isValidBirth(target) {
        return (dayjs_1.default(target).isValid() &&
            dayjs_1.default(target).isBefore(dayjs_1.default()) &&
            dayjs_1.default(target).isAfter(dayjs_1.default('19000101')));
    }
}
exports.validator = new FormValidator();
exports.getRef = exports.validator.getRef.bind(exports.validator);
exports.watch = exports.validator.watch.bind(exports.validator);
exports.register = exports.validator.register.bind(exports.validator);
exports.validateForm = exports.validator.validateForm.bind(exports.validator);
exports.default = {
    getRef: exports.getRef,
    watch: exports.watch,
    register: exports.register,
    validateForm: exports.validateForm,
    validator: exports.validator,
    AFTER_ACTION: types_1.AFTER_ACTION,
};
