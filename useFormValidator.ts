import { useEffect} from 'react';

import { ConfigureOptionType } from './types';
import { validator } from './formValidator';

export function useFormValidator(configureOptions?: ConfigureOptionType) {
  useEffect(() => {
    validator.configure(configureOptions || {});

    return () => {
      validator.clear();
    };
  }, [configureOptions]);
}
