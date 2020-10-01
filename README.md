# react-form-validation-hook
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/doong-jo/react-form-validation-hook/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react-form-validation-hook.svg?style=flat)](https://www.npmjs.com/package/react-form-validation-hook)

React Custom hook library for validating react forms

Validate fields used in form.

```typescript
 import { register, useFormValidator, validateForm, AFTER_ACTION } from './formValidator';

  const VALIDATOR_CONFIGS = {
    afterAction: AFTER_ACTION.SCROLL_TO_FIELD_OR_LABEL,
    defaultDebounceTime: 500, // default: 200
  };

 function MyComponent() {
   const [isInValid, setInValid] = useState(false);
   useFormValidator(VALIDATOR_CONFIGS);

   function handleSubmit() {
      validateForm();
   }

  <form>
   // simple case
    <input
        ref={register(
          {
            name: 'yourEmail', // Identify the field by name.
            isEmail: true,
            minLength: 6,
            maxLength: 100,
            watchEvent: 'input', // Specifies the event to run validation.
          },
          setInValid,
        )}
    />

   // additional case
    <input
        ref={register(
          {
            name: 'yourEmail',
            isEmail: true,
            minLength: 6,
            maxLength: 100,
            debounceTime: 1000, // Set the deboucneTime yourself
          },
          setInValid,
        )}{
        onBlur={() => { // You can write code that detects changes in events yourself.
          watch('yourEmail');
        }}}
    />
    {isInvalid && 'Invalid email!'}
    <button type="submit" onClick={handleSubmit}>Submit</button>
  </form>
 }
 ```
