import { useEffect } from 'react';
import { AFTER_ACTION, validator } from './formValidator';

export function useFormValidator(afterAction: AFTER_ACTION) {
  useEffect(() => {
    validator.configure(afterAction);

    return () => {
      validator.clear();
    };
  }, [afterAction]);
}
