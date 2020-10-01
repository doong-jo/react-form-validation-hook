"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFormValidator = void 0;
const react_1 = require("react");
const formValidator_1 = require("./formValidator");
function useFormValidator(configureOptions) {
    react_1.useEffect(() => {
        formValidator_1.validator.configure(configureOptions || {});
        return () => {
            formValidator_1.validator.clear();
        };
    }, [configureOptions]);
}
exports.useFormValidator = useFormValidator;
