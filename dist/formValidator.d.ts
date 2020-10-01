import { RefObject } from 'react';
import { Subscription } from 'rxjs';
import { AFTER_ACTION, ConfigureOptionType } from './types';
declare type ValidOptionsType = Partial<{
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
    [key: string]: {
        invalid: boolean;
        ref: RefObject<FieldType>;
        order: number;
    };
}
declare class FormValidator {
    action: AFTER_ACTION;
    fieldRefMap: {
        [key: string]: FieldRefs;
    };
    validationResults: ValidationResultType;
    fieldOrderCount: number;
    isConfigure: boolean;
    eventSubscriptions: Subscription[];
    defaultDebounceTime: number;
    FormValidator(): void;
    configure({ afterAction, defaultDebounceTime, }: ConfigureOptionType): void;
    clear(): void;
    private scrollToInvalidField;
    validateForm(): boolean;
    register(options: RegisterOptionType, invalidCallback: (draftInvalidValue: boolean) => void): (ref: any) => void;
    getRef(name: string): FieldType | null;
    private validateSelect;
    private validateString;
    private validateField;
    validate(nodeName: string, fieldRef: FieldRefs): boolean;
    private validateByName;
    watch(name: string): void;
    minLength({ length }: string | any[], beLength: number): boolean;
    maxLength({ length }: string | any[], beLength: number): boolean;
    isTruthy(target: any): boolean;
    equalLength({ length }: string | any[], beLength: number): boolean;
    minNumber(target: number, min: number): boolean;
    maxNumber(target: number, max: number): boolean;
    isDigit(target: string): boolean;
    isEmail(target: string): boolean;
    isName(target: string): boolean;
    isEnglish(target: string): boolean;
    isKorean(target: string): boolean;
    isValidBirth(target: string): boolean;
}
export declare const validator: FormValidator;
export declare const getRef: (name: string) => FieldType | null;
export declare const watch: (name: string) => void;
export declare const register: (options: RegisterOptionType, invalidCallback: (draftInvalidValue: boolean) => void) => (ref: any) => void;
export declare const validateForm: () => boolean;
declare const _default: {
    getRef: (name: string) => FieldType | null;
    watch: (name: string) => void;
    register: (options: RegisterOptionType, invalidCallback: (draftInvalidValue: boolean) => void) => (ref: any) => void;
    validateForm: () => boolean;
    validator: FormValidator;
    AFTER_ACTION: typeof AFTER_ACTION;
};
export default _default;
